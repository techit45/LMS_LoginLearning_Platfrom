import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  HardDrive,
  Settings,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { runSystemCheck } from '@/lib/storageSetup';

const SystemCheck = ({ onClose }) => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const runCheck = async () => {
    setChecking(true);
    try {
      const checkResults = await runSystemCheck();
      setResults(checkResults);
      
      if (checkResults.success) {
        toast({
          title: "ระบบพร้อมใช้งาน ✅",
          description: "ทุกอย่างถูกตั้งค่าเรียบร้อยแล้ว"
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาดในการตรวจสอบ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "คัดลอกแล้ว",
      description: "ข้อความได้ถูกคัดลอกไปยังคลิปบอร์ด"
    });
  };

  const getStatusIcon = (success) => {
    if (success) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const databaseSetupSQL = `-- Run this SQL in Supabase SQL Editor
-- ==========================================
-- CONTENT ATTACHMENTS SCHEMA
-- ระบบไฟล์แนบสำหรับเนื้อหาทุกประเภท (เหมือน Google Classroom)
-- ==========================================

-- สร้างตาราง content_attachments สำหรับเก็บไฟล์แนบของเนื้อหา
CREATE TABLE IF NOT EXISTS content_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100),
    upload_order INTEGER DEFAULT 1,
    is_downloadable BOOLEAN DEFAULT true,
    is_preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_content_attachments_content_id ON content_attachments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_attachments_upload_order ON content_attachments(content_id, upload_order);
CREATE INDEX IF NOT EXISTS idx_content_attachments_file_type ON content_attachments(file_type);

-- เพิ่ม RLS (Row Level Security)
ALTER TABLE content_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: ให้ทุกคนดู attachments ได้ (สำหรับนักเรียน)
CREATE POLICY "Anyone can view content attachments" ON content_attachments
FOR SELECT USING (true);

-- Policy: ให้ admin/instructor เพิ่ม/แก้ไข/ลบ attachments ได้
CREATE POLICY "Instructors can manage attachments" ON content_attachments
FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM user_profiles 
        WHERE role IN ('admin', 'instructor')
    )
);

-- เพิ่ม function trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_content_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_attachments_updated_at
    BEFORE UPDATE ON content_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_content_attachments_updated_at();`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-effect rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">ตรวจสอบระบบไฟล์แนบ</h2>
                <p className="text-slate-400 text-sm">ตรวจสอบการตั้งค่า Storage และ Database</p>
              </div>
            </div>
            <Button onClick={runCheck} disabled={checking} className="bg-blue-500 hover:bg-blue-600">
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบระบบ'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!results && !checking && (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">ตรวจสอบระบบก่อนใช้งาน</h3>
              <p className="text-slate-400 mb-6">
                กดปุ่ม "ตรวจสอบระบบ" เพื่อดูว่าระบบไฟล์แนบพร้อมใช้งานหรือไม่
              </p>
            </div>
          )}

          {checking && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white/70">กำลังตรวจสอบระบบ...</p>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className={`p-4 rounded-lg border ${
                results.success 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-red-500/20 border-red-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(results.success)}
                  <div>
                    <h3 className={`font-semibold ${results.success ? 'text-green-300' : 'text-red-300'}`}>
                      {results.summary}
                    </h3>
                    {results.success && (
                      <p className="text-green-200 text-sm">ระบบไฟล์แนบพร้อมใช้งานแล้ว</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Storage Check */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <HardDrive className="w-5 h-5 mr-2" />
                  Supabase Storage
                </h4>
                
                <div className={`p-4 rounded-lg border ${
                  results.results.storage.success 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(results.results.storage.success)}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        results.results.storage.success ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {results.results.storage.success ? 'Storage พร้อมใช้งาน' : 'Storage ยังไม่พร้อม'}
                      </p>
                      
                      {results.results.storage.error && (
                        <p className="text-red-200 text-sm mt-1">{results.results.storage.error}</p>
                      )}
                      
                      {!results.results.storage.success && (
                        <div className="mt-3 space-y-3">
                          <div className="p-3 bg-slate-700/50 rounded text-sm">
                            <p className="text-slate-300 mb-2">🔧 วิธีแก้ไขแบบง่าย:</p>
                            <div className="space-y-2">
                              <div className="text-xs text-slate-400">
                                <strong>ขั้นตอนที่ 1:</strong> รัน Storage Policies SQL
                              </div>
                              <div className="bg-slate-800 p-2 rounded text-xs">
                                <pre className="text-slate-300 whitespace-pre-wrap">
{`-- รัน SQL นี้ใน Supabase SQL Editor
CREATE POLICY "Anyone can view course files" ON storage.objects
FOR SELECT USING (bucket_id = 'course-files');

CREATE POLICY "Authenticated users can upload course files" ON storage.objects  
FOR INSERT WITH CHECK (bucket_id = 'course-files' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Anyone can view buckets" ON storage.buckets
FOR SELECT USING (true);`}
                                </pre>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(`-- รัน SQL นี้ใน Supabase SQL Editor
CREATE POLICY "Anyone can view course files" ON storage.objects
FOR SELECT USING (bucket_id = 'course-files');

CREATE POLICY "Authenticated users can upload course files" ON storage.objects  
FOR INSERT WITH CHECK (bucket_id = 'course-files' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Anyone can view buckets" ON storage.buckets
FOR SELECT USING (true);`)}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  คัดลอก SQL
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  เปิด SQL Editor
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
                            <p className="text-blue-300 mb-2">📋 ขั้นตอนที่ 2: ตรวจสอบ Bucket Settings</p>
                            <ol className="text-blue-200 text-xs space-y-1 ml-4">
                              <li>1. ไปที่ Storage → course-files → Settings</li>
                              <li>2. ✅ Public bucket = true</li>
                              <li>3. ✅ File size limit = 50MB+</li>
                              <li>4. ✅ Allowed MIME types = ทุกประเภท</li>
                            </ol>
                          </div>

                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                            <p className="text-yellow-300 mb-2">⚠️ หากยังไม่ได้:</p>
                            <div className="text-yellow-200 text-xs space-y-1">
                              <div>• ลบ bucket เก่าและสร้างใหม่</div>
                              <div>• ตรวจสอบ user permissions</div>
                              <div>• ดูไฟล์ STORAGE_TROUBLESHOOTING.md</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Check */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Schema
                </h4>
                
                <div className={`p-4 rounded-lg border ${
                  results.results.database.success 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(results.results.database.success)}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        results.results.database.success ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {results.results.database.success ? 'Database Schema พร้อมใช้งาน' : 'ต้องติดตั้ง Database Schema'}
                      </p>
                      
                      {results.results.database.error && (
                        <p className="text-red-200 text-sm mt-1">{results.results.database.error}</p>
                      )}
                      
                      {!results.results.database.success && (
                        <div className="mt-3 space-y-3">
                          <p className="text-slate-300 text-sm">
                            รัน SQL นี้ใน Supabase SQL Editor:
                          </p>
                          <div className="relative">
                            <pre className="bg-slate-800 p-3 rounded text-xs text-slate-300 overflow-x-auto max-h-40">
                              {databaseSetupSQL}
                            </pre>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(databaseSetupSQL)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              เปิด SQL Editor
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SystemCheck;