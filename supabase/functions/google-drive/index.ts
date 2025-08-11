// COMPLETE FIX + SIMPLE UPLOAD - Supabase Edge Function for Google Drive API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"

console.log("🚀 Google Drive COMPLETE FIX + SIMPLE UPLOAD - Starting...")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Service Account Credentials
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

const importPrivateKey = async (pem: string) => {
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')
  
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
    throw new Error('Missing Google Service Account credentials')
  }

  try {
    const now = getNumericDate(new Date())
    
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // 1 hour
    }

    const privateKey = await importPrivateKey(credentials.private_key)
    
    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      payload,
      privateKey
    )

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
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`)
    }

    return tokenData.access_token
  } catch (error) {
    console.error('❌ Error getting access token:', error)
    throw error
  }
}

// Helper function to create multipart body for file uploads
const createMultipartBody = (metadata: any, data: Uint8Array, mimeType: string) => {
  const boundary = 'upload_boundary'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--\r\n`
  
  const metadataPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
  const dataPart = `Content-Type: ${mimeType}\r\n\r\n`
  
  // Create the full body
  const metadataBytes = new TextEncoder().encode(delimiter + metadataPart + delimiter + dataPart)
  const closingBytes = new TextEncoder().encode(closeDelimiter)
  
  const body = new Uint8Array(metadataBytes.length + data.length + closingBytes.length)
  body.set(metadataBytes, 0)
  body.set(data, metadataBytes.length)
  body.set(closingBytes, metadataBytes.length + data.length)
  
  return body
}

// Google Drive API helper
const callGoogleDriveAPI = async (endpoint: string, method = 'GET', body?: any, options?: { supportsAllDrives?: boolean, driveId?: string }) => {
  const accessToken = await getAccessToken()
  
  const url = new URL(`https://www.googleapis.com/drive/v3${endpoint}`)
  
  if (options?.supportsAllDrives) {
    url.searchParams.set('supportsAllDrives', 'true')
    url.searchParams.set('supportsTeamDrives', 'true')
  }
  
  if (options?.driveId && (method === 'POST' || method === 'PUT')) {
    url.searchParams.set('driveId', options.driveId)
  }

  console.log(`🔗 API Call: ${method} ${url.toString()}`)
  
  const response = await fetch(url.toString(), {
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

  // Handle cases where API doesn't return JSON (like DELETE operations)
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return await response.json()
  } else {
    // For DELETE operations, return success status
    return { success: true, status: response.status }
  }
}

serve(async (req: Request) => {
  console.log(`📝 Request: ${req.method} ${req.url}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Health check
    if (url.pathname.includes('/health') || url.pathname === '/') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: 'WORKING-FOLDER-ID-FIX-5.1.0'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create project structure - HARDCODE version (prevents duplicate folders)
    if (url.pathname.includes('/create-course-structure') && req.method === 'POST') {
      console.log('📁 Creating structure with HARDCODED folders from Shared Drive')

      // ✅ โฟลเดอร์ที่อยู่ใน Shared Drive จริงๆ (0AAMvBF62LaLyUk9PVA)
      // Fixed: Use working โปรเจค folder ID for all uploads
      const response = {
        success: true,
        courseFolderId: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF', // Use working โปรเจค folder ID
        folderIds: {
          main: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S',      // [LOGIN]
          courses: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF',    // Use working โปรเจค folder ID
          projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF',   // Working โปรเจค folder ID
        },
        courseFolderName: '[LOGIN]',
        isExisting: true,
        version: 'WORKING-FOLDER-ID-FIX-AUG-2025'
      }

      console.log('✅ Returning hardcoded Shared Drive folders:', response)

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create topic folder - REAL Google Drive API ✅
    if (url.pathname.includes('/create-topic-folder') && req.method === 'POST') {
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

      console.log('📁 Creating topic folder:', { parentFolderId, topicName, topicType })

      const icon = topicType === 'project' ? '🔧' : topicType === 'course_content' ? '📚' : '📖'
      const folderName = `${icon} ${topicName}`

      const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
      
      // สร้างโฟลเดอร์ใน parent ที่ถูกต้อง
      const result = await callGoogleDriveAPI('/files', 'POST', {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }, { 
        supportsAllDrives: true, 
        driveId: sharedDriveId 
      })

      console.log('✅ Topic folder created:', result.id)

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

    // Delete project folder - REAL Google Drive API ✅
    if (url.pathname.includes('/delete-project-folder') && req.method === 'DELETE') {
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

      console.log('🗑️ Deleting project folder:', { folderId, projectTitle })

      const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
      
      try {
        // ลบโฟลเดอร์และไฟล์ทั้งหมดภายใน (recursively)
        const result = await callGoogleDriveAPI(`/files/${folderId}`, 'DELETE', undefined, { 
          supportsAllDrives: true 
        })

        console.log('✅ Project folder deleted:', folderId)

        return new Response(
          JSON.stringify({
            success: true,
            deletedFolderId: folderId,
            projectTitle: projectTitle || 'Unknown Project'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ Failed to delete folder:', error)
        
        // Check if it's a 404 (folder not found) - treat as success since it's already deleted
        if (error.message && error.message.includes('404')) {
          console.log('📁 Folder not found (already deleted), treating as success')
          
          return new Response(
            JSON.stringify({
              success: true,
              deletedFolderId: folderId,
              projectTitle: projectTitle || 'Unknown Project',
              note: 'Folder was already deleted or not found'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to delete Google Drive folder: ${error.message}`,
            folderId
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Simple file upload endpoint - NEW! 📤
    if (url.pathname.includes('/simple-upload') && req.method === 'POST') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const folderId = formData.get('folderId') as string
      const fileName = formData.get('fileName') as string

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (!folderId) {
        return new Response(
          JSON.stringify({ error: 'Folder ID is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('📤 Uploading file:', fileName || file.name, 'to folder:', folderId)

      try {
        const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
        
        // Convert file to ArrayBuffer for upload
        const fileBuffer = await file.arrayBuffer()
        const fileData = new Uint8Array(fileBuffer)
        
        // Upload to Google Drive
        const accessToken = await getAccessToken()
        
        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/related; boundary="upload_boundary"'
          },
          body: createMultipartBody({
            name: fileName || file.name,
            parents: [folderId],
            mimeType: file.type || 'application/octet-stream'
          }, fileData, file.type || 'application/octet-stream')
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
        }

        const result = await uploadResponse.json()
        console.log('✅ File uploaded successfully:', result.id)

        return new Response(
          JSON.stringify({
            success: true,
            fileId: result.id,
            fileName: result.name,
            webViewLink: result.webViewLink
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ Upload error:', error)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `File upload failed: ${error.message}`
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Delete file endpoint - NEW! 🗑️
    if (url.pathname.includes('/delete-file') && req.method === 'DELETE') {
      const body = await req.json()
      const { fileId, fileName } = body

      if (!fileId) {
        return new Response(
          JSON.stringify({ error: 'File ID is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('🗑️ Deleting file:', { fileId, fileName })

      try {
        // Delete file from Google Drive
        const result = await callGoogleDriveAPI(`/files/${fileId}`, 'DELETE', undefined, { 
          supportsAllDrives: true 
        })

        console.log('✅ File deleted successfully:', fileId)

        return new Response(
          JSON.stringify({
            success: true,
            deletedFileId: fileId,
            fileName: fileName || 'Unknown File'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ Failed to delete file:', error)
        
        // Check if it's a 404 (file not found) - treat as success since it's already deleted
        if (error.message && error.message.includes('404')) {
          console.log('📄 File not found (already deleted), treating as success')
          
          return new Response(
            JSON.stringify({
              success: true,
              deletedFileId: fileId,
              fileName: fileName || 'Unknown File',
              note: 'File was already deleted or not found'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to delete Google Drive file: ${error.message}`,
            fileId
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // List files - basic implementation
    if (url.pathname.includes('/list') && req.method === 'GET') {
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

      if (isSharedDrive) {
        params.set('corpora', 'drive')
        params.set('driveId', Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') || '')
      } else {
        params.set('corpora', 'user')
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

    // Default 404 response
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found', 
        path: url.pathname, 
        method: req.method,
        availableEndpoints: ['/health', '/create-course-structure', '/create-topic-folder', '/delete-project-folder', '/simple-upload', '/delete-file', '/list']
      }),
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
🚀 COMPLETE FIX VERSION WITH SIMPLE UPLOAD - HARDCODED STRUCTURE + REAL GOOGLE DRIVE API
=====================================================================================
✅ โฟลเดอร์ที่ใช้ (ใน Shared Drive 0AAMvBF62LaLyUk9PVA):
- [LOGIN]: 1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S
- โปรเจค (Working): 148MPiUE7WLAvluF1o2VuPA2VlplzJMJF  
- All uploads go to working โปรเจค folder

🔧 Features:
- create-course-structure: Returns hardcoded correct folder IDs (no new folders created)
- create-topic-folder: REAL Google Drive API - creates actual project/course folders in Shared Drive  
- delete-project-folder: REAL Google Drive API - deletes folders recursively
- simple-upload: NEW! File upload to specific Google Drive folders
- Shared Drive support with proper driveId configuration
- Complete Google Service Account authentication
- List files endpoint with Shared Drive support

วิธีใช้:
1. Deploy ไฟล์นี้ไป Supabase Dashboard (Edge Functions)
2. ตั้งค่า Environment Variables ใน Supabase (ต้องมีครบ)
3. ทดสอบ health check
4. สร้างโปรเจค/คอร์ส - จะได้โฟลเดอร์จริงใน Google Drive
5. Upload files ผ่าน /simple-upload endpoint

Environment Variables Required:
- GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY_ID, GOOGLE_PRIVATE_KEY
- GOOGLE_CLIENT_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_X509_CERT_URL  
- GOOGLE_DRIVE_FOLDER_ID (Shared Drive ID: 0AAMvBF62LaLyUk9PVA)

🎯 SOLUTION: แก้ปัญหา missing simple-upload endpoint + เพิ่มการสร้างโฟลเดอร์คอร์สอัตโนมัติ!

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
*/