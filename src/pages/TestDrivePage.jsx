import React from 'react';
import GoogleDriveTest from '../components/GoogleDriveTest';
import SEOHead from '../components/SEOHead';

function TestDrivePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Google Drive Integration Test - Login Learning"
        description="Testing Google Drive API integration"
      />
      
      <div className="pt-24"> {/* Account for fixed navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🚀 Google Drive Integration Test
            </h1>
            <p className="text-lg text-gray-600">
              ทดสอบการเชื่อมต่อและจัดการไฟล์ผ่าน Google Drive API
            </p>
          </div>
          
          <GoogleDriveTest />
        </div>
      </div>
    </div>
  );
}

export default TestDrivePage;