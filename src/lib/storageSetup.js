import { supabase } from './supabaseClient';

/**
 * Check and setup storage bucket for file attachments
 */
export const checkStorageSetup = async () => {
  try {
    console.log('Checking storage setup...');
    
    // 1. Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User must be authenticated to check storage');
    }

    // 2. List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('List buckets error:', listError);
      // Try alternative method - direct bucket access
      const { data: testData, error: testError } = await supabase.storage
        .from('course-files')
        .list('', { limit: 1 });
      
      if (testError) {
        throw new Error(`Cannot access storage: ${listError.message}. Direct test also failed: ${testError.message}`);
      } else {
        console.log('Bucket exists but listBuckets() failed. Using direct access method.');
        // Continue with the rest of the function
      }
    } else {
      console.log('Available buckets:', buckets);

      // 3. Check if course-files bucket exists
      const courseFilesBucket = buckets.find(bucket => bucket.name === 'course-files');
      if (!courseFilesBucket) {
        console.error('course-files bucket not found in list');
        return {
          success: false,
          error: 'Storage bucket "course-files" not found in bucket list. Please check bucket permissions.',
          details: {
            buckets: buckets.map(b => b.name),
            missingBucket: 'course-files'
          }
        };
      }
    }

    // 4. Test upload permissions
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test/${Date.now()}_test.txt`;
    
    const { data: uploadTest, error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(testPath, testFile, { upsert: true });

    if (uploadError) {
      console.error('Upload test failed:', uploadError);
      return {
        success: false,
        error: `Cannot upload to storage: ${uploadError.message}`,
        details: uploadError
      };
    }

    // 5. Clean up test file
    try {
      await supabase.storage.from('course-files').remove([testPath]);
    } catch (cleanupError) {
      console.warn('Failed to cleanup test file:', cleanupError);
    }

    console.log('Storage setup check passed');
    return {
      success: true,
      message: 'Storage is properly configured'
    };

  } catch (error) {
    console.error('Storage setup check failed:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Check database schema for content_attachments table
 */
export const checkDatabaseSchema = async () => {
  try {
    console.log('Checking database schema...');

    // Try to query the content_attachments table
    const { data, error } = await supabase
      .from('content_attachments')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Table "content_attachments" does not exist. Please run the database schema setup.',
          sqlFile: 'content-attachments-schema.sql'
        };
      }
      
      return {
        success: false,
        error: `Database error: ${error.message}`,
        details: error
      };
    }

    console.log('Database schema check passed');
    return {
      success: true,
      message: 'Database schema is properly configured'
    };

  } catch (error) {
    console.error('Database schema check failed:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Run comprehensive system check
 */
export const runSystemCheck = async () => {
  console.log('Running comprehensive system check...');

  const results = {
    storage: await checkStorageSetup(),
    database: await checkDatabaseSchema()
  };

  const allPassed = Object.values(results).every(result => result.success);

  return {
    success: allPassed,
    results,
    summary: allPassed 
      ? 'All systems are properly configured' 
      : 'Some systems need configuration'
  };
};