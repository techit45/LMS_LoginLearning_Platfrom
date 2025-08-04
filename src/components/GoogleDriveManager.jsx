import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Folder, 
  File, 
  Trash2, 
  Edit, 
  Search, 
  Share, 
  Download, 
  Plus,
  Eye,
  Link as LinkIcon,
  Copy,
  Move,
  Star,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';

const GoogleDriveManager = ({ 
  compact = false, 
  allowedTypes = [], 
  onFileSelect = null,
  maxFiles = null 
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Load files
  const loadFiles = async (folderId = currentFolder) => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/drive/list?folderId=${folderId}`);
      if (!response.ok) throw new Error('Failed to load files');
      
      const data = await response.json();
      let fileList = data.files || [];
      
      // Filter by allowed types if specified
      if (allowedTypes.length > 0) {
        fileList = fileList.filter(file => {
          if (file.mimeType === 'application/vnd.google-apps.folder') return true;
          return allowedTypes.some(type => file.mimeType?.includes(type));
        });
      }
      
      setFiles(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!onFileSelect) return;
    
    if (maxFiles === 1) {
      setSelectedFiles([file]);
      onFileSelect([file]);
    } else {
      const isSelected = selectedFiles.find(f => f.id === file.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = selectedFiles.filter(f => f.id !== file.id);
      } else {
        newSelection = maxFiles && selectedFiles.length >= maxFiles 
          ? [...selectedFiles.slice(1), file]
          : [...selectedFiles, file];
      }
      
      setSelectedFiles(newSelection);
      onFileSelect(newSelection);
    }
  };

  // Navigate to folder
  const navigateToFolder = (folderId) => {
    setCurrentFolder(folderId);
    loadFiles(folderId);
  };

  // Copy file link
  const copyFileLink = async (file) => {
    if (file.webViewLink) {
      try {
        await navigator.clipboard.writeText(file.webViewLink);
        alert('คัดลอกลิงก์แล้ว!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  if (compact) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">เลือกไฟล์จาก Google Drive</h3>
            <Button 
              onClick={() => loadFiles()} 
              variant="ghost" 
              size="sm"
              disabled={loading}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {files.map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                const isSelected = selectedFiles.find(f => f.id === file.id);
                
                return (
                  <div
                    key={file.id}
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => isFolder ? navigateToFolder(file.id) : handleFileSelect(file)}
                  >
                    {isFolder ? (
                      <Folder className="w-4 h-4 text-blue-600 mr-2" />
                    ) : (
                      <File className="w-4 h-4 text-gray-600 mr-2" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isFolder ? 'โฟลเดอร์' : formatFileSize(file.size)}
                      </p>
                    </div>
                    {!isFolder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFileLink(file);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700">
              เลือกแล้ว: {selectedFiles.length} ไฟล์
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedFiles.map((file) => (
                <span
                  key={file.id}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {file.name}
                  <button
                    onClick={() => handleFileSelect(file)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full manager view
  return (
    <div className="space-y-4">
      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => {
          const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
          const isSelected = selectedFiles.find(f => f.id === file.id);
          
          return (
            <div
              key={file.id}
              className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => isFolder ? navigateToFolder(file.id) : handleFileSelect(file)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center ${isFolder ? 'text-blue-600' : 'text-gray-700'}`}>
                    {isFolder ? (
                      <Folder className="w-8 h-8 mr-3" />
                    ) : (
                      <File className="w-8 h-8 mr-3" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {isFolder ? 'โฟลเดอร์' : formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  {!isFolder && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFileLink(file);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                        title="คัดลอกลิงก์"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                          title="ดูไฟล์"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(file.modifiedTime)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && files.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">ไม่พบไฟล์ในโฟลเดอร์นี้</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดไฟล์...</p>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveManager;