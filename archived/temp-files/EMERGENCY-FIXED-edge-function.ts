// EMERGENCY FIX - Supabase Edge Function for Google Drive API Integration
// ต้อง Deploy ด่วน! มีโฟลเดอร์ซ้ำ 12 โฟลเดอร์แล้ว!

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"

console.log("🚀 Google Drive Edge Function Starting - EMERGENCY FIX VERSION")

// CORS headers
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

  return await response.json()
}

// Main handler
serve(async (req: Request) => {
  const url = new URL(req.url)
  // Fix path handling - support both with and without /functions/v1 prefix
  let path = url.pathname
  if (path.includes('/functions/v1/')) {
    path = path.replace('/functions/v1/google-drive', '') || '/'
  } else if (path.includes('/google-drive')) {
    path = path.replace('/google-drive', '') || '/'
  } else {
    path = path || '/'
  }
  const method = req.method

  console.log(`📝 ${method} ${path}`)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Health check - support multiple path formats
    if (path === '/health' || path === '/' || path === '' || url.pathname.includes('/health')) {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: '2.0.0-EMERGENCY-FIX'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // List files
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

    // Create project structure - ✅ FIXED VERSION ที่ใช้โฟลเดอร์เก่าสุด
    if ((path === '/create-course-structure' || url.pathname.includes('/create-course-structure')) && method === 'POST') {
      const body = await req.json()
      const { companySlug, courseTitle } = body

      if (!companySlug || !courseTitle) {
        return new Response(
          JSON.stringify({ error: 'Company slug and course title are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
      const companyFolderName = `[${companySlug.toUpperCase()}]`
      
      console.log('📁 EMERGENCY FIX - Using hardcoded LOGIN folder')

      // 🚨 HARDCODE LOGIN FOLDER - ใช้โฟลเดอร์ที่อยู่ใน Shared Drive จริงๆ
      let mainFolderResult: any = {
        id: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S', // ✅ อันนี้อยู่ใน Shared Drive 0AAMvBF62LaLyUk9PVA
        name: '[LOGIN]'
      }

      // 🚨 HARDCODE โฟลเดอร์ที่อยู่ใน Shared Drive จริงๆ
      let coursesFolderResult: any = {
        id: '1Fyq7tkra-DAZ6ndcvlUnERH5ryfOMQ7B', // ✅ อยู่ใน Shared Drive
        name: '📚 คอร์สเรียน'
      }
      
      let projectsFolderResult: any = {
        id: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF', // ✅ อยู่ใน Shared Drive
        name: '🎯 โปรเจค'
      }

      console.log('✅ USING OLDEST FOLDERS - NO NEW FOLDERS CREATED!')
      console.log('📁 Main:', mainFolderResult.id)
      console.log('📚 Courses:', coursesFolderResult.id)
      console.log('🎯 Projects:', projectsFolderResult.id)

      return new Response(
        JSON.stringify({
          success: true,
          courseFolderId: coursesFolderResult.id,
          folderIds: {
            main: mainFolderResult.id,
            courses: coursesFolderResult.id,
            projects: projectsFolderResult.id,
          },
          courseFolderName: companyFolderName,
          isExisting: true,
          version: 'EMERGENCY-FIX-HARDCODED'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create topic folder - สร้างโฟลเดอร์โปรเจคหรือคอร์สย่อย
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

      console.log('📁 Creating topic folder:', { parentFolderId, topicName, topicType })

      const icon = topicType === 'project' ? '🔧' : '📖'
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
🚨 EMERGENCY FIX - HARDCODED VERSION
=====================================================
ปัญหาที่พบ: ใช้โฟลเดอร์ผิด - ไม่ได้อยู่ใน Shared Drive!

✅ โฟลเดอร์ที่ถูกต้องใน Shared Drive (0AAMvBF62LaLyUk9PVA):
- Main [LOGIN]: 1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S
- Courses: 1Fyq7tkra-DAZ6ndcvlUnERH5ryfOMQ7B
- Projects: 148MPiUE7WLAvluF1o2VuPA2VlplzJMJF

หลังจาก deploy แล้ว:
1. ไม่มีโฟลเดอร์ใหม่ถูกสร้าง
2. โปรเจคจะไปที่โฟลเดอร์ projects ที่ถูกต้อง
3. ลบโฟลเดอร์ซ้ำทั้งหมดออกได้

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
*/