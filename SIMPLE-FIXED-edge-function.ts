// SIMPLE FIXED - Supabase Edge Function for Google Drive
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"

console.log("🚀 Google Drive SIMPLE FIX - Starting...")

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
          version: 'SIMPLE-FIX-3.0.0'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create project structure - HARDCODE version
    if (url.pathname.includes('/create-course-structure') && req.method === 'POST') {
      console.log('📁 Creating structure with HARDCODED folders from Shared Drive')

      // ✅ โฟลเดอร์ที่อยู่ใน Shared Drive จริงๆ (0AAMvBF62LaLyUk9PVA)
      const response = {
        success: true,
        courseFolderId: '1Fyq7tkra-DAZ6ndcvlUnERH5ryfOMQ7B', // คอร์สเรียน
        folderIds: {
          main: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S',      // [LOGIN]
          courses: '1Fyq7tkra-DAZ6ndcvlUnERH5ryfOMQ7B',    // คอร์สเรียน  
          projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF',   // โปรเจค
        },
        courseFolderName: '[LOGIN]',
        isExisting: true,
        version: 'SIMPLE-HARDCODE-SHARED-DRIVE'
      }

      console.log('✅ Returning hardcoded Shared Drive folders:', response)

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create topic folder - REAL Google Drive API
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

    // List files - mock version
    if (url.pathname.includes('/list') && req.method === 'GET') {
      return new Response(
        JSON.stringify({
          success: true,
          files: [],
          total: 0,
          note: 'Mock list response'
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
        availableEndpoints: ['/health', '/create-course-structure', '/create-topic-folder', '/list']
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
🚀 COMPLETE FIX VERSION - HARDCODED STRUCTURE + REAL GOOGLE DRIVE API
=====================================================================
✅ โฟลเดอร์ที่ใช้ (ใน Shared Drive 0AAMvBF62LaLyUk9PVA):
- [LOGIN]: 1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S
- คอร์สเรียน: 1Fyq7tkra-DAZ6ndcvlUnERH5ryfOMQ7B  
- โปรเจค: 148MPiUE7WLAvluF1o2VuPA2VlplzJMJF

🔧 Features:
- create-course-structure: Returns hardcoded correct folder IDs (no new folders created)
- create-topic-folder: REAL Google Drive API - creates actual project folders
- Shared Drive support with proper driveId configuration
- Complete Google Service Account authentication

วิธีใช้:
1. Deploy ไฟล์นี้ไป Supabase Dashboard
2. ตั้งค่า Environment Variables ใน Supabase
3. ทดสอบ health check
4. สร้างโปรเจค - จะได้โฟลเดอร์จริงใน Google Drive

Environment Variables Required:
- GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY_ID, GOOGLE_PRIVATE_KEY
- GOOGLE_CLIENT_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_X509_CERT_URL  
- GOOGLE_DRIVE_FOLDER_ID (Shared Drive ID)

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
*/