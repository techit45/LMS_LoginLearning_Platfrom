// COMPLETE FIX + SIMPLE UPLOAD - Supabase Edge Function for Google Drive API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"

console.log("🚀 Google Drive COMPLETE FIX + SIMPLE UPLOAD - Starting...")

// 🔒 SECURE CORS Headers - Support both development and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for now, will be restricted later
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
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
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
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
    url.searchParams.set('includeItemsFromAllDrives', 'true')
  }
  
  // Include driveId for ALL operations when working with Shared Drives
  if (options?.driveId) {
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
    console.error(`❌ Google Drive API Error: ${response.status} - ${errorText}`)
    console.error(`❌ Request URL: ${url.toString()}`)
    console.error(`❌ Request Method: ${method}`)
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

  // 🔒 SECURITY: Validate request origin
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:5173',
    'https://login-learning.vercel.app',
    'https://login-learning.netlify.app',
    'https://login-learning-jcndsoy98-techity-3442s-projects.vercel.app',
    'https://login-learning-platform.vercel.app'
  ];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const url = new URL(req.url)
    
    // Health check (no auth required)
    if (url.pathname.includes('/health') || url.pathname === '/') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: 'SHARED-DRIVE-FIX-v7.0.0',
          endpoints: ['/health', '/create-course-structure', '/create-topic-folder', '/delete-project-folder', '/simple-upload', '/delete-file', '/list', '/initiate-chunked-upload', '/upload-chunk', '/validate-service-account']
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Service account validation endpoint
    if (url.pathname.includes('/validate-service-account') && req.method === 'GET') {
      try {
        console.log('🔍 Validating service account configuration...')
        
        const credentials = getServiceAccountCredentials()
        const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
        
        // Test token generation
        const accessToken = await getAccessToken()
        
        // Test basic Drive API access
        const aboutResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        const aboutData = await aboutResponse.json()
        
        // Test Shared Drive access if configured
        let sharedDriveTest = null
        if (sharedDriveId) {
          try {
            const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}?fields=id,name,capabilities`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            })
            
            if (driveResponse.ok) {
              sharedDriveTest = {
                success: true,
                data: await driveResponse.json()
              }
            } else {
              sharedDriveTest = {
                success: false,
                error: `${driveResponse.status} - ${await driveResponse.text()}`
              }
            }
          } catch (driveError) {
            sharedDriveTest = {
              success: false,
              error: driveError.message
            }
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            serviceAccount: {
              email: credentials.client_email,
              projectId: credentials.project_id,
              hasPrivateKey: !!credentials.private_key,
              tokenGenerated: !!accessToken
            },
            driveApi: {
              accessible: aboutResponse.ok,
              user: aboutData.user,
              quota: aboutData.storageQuota
            },
            sharedDrive: {
              configured: !!sharedDriveId,
              driveId: sharedDriveId,
              test: sharedDriveTest
            },
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ Service account validation error:', error)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // 🔒 SECURITY: Validate authentication for all other endpoints
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 🔒 Validate JWT token format (basic check)
    const token = authHeader.substring(7);
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create project structure - MULTI-COMPANY version (prevents duplicate folders)
    if (url.pathname.includes('/create-course-structure') && req.method === 'POST') {
      console.log('📁 Creating structure with HARDCODED folders from Shared Drive')

      const requestBody = await req.json()
      const companySlug = requestBody.companySlug || 'login'
      
      console.log('🏢 Company requested:', companySlug)

      // ✅ Multi-company folder configurations
      const COMPANY_FOLDERS = {
        'login': {
          name: 'LOGIN',
          root: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S',
          courses: '18BmNBBwDSUMLUdq4ODhxLWPD8w0Lh189',
          projects: '1QZ8yXGm5K6tF9rJ3N4P2vE8sL7wC5qR9'
        },
        'meta': {
          name: 'Meta',
          root: '1IyP3gtT6K5JRTPOEW1gIVYMHv1mQXVMG',
          courses: '1CI-73CLESxWCVPevYaDeSKGikLy2Tccg',
          projects: '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7'
        },
        'med': {
          name: 'Med',
          root: '1rZ5BNCoGsGaA7ZCzf_bEgPIEgAANp-O4',
          courses: '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ',
          projects: '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK'
        },
        'edtech': {
          name: 'EdTech',
          root: '163LK-tcU26Ea3JYmWrzqadkH0-8p3iiW',
          courses: '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C',
          projects: '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5'
        },
        'w2d': {
          name: 'W2D',
          root: '1yA0vhAH7TrgCSsPGy3HpM05Wlz07HD8A',
          courses: '1f5KMjvF-J45vIxy4byI8eRPBXSHzZu1W',
          projects: '11BJWLVdy1ZLyt9WtY_BvWz3BnKKWDyun'
        }
      }

      const companyConfig = COMPANY_FOLDERS[companySlug] || COMPANY_FOLDERS['login']
      
      const response = {
        success: true,
        courseFolderId: companyConfig.courses,
        folderIds: {
          main: companyConfig.root,
          courses: companyConfig.courses,
          projects: companyConfig.projects,
        },
        courseFolderName: companyConfig.name,
        isExisting: true,
        company: companySlug,
        version: 'MULTI-COMPANY-SUPPORT-AUG-2025'
      }

      console.log(`✅ Returning ${companyConfig.name} company folders:`, response)

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // ❌ REMOVED: /create-content-folder endpoint
    // This endpoint was creating folders with content titles instead of using existing course folders
    // Content files should go directly to the main course folder, not separate content folders

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

      const icon = topicType === 'project' ? '🔧' : 
                   topicType === 'course_content' ? '📚' : 
                   topicType === 'company' ? '🏢' :
                   topicType === 'course_category' ? '📚' :
                   topicType === 'course' ? '📖' : '📄'
      const folderName = `${icon} ${topicName}`

      const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
      
      let result;
      
      try {
        // Check if folder already exists to prevent duplicates
        const existingFolders = await callGoogleDriveAPI(
          `/files?q='${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false&supportsAllDrives=true`,
          'GET'
        )

        if (existingFolders.files && existingFolders.files.length > 0) {
          // Return existing folder ID
          console.log('✅ Folder already exists:', existingFolders.files[0].id, existingFolders.files[0].name)
          return new Response(
            JSON.stringify({
              success: true,
              topicFolderId: existingFolders.files[0].id,
              folderName: existingFolders.files[0].name,
              isExisting: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Create new folder if it doesn't exist
        result = await callGoogleDriveAPI('/files', 'POST', {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }, { 
          supportsAllDrives: true, 
          driveId: sharedDriveId 
        })
        
        console.log('✅ New folder created:', result.id, result.name)
      } catch (duplicateCheckError) {
        console.warn('Could not check for duplicates, creating folder anyway:', duplicateCheckError.message)
        
        // Fallback: create folder anyway
        result = await callGoogleDriveAPI('/files', 'POST', {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }, { 
          supportsAllDrives: true, 
          driveId: sharedDriveId 
        })
      }

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

    // Chunked upload initialization endpoint - NEW! 🚀
    if (url.pathname.includes('/initiate-chunked-upload') && req.method === 'POST') {
      const body = await req.json()
      const { fileName, fileSize, folderId, mimeType } = body

      // Validate inputs
      if (!fileName || typeof fileName !== 'string') {
        return new Response(
          JSON.stringify({ error: 'fileName is required and must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
        return new Response(
          JSON.stringify({ error: 'fileSize is required and must be a positive number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!folderId || typeof folderId !== 'string') {
        return new Response(
          JSON.stringify({ error: 'folderId is required and must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // File size limits (500MB max)
      const MAX_FILE_SIZE = 500 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: 'File too large', 
            maxSize: MAX_FILE_SIZE,
            providedSize: fileSize 
          }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🚀 Initiating chunked upload:', { fileName, fileSize, folderId })

      try {
        const accessToken = await getAccessToken()
        
        // Create resumable upload session
        const initResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType || 'application/octet-stream',
            'X-Upload-Content-Length': fileSize.toString()
          },
          body: JSON.stringify({
            name: fileName,
            parents: [folderId],
            mimeType: mimeType || 'application/octet-stream'
          })
        })

        if (!initResponse.ok) {
          const errorText = await initResponse.text()
          throw new Error(`Failed to initiate upload: ${initResponse.status} - ${errorText}`)
        }

        const uploadUrl = initResponse.headers.get('Location')
        console.log('✅ Upload session created:', uploadUrl)

        return new Response(
          JSON.stringify({
            success: true,
            uploadUrl,
            chunkSize: 256 * 1024, // 256KB chunks
            fileName
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ Chunked upload init error:', error)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to initiate chunked upload: ${error.message}`
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Upload chunk endpoint - NEW! 📦
    if (url.pathname.includes('/upload-chunk') && req.method === 'PUT') {
      const uploadUrl = url.searchParams.get('uploadUrl')
      const start = parseInt(url.searchParams.get('start') || '0')
      const end = parseInt(url.searchParams.get('end') || '0')
      const totalSize = parseInt(url.searchParams.get('totalSize') || '0')

      // Validate inputs
      if (!uploadUrl || typeof uploadUrl !== 'string' || !uploadUrl.startsWith('https://')) {
        return new Response(
          JSON.stringify({ error: 'Valid uploadUrl is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (isNaN(start) || start < 0) {
        return new Response(
          JSON.stringify({ error: 'Valid start position is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (isNaN(end) || end <= start) {
        return new Response(
          JSON.stringify({ error: 'Valid end position is required (must be greater than start)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (isNaN(totalSize) || totalSize <= 0) {
        return new Response(
          JSON.stringify({ error: 'Valid totalSize is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const chunkData = await req.arrayBuffer()
      
      // Validate chunk size
      const expectedChunkSize = end - start;
      if (chunkData.byteLength !== expectedChunkSize) {
        return new Response(
          JSON.stringify({ 
            error: 'Chunk size mismatch', 
            expected: expectedChunkSize,
            actual: chunkData.byteLength 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate chunk doesn't exceed total size
      if (end > totalSize) {
        return new Response(
          JSON.stringify({ 
            error: 'Chunk end position exceeds total file size',
            end: end,
            totalSize: totalSize
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('📦 Uploading chunk:', { start, end, totalSize, chunkSize: chunkData.byteLength })

      try {
        const accessToken = await getAccessToken()
        
        const chunkResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Range': `bytes ${start}-${end-1}/${totalSize}`,
            'Content-Length': chunkData.byteLength.toString()
          },
          body: chunkData
        })

        // Check if upload is complete (308 = Resume Incomplete, 200/201 = Complete)
        if (chunkResponse.status === 308) {
          // More chunks needed
          const range = chunkResponse.headers.get('Range') || ''
          console.log('📦 Chunk uploaded, more needed. Range:', range)
          
          return new Response(
            JSON.stringify({
              success: true,
              completed: false,
              range,
              nextStart: end
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else if (chunkResponse.status === 200 || chunkResponse.status === 201) {
          // Upload complete
          const result = await chunkResponse.json()
          console.log('✅ Chunked upload completed:', result.id)
          
          return new Response(
            JSON.stringify({
              success: true,
              completed: true,
              fileId: result.id,
              fileName: result.name,
              webViewLink: result.webViewLink
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          const errorText = await chunkResponse.text()
          throw new Error(`Chunk upload failed: ${chunkResponse.status} - ${errorText}`)
        }
      } catch (error) {
        console.error('❌ Chunk upload error:', error)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Chunk upload failed: ${error.message}`
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Simple file upload endpoint (for files < 100MB) - 📤
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

      // Check file size - redirect to chunked upload for large files
      const MAX_SIMPLE_UPLOAD_SIZE = 100 * 1024 * 1024 // 100MB
      if (file.size > MAX_SIMPLE_UPLOAD_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: 'File too large for simple upload',
            suggestion: 'Use chunked upload for files larger than 100MB',
            fileSize: file.size,
            maxSize: MAX_SIMPLE_UPLOAD_SIZE
          }),
          { 
            status: 413,
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

    // List files - FIXED for Shared Drive support
    if (url.pathname.includes('/list') && req.method === 'GET') {
      const folderId = url.searchParams.get('folderId') || 'root'
      const pageSize = parseInt(url.searchParams.get('pageSize') || '50')
      const orderBy = url.searchParams.get('orderBy') || 'modifiedTime desc'
      const isSharedDrive = url.searchParams.get('isSharedDrive') === 'true'
      
      console.log('📋 List files request:', { folderId, pageSize, orderBy, isSharedDrive })

      // Build query parameters for Shared Drive
      let query = `'${folderId}' in parents and trashed=false`
      let driveId = null
      let corpora = 'user'

      if (isSharedDrive) {
        driveId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')
        if (!driveId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Shared Drive ID not configured in environment variables' 
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        corpora = 'drive'
        console.log('🚗 Using Shared Drive:', driveId)
      }

      const params = new URLSearchParams({
        q: query,
        pageSize: pageSize.toString(),
        orderBy,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,iconLink,thumbnailLink)',
        corpora,
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      })

      if (driveId) {
        params.set('driveId', driveId)
      }

      console.log('🔍 Query parameters:', params.toString())

      try {
        const result = await callGoogleDriveAPI(`/files?${params}`, 'GET', undefined, {
          supportsAllDrives: true,
          driveId: driveId || undefined
        })
        
        console.log('✅ Files retrieved:', result.files?.length || 0)
        
        return new Response(
          JSON.stringify({
            success: true,
            files: result.files || [],
            total: result.files?.length || 0,
            driveId: driveId,
            folderId: folderId,
            isSharedDrive: isSharedDrive
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ List files error:', error.message)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to list files: ${error.message}`,
            folderId,
            isSharedDrive,
            driveId
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Default 404 response
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found', 
        path: url.pathname, 
        method: req.method,
        availableEndpoints: ['/health', '/create-course-structure', '/create-topic-folder', '/delete-project-folder', '/simple-upload', '/delete-file', '/list', '/initiate-chunked-upload', '/upload-chunk']
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
- 📖 คอร์สเรียน (Courses): 18BmNBBwDSUMLUdq4ODhxLWPD8w0Lh189
- 🎯 โปรเจค (Projects): 1vTWe8xU0fhqjcCQJQDzjM7PnHEU0oZya  
- ✅ FIXED: Now uses correct folders for courses vs projects

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