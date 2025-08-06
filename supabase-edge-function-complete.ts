// Supabase Edge Function for Google Drive API Integration
// รัน Deno runtime - TypeScript native support

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"

console.log("🚀 Google Drive Edge Function Starting...")

// CORS headers สำหรับ Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Service Account Credentials (จาก Environment Variables)
const getServiceAccountCredentials = () => {
  return {
    type: "service_account",
    project_id: Deno.env.get('GOOGLE_PROJECT_ID') || 'platformlogin',
    private_key_id: Deno.env.get('GOOGLE_PRIVATE_KEY_ID') || '',
    private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n') || '',
    client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL') || '',
    client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: Deno.env.get('GOOGLE_CLIENT_X509_CERT_URL') || '',
    universe_domain: "googleapis.com"
  }
}

// Helper functions for JWT creation
const base64UrlEncode = (data: string) => {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const importPrivateKey = async (pem: string) => {
  // แปลงจาก PEM format เป็น binary
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  
  // ลบ header, footer และ whitespace ทั้งหมด
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')
  
  // Decode base64
  const binaryDerString = atob(pemContents)
  const binaryDer = new Uint8Array(binaryDerString.length)
  
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i)
  }

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  )
}

// สร้าง Google Drive Access Token
const getAccessToken = async () => {
  const credentials = getServiceAccountCredentials()
  
  if (!credentials.private_key || !credentials.client_email) {
    console.error('❌ Missing credentials:', {
      hasPrivateKey: !!credentials.private_key,
      hasClientEmail: !!credentials.client_email,
      projectId: credentials.project_id
    })
    throw new Error('Missing Google Service Account credentials')
  }

  try {
    console.log('🔑 Starting token creation process...', {
      clientEmail: credentials.client_email,
      projectId: credentials.project_id
    })
    
    // สร้าง JWT โดยใช้ djwt library
    const now = getNumericDate(new Date())
    
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // 1 hour
    }

    // Import private key สำหรับ djwt
    const privateKey = await importPrivateKey(credentials.private_key)
    
    // สร้าง JWT
    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      payload,
      privateKey
    )

    console.log('🔑 JWT created successfully with djwt')

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        response: tokenData
      })
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${JSON.stringify(tokenData)}`)
    }

    console.log('✅ Access token obtained successfully')
    return tokenData.access_token
  } catch (error) {
    console.error('❌ Error getting access token:', error)
    throw error
  }
}

// Google Drive API helper
const callGoogleDriveAPI = async (endpoint: string, method = 'GET', body?: any) => {
  const accessToken = await getAccessToken()
  
  const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Drive API error: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

// Main handler
serve(async (req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/functions/v1/google-drive', '') || '/'
  const method = req.method

  console.log(`📝 ${method} ${path}`, url.pathname)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Health check - ไม่ต้อง auth  
    if (path === '/health' || path === '/' || path === '' || url.pathname.includes('/health')) {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          environment: 'supabase-edge-function',
          version: '2.0.0' // Updated version with isSharedDrive support
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // List files in Google Drive
    if ((path === '/list' || url.pathname.includes('/list')) && method === 'GET') {
      const folderId = url.searchParams.get('folderId') || 'root'
      const pageSize = parseInt(url.searchParams.get('pageSize') || '50')
      const orderBy = url.searchParams.get('orderBy') || 'modifiedTime desc'
      const isSharedDrive = url.searchParams.get('isSharedDrive') === 'true'

      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: pageSize.toString(),
        orderBy,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,iconLink)',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      })

      // เพิ่ม driveId และ corpora เฉพาะสำหรับ Shared Drive
      if (isSharedDrive) {
        params.set('corpora', 'drive')
        params.set('driveId', Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') || '')
        console.log('🔗 Using Shared Drive mode:', Deno.env.get('GOOGLE_DRIVE_FOLDER_ID'))
      } else {
        params.set('corpora', 'user')
        console.log('👤 Using My Drive mode')
      }

      const result = await callGoogleDriveAPI(`/files?${params}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          files: result.files || [],
          total: result.files?.length || 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create folder
    if ((path === '/create-folder' || url.pathname.includes('/create-folder')) && method === 'POST') {
      const body = await req.json()
      const { folderName, parentId = 'root' } = body

      if (!folderName) {
        return new Response(
          JSON.stringify({ error: 'Folder name is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }

      const result = await callGoogleDriveAPI('/files', 'POST', folderMetadata)

      return new Response(
        JSON.stringify({
          success: true,
          folder: result
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create project structure
    if ((path === '/create-course-structure' || url.pathname.includes('/create-course-structure')) && method === 'POST') {
      const body = await req.json()
      const { companySlug, courseTitle, courseSlug } = body

      if (!companySlug || !courseTitle) {
        return new Response(
          JSON.stringify({ error: 'Company slug and course title are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // สร้าง company folder หลัก
      const companyFolderName = `[${companySlug.toUpperCase()}] ${courseTitle}`
      const mainFolderResult = await callGoogleDriveAPI('/files', 'POST', {
        name: companyFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') || 'root'],
      })

      // สร้าง subfolder สำหรับ courses และ projects
      const coursesFolderResult = await callGoogleDriveAPI('/files', 'POST', {
        name: '📚 คอร์สเรียน',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mainFolderResult.id],
      })

      const projectsFolderResult = await callGoogleDriveAPI('/files', 'POST', {
        name: '🎯 โปรเจค',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mainFolderResult.id],
      })

      return new Response(
        JSON.stringify({
          success: true,
          courseFolderId: coursesFolderResult.id,
          folderIds: {
            main: mainFolderResult.id,
            courses: coursesFolderResult.id,
            projects: projectsFolderResult.id,
          },
          courseFolderName: companyFolderName
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create topic folder
    if ((path === '/create-topic-folder' || url.pathname.includes('/create-topic-folder')) && method === 'POST') {
      const body = await req.json()
      const { parentFolderId, topicName, topicType } = body

      if (!parentFolderId || !topicName) {
        return new Response(
          JSON.stringify({ error: 'Parent folder ID and topic name are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const icon = topicType === 'project' ? '🔧' : '📖'
      const folderName = `${icon} ${topicName}`

      const result = await callGoogleDriveAPI('/files', 'POST', {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      })

      return new Response(
        JSON.stringify({
          success: true,
          topicFolderId: result.id,
          folderName: result.name
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete project folder (recursive delete)
    if ((path === '/delete-project-folder' || url.pathname.includes('/delete-project-folder')) && method === 'DELETE') {
      const body = await req.json()
      const { folderId, projectTitle } = body

      if (!folderId) {
        return new Response(
          JSON.stringify({ error: 'Folder ID is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      try {
        console.log(`🗑️ Deleting folder: ${projectTitle} (${folderId})`)
        
        // Delete the folder (Google Drive will delete all contents recursively)
        await callGoogleDriveAPI(`/files/${folderId}`, 'DELETE')
        
        console.log(`✅ Folder deleted successfully: ${projectTitle}`)
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `Project folder deleted: ${projectTitle}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error(`❌ Failed to delete folder: ${error.message}`)
        throw error
      }
    }

    // Default 404 response
    return new Response(
      JSON.stringify({ error: 'Endpoint not found', path, method }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Edge Function Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
🎯 Supabase Edge Function Endpoints:

GET  /functions/v1/google-drive/health
GET  /functions/v1/google-drive/list?folderId=xxx&pageSize=50&isSharedDrive=true
POST /functions/v1/google-drive/create-folder
POST /functions/v1/google-drive/create-course-structure  
POST /functions/v1/google-drive/create-topic-folder
DELETE /functions/v1/google-drive/delete-project-folder

Environment Variables Required:
- GOOGLE_PROJECT_ID
- GOOGLE_PRIVATE_KEY_ID  
- GOOGLE_PRIVATE_KEY
- GOOGLE_CLIENT_EMAIL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_X509_CERT_URL
- GOOGLE_DRIVE_FOLDER_ID

Version: 2.0.0 - Added isSharedDrive support

📝 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
*/