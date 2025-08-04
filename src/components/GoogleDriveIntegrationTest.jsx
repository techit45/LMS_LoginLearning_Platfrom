import React, { useState } from 'react';
import { Upload, FolderPlus, FileText, Code, Box, Database, AlertCircle, CheckCircle, BookOpen, Settings } from 'lucide-react';

const GoogleDriveIntegrationTest = () => {
  const [activeTab, setActiveTab] = useState('create-course');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Course creation state
  const [courseData, setCourseData] = useState({
    companySlug: 'login',
    trackSlug: 'computer',
    courseTitle: '',
    courseSlug: ''
  });

  // Topic creation state  
  const [topicData, setTopicData] = useState({
    parentFolderId: '', // courses or projects folder ID
    topicName: '',
    topicType: 'course' // 'course' or 'project'
  });

  // File upload state
  const [uploadData, setUploadData] = useState({
    targetFolderId: '',
    file: null
  });

  const [folderIds, setFolderIds] = useState({
    coursesMainFolderId: '',
    projectsMainFolderId: ''
  });

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  const handleCreateCourse = async () => {
    if (!courseData.courseTitle || !courseData.courseSlug) {
      setError('กรุณากรอกชื่อคอร์สและ slug');
      return;
    }

    setLoading(true);
    clearResults();

    try {
      const response = await fetch('http://127.0.0.1:3001/api/drive/create-course-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          type: 'course',
          data: data
        });
        
        // Update folder IDs for topic creation
        setFolderIds({
          coursesMainFolderId: data.folderIds.courses || '',
          projectsMainFolderId: data.folderIds.projects || ''
        });
        
        // Update topic form with folder IDs
        setTopicData(prev => ({
          ...prev,
          parentFolderId: data.folderIds.courses || ''
        }));
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการสร้างโครงสร้างคอร์ส');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!topicData.topicName || !topicData.parentFolderId || !topicData.topicType) {
      setError('กรุณากรอกชื่อหัวข้อ, เลือกประเภท และ Parent Folder ID');
      return;
    }

    setLoading(true);
    clearResults();

    try {
      const response = await fetch('http://127.0.0.1:3001/api/drive/create-topic-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          type: 'topic',
          data: data
        });
        
        // Update upload form with topic folder ID
        setUploadData(prev => ({
          ...prev,
          targetFolderId: data.topicFolderId
        }));
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการสร้างโฟลเดอร์หัวข้อ');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleUpload = async () => {
    if (!uploadData.file || !uploadData.targetFolderId) {
      setError('กรุณาเลือกไฟล์และระบุ Target Folder ID');
      return;
    }

    setLoading(true);
    clearResults();

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('targetFolderId', uploadData.targetFolderId);

      const response = await fetch('http://127.0.0.1:3001/api/drive/simple-upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.id) {
        setResult({
          type: 'upload',
          data: data
        });
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับ server ได้');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'create-course', label: 'สร้างโครงสร้างหลัก', icon: <FolderPlus className="w-4 h-4" /> },
    { id: 'create-topic', label: 'สร้างหัวข้อ', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'simple-upload', label: 'อัปโหลดไฟล์', icon: <Upload className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔗 Google Drive Integration Test
        </h2>
        <p className="text-gray-600">
          ทดสอบระบบเชื่อมต่อ Google Drive กับโครงสร้างคอร์สและโครงงาน
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              clearResults();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Create Course Tab */}
      {activeTab === 'create-course' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">สร้างโครงสร้างหลัก (2 โฟลเดอร์: คอร์สเรียน + โปรเจค)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">บริษัท</label>
              <select
                value={courseData.companySlug}
                onChange={(e) => setCourseData(prev => ({ ...prev, companySlug: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="login">Login Learning Platform</option>
                <option value="meta">Meta Tech Academy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สาขา</label>
              <select
                value={courseData.trackSlug}
                onChange={(e) => setCourseData(prev => ({ ...prev, trackSlug: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {courseData.companySlug === 'login' ? (
                  <>
                    <option value="computer">Computer Engineering</option>
                    <option value="mechanical">Mechanical Engineering</option>
                    <option value="electrical">Electrical Engineering</option>
                    <option value="civil">Civil Engineering</option>
                    <option value="chemical">Chemical Engineering</option>
                    <option value="aerospace">Aerospace Engineering</option>
                  </>
                ) : (
                  <>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="data-science">Data Science</option>
                    <option value="webapp-game">Web App & Game Dev</option>
                    <option value="ai">Artificial Intelligence</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อคอร์ส</label>
              <input
                type="text"
                value={courseData.courseTitle}
                onChange={(e) => setCourseData(prev => ({ ...prev, courseTitle: e.target.value }))}
                placeholder="เช่น: Introduction to React Development"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Slug</label>
              <input
                type="text"
                value={courseData.courseSlug}
                onChange={(e) => setCourseData(prev => ({ ...prev, courseSlug: e.target.value }))}
                placeholder="เช่น: intro-react-dev"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2">โครงสร้างที่จะสร้าง:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>📁 <strong>[บริษัท] ชื่อคอร์ส</strong> (โฟลเดอร์หลัก)</p>
              <p>  📚 คอร์สเรียน (Course Materials)</p>
              <p>  🎯 โปรเจค (Projects)</p>
            </div>
          </div>

          <button
            onClick={handleCreateCourse}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <FolderPlus className="w-5 h-5" />
                <span>สร้างโครงสร้างหลัก</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Create Topic Tab */}
      {activeTab === 'create-topic' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">สร้างหัวข้อใน คอร์สเรียน หรือ โปรเจค</h3>
          <p className="text-sm text-gray-600">สร้างโฟลเดอร์ย่อยสำหรับเก็บไฟล์แยกตามหัวข้อ</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทโฟลเดอร์</label>
              <select
                value={topicData.topicType}
                onChange={(e) => setTopicData(prev => ({ ...prev, topicType: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="course">📚 คอร์สเรียน (Course Material)</option>
                <option value="project">🎯 โปรเจค (Project)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Folder ID</label>
              <input
                type="text"
                value={topicData.parentFolderId}
                onChange={(e) => setTopicData(prev => ({ ...prev, parentFolderId: e.target.value }))}
                placeholder="จะได้จากการสร้างโครงสร้างหลัก"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อหัวข้อ</label>
              <input
                type="text"
                value={topicData.topicName}
                onChange={(e) => setTopicData(prev => ({ ...prev, topicName: e.target.value }))}
                placeholder={
                  topicData.topicType === 'course' 
                    ? "เช่น: Chapter 1 - Introduction to React" 
                    : "เช่น: Project 1 - Todo App"
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-800 mb-2">ตัวอย่างการใช้งาน:</h4>
            <div className="text-sm text-green-700 space-y-1">
              {topicData.topicType === 'course' ? (
                <>
                  <p>• ใช้สำหรับเก็บเอกสารคอร์สเรียน (PDF, DOCX, เอกสารอ้างอิง)</p>
                  <p>• แยกตามบทเรียนหรือหัวข้อรายละเอียด</p>
                </>
              ) : (
                <>
                  <p>• ใช้สำหรับเก็บไฟล์โครงงาน (ทั้งโปรแกรมและ CAD)</p>
                  <p>• รวมทั้ง Source Code, 3D Models, Documentation</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleCreateTopic}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span>สร้างโฟลเดอร์หัวข้อ</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Simple Upload Tab */}
      {activeTab === 'simple-upload' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">อัปโหลดไฟล์เข้าโฟลเดอร์หัวข้อ</h3>
          <p className="text-sm text-gray-600">อัปโหลดไฟล์ไปยังโฟลเดอร์หัวข้อที่สร้างไว้แล้ว</p>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Folder ID</label>
              <input
                type="text"
                value={uploadData.targetFolderId}
                onChange={(e) => setUploadData(prev => ({ ...prev, targetFolderId: e.target.value }))}
                placeholder="จะได้จากการสร้างหัวข้อ"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ไฟล์</label>
              <input
                type="file"
                onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Show current folder IDs */}
          {Object.values(folderIds).some(id => id) && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">โฟลเดอร์ที่สามารถใช้ได้:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {folderIds.coursesMainFolderId && (
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span className="text-blue-700">📚 คอร์สเรียน:</span>
                    <span className="font-mono text-xs text-blue-600">{folderIds.coursesMainFolderId}</span>
                  </div>
                )}
                {folderIds.projectsMainFolderId && (
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span className="text-green-700">🎯 โปรเจค:</span>
                    <span className="font-mono text-xs text-green-600">{folderIds.projectsMainFolderId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-purple-50 p-4 rounded-md">
            <h4 className="font-medium text-purple-800 mb-2">ประเภทไฟล์ที่สามารถอัปโหลดได้:</h4>
            <div className="text-sm text-purple-700 space-y-1">
              <p>• เอกสาร: PDF, DOCX, TXT</p>
              <p>• โปรแกรม: JS, PY, JAVA, CPP, HTML, CSS</p>
              <p>• 3D CAD: SLDPRT, DWG, STEP, STL, OBJ</p>
              <p>• ไฟล์อื่นๆ: ZIP, RAR, 7Z</p>
            </div>
          </div>

          <button
            onClick={handleSimpleUpload}
            disabled={loading || !uploadData.file || !uploadData.targetFolderId}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>อัปโหลดไฟล์</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">เกิดข้อผิดพลาด</h4>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 mb-2">
                {result.type === 'course' && 'สร้างโครงสร้างหลักสำเร็จ'}
                {result.type === 'topic' && 'สร้างโฟลเดอร์หัวข้อสำเร็จ'}
                {result.type === 'upload' && 'อัปโหลดไฟล์สำเร็จ'}
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                {result.type === 'course' && (
                  <>
                    <p><strong>ชื่อโฟลเดอร์หลัก:</strong> {result.data.courseFolderName}</p>
                    <p><strong>Main Folder ID:</strong> <code className="bg-green-100 px-1 rounded">{result.data.courseFolderId}</code></p>
                    <p><strong>โฟลเดอร์ย่อย (2 โฟลเดอร์):</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>📚 คอร์สเรียน: <code className="bg-green-100 px-1 rounded text-xs">{result.data.folderIds.courses}</code></li>
                      <li>🎯 โปรเจค: <code className="bg-green-100 px-1 rounded text-xs">{result.data.folderIds.projects}</code></li>
                    </ul>
                  </>
                )}
                
                {result.type === 'topic' && (
                  <>
                    <p><strong>ชื่อโฟลเดอร์:</strong> {result.data.topicFolderName}</p>
                    <p><strong>Topic Folder ID:</strong> <code className="bg-green-100 px-1 rounded">{result.data.topicFolderId}</code></p>
                    <p><strong>พร้อมใช้งานสำหรับ:</strong> อัปโหลดไฟล์ทุกประเภท (เอกสาร, โปรแกรม, 3D CAD)</p>
                  </>
                )}
                
                {result.type === 'upload' && (
                  <>
                    <p><strong>ชื่อไฟล์:</strong> {result.data.name}</p>
                    <p><strong>ประเภทไฟล์:</strong> .{result.data.fileExtension}</p>
                    <p><strong>Target Folder ID:</strong> <code className="bg-green-100 px-1 rounded text-xs">{result.data.targetFolderId}</code></p>
                    <p><strong>ขนาดไฟล์:</strong> {result.data.size ? `${Math.round(result.data.size / 1024)} KB` : 'N/A'}</p>
                    {result.data.webViewLink && (
                      <p><strong>ลิงค์:</strong> <a href={result.data.webViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ดูไฟล์ใน Google Drive</a></p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveIntegrationTest;