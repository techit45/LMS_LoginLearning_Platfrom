import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { setupStorage, checkStorageHealth } from '@/lib/storageSetup';
import { uploadCourseImage, uploadProfileImage } from '@/lib/attachmentService';
import { Upload, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const StorageTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [uploadTest, setUploadTest] = useState(null);

  const runStorageTest = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "ต้องเข้าสู่ระบบก่อนทดสอบ Storage",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResults(null);
    
    try {
      console.log('🧪 Starting storage test...');
      
      // 1. Setup storage
      const setupResult = await setupStorage();
      console.log('Setup result:', setupResult);
      
      // 2. Check storage health
      const healthResult = await checkStorageHealth();
      console.log('Health result:', healthResult);
      
      setResults({
        setup: setupResult,
        health: healthResult
      });
      
      if (setupResult.success && healthResult.healthy) {
        toast({
          title: "✅ Storage ทำงานปกติ",
          description: "ระบบอัปโหลดไฟล์พร้อมใช้งาน"
        });
      } else {
        toast({
          title: "❌ Storage มีปัญหา",
          description: "ตรวจสอบการตั้งค่า Supabase Storage",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Storage test error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setUploadTest({ loading: true, result: null });
    
    try {
      console.log('🧪 Testing file upload...');
      
      // Test course image upload
      const { data, error } = await uploadCourseImage(file);
      
      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      setUploadTest({
        loading: false,
        result: {
          success: true,
          url: data.publicUrl,
          fileName: data.fileName
        }
      });

      toast({
        title: "✅ อัปโหลดสำเร็จ",
        description: `ไฟล์ ${data.fileName} ถูกอัปโหลดแล้ว`
      });

    } catch (error) {
      console.error('Upload test error:', error);
      setUploadTest({
        loading: false,
        result: {
          success: false,
          error: error.message
        }
      });

      toast({
        title: "❌ อัปโหลดล้มเหลว",
        description: error.message,
        variant: "destructive"
      });
    }
    
    // Clear file input
    event.target.value = '';
  };

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">กรุณาเข้าสู่ระบบก่อนทดสอบ Storage</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">🧪 ทดสอบระบบ Storage</h2>
        
        <div className="space-y-4">
          <Button 
            onClick={runStorageTest} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                ทดสอบ Storage Setup
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-3 mt-4">
              <div className={`p-3 rounded-lg ${
                results.setup.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {results.setup.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    results.setup.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Storage Setup: {results.setup.message}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${
                results.health.healthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {results.health.healthy ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    results.health.healthy ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Storage Health: {results.health.message}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results?.setup.success && results?.health.healthy && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">📤 ทดสอบอัปโหลดไฟล์</h3>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                id="test-file-upload"
                accept="image/*"
                onChange={testFileUpload}
                className="hidden"
                disabled={uploadTest?.loading}
              />
              <Button 
                onClick={() => document.getElementById('test-file-upload')?.click()}
                disabled={uploadTest?.loading}
                variant="outline"
                className="w-full"
              >
                {uploadTest?.loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    เลือกรูปภาพเพื่อทดสอบ
                  </>
                )}
              </Button>
            </div>

            {uploadTest?.result && (
              <div className={`p-3 rounded-lg ${
                uploadTest.result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {uploadTest.result.success ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">อัปโหลดสำเร็จ!</span>
                    </div>
                    <p className="text-sm text-green-700">ไฟล์: {uploadTest.result.fileName}</p>
                    <a 
                      href={uploadTest.result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      ดูไฟล์ที่อัปโหลด
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">อัปโหลดล้มเหลว: {uploadTest.result.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageTest;