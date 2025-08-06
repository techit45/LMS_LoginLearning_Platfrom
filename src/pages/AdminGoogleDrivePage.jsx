import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Grid, 
  List,
  Home,
  ArrowLeft,
  Cloud,
  RefreshCw,
  Settings,
  Eye,
  MoreVertical,
  Link as LinkIcon,
  Filter,
  SortAsc,
  Calendar,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Move,
  FolderOpen,
  ChevronRight,
  Star,
  Clock,
  Info,
  Copy,
  Scissors,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { googleDriveClient } from '../lib/googleDriveClient';

const AdminGoogleDrivePage = () => {
  const DEFAULT_FOLDER = import.meta.env.VITE_GOOGLE_DRIVE_DEFAULT_FOLDER || '0AAMvBF62LaLyUk9PVA';
  const IS_SHARED_DRIVE = import.meta.env.VITE_GOOGLE_DRIVE_IS_SHARED_DRIVE === 'true';
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(DEFAULT_FOLDER);
  const [folderPath, setFolderPath] = useState([{ 
    id: DEFAULT_FOLDER, 
    name: IS_SHARED_DRIVE ? 'Login Learning Platform' : 'Database' 
  }]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('modifiedTime desc');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTarget, setMoveTarget] = useState({ files: [], targetFolder: null });
  const [availableFolders, setAvailableFolders] = useState([]);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, file: null });
  const [serverError, setServerError] = useState(false);
  const fileInputRef = useRef(null);

  // Production API base URL
  const API_BASE = window.location.hostname.includes('vercel.app') ? '/api/drive' : 'http://127.0.0.1:3001/api/drive';

  // Load files from current folder
  const loadFiles = async (folderId = currentFolder) => {
    setLoading(true);
    setServerError(false);
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE}/list?folderId=${folderId}&orderBy=${sortBy}&t=${timestamp}`, {
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error('Failed to load files');
      
      const data = await response.json();
      console.log('📁 Loaded files from API:', data.files);
      setFiles(data.files || []);
      setServerError(false);
    } catch (error) {
      console.error('Error loading files:', error);
      setServerError(true);
      setFiles([]);
      
      if (error.message.includes('Load failed') || error.message.includes('Failed to fetch')) {
        // Server is down
        console.log('🚨 Server appears to be down');
      } else {
        alert('ไม่สามารถโหลดไฟล์ได้: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', currentFolder);

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      try {
        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ File uploaded:', result);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 2000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `Upload failed for ${file.name}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Handle specific quota error
        if (error.message.includes('Service Accounts do not have storage quota')) {
          alert(`❌ ไม่สามารถอัพโหลด "${file.name}" ได้\n\n🔧 สาเหตุ: Service Account ไม่มี storage quota\n\n💡 วิธีแก้ไข:\n1. สร้าง Shared Drive ใน Google Drive\n2. เพิ่ม service account เข้า Shared Drive\n3. หรือใช้ OAuth delegation\n\nดู GOOGLE_DRIVE_QUOTA_SOLUTION.md สำหรับรายละเอียด`);
        } else {
          alert(`ไม่สามารถอัพโหลด ${file.name}: ${error.message}`);
        }
        
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
    
    loadFiles(); // Refresh file list
    event.target.value = ''; // Clear input
  };

  // Create folder
  const createFolder = async () => {
    const folderName = prompt('ชื่อโฟลเดอร์ใหม่:');
    if (!folderName) return;

    try {
      const response = await fetch(`${API_BASE}/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName,
          parentId: currentFolder
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Folder created:', result);
        // Force refresh with delay to ensure server sync
        setTimeout(() => {
          loadFiles();
        }, 1000);
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('ไม่สามารถสร้างโฟลเดอร์ได้: ' + error.message);
    }
  };

  // Delete file
  const deleteFile = async (fileId, fileName) => {
    if (!confirm(`คุณต้องการลบ "${fileName}" หรือไม่?`)) return;

    try {
      const response = await fetch(`${API_BASE}/delete?fileId=${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ File deleted');
        loadFiles();
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('ไม่สามารถลบไฟล์ได้: ' + error.message);
    }
  };

  // Rename file
  const renameFile = async (fileId, currentName) => {
    const newName = prompt('ชื่อใหม่:', currentName);
    if (!newName || newName === currentName) return;

    try {
      const response = await fetch(`${API_BASE}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, newName })
      });

      if (response.ok) {
        console.log('✅ File renamed');
        loadFiles();
      } else {
        throw new Error('Failed to rename file');
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      alert('ไม่สามารถเปลี่ยนชื่อได้: ' + error.message);
    }
  };

  // Navigate to folder
  const navigateToFolder = (folderId, folderName) => {
    setCurrentFolder(folderId);
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    loadFiles(folderId);
  };

  // Navigate to path
  const navigateToPath = (index) => {
    const newPath = folderPath.slice(0, index + 1);
    const targetFolder = newPath[newPath.length - 1];
    setFolderPath(newPath);
    setCurrentFolder(targetFolder.id);
    loadFiles(targetFolder.id);
  };

  // Search files
  const searchFiles = async () => {
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setFiles(data || []);
    } catch (error) {
      console.error('Error searching files:', error);
      alert('ไม่สามารถค้นหาได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Load available folders for move operation
  const loadAvailableFolders = async () => {
    try {
      const response = await fetch(`${API_BASE}/folders?folderId=root`, {
        cache: 'no-cache'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableFolders(data.folders || []);
      } else {
        // Fallback: use current files that are folders
        const folderFiles = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
        setAvailableFolders(folderFiles);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      // Fallback: use current files that are folders
      const folderFiles = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
      setAvailableFolders(folderFiles);
    }
  };

  // Move files to target folder
  const moveFiles = async (fileIds, targetFolderId) => {
    try {
      const response = await fetch(`${API_BASE}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, targetFolderId, currentFolderId: currentFolder })
      });

      if (response.ok) {
        console.log('✅ Files moved successfully');
        loadFiles(); // Refresh current folder
        setSelectedFiles(new Set()); // Clear selection
        setShowMoveDialog(false);
        alert('ย้ายไฟล์สำเร็จ!');
      } else {
        let errorMessage = 'Failed to move files';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error moving files:', error);
      
      if (error.name === 'SyntaxError' && error.message.includes('expected pattern')) {
        alert('เซิร์ฟเวอร์ยังไม่พร้อม กรุณารีเฟรชหน้าและลองใหม่');
      } else if (error.message.includes('404')) {
        alert('ฟีเจอร์ย้ายไฟล์ยังไม่พร้อมใช้งาน กรุณารีสตาร์ทเซิร์ฟเวอร์');
      } else {
        alert('ไม่สามารถย้ายไฟล์ได้: ' + error.message);
      }
    }
  };

  // Start move operation
  const startMoveOperation = () => {
    if (selectedFiles.size === 0) {
      alert('กรุณาเลือกไฟล์ที่ต้องการย้าย');
      return;
    }
    
    const selectedFileObjects = files.filter(f => selectedFiles.has(f.id));
    setMoveTarget({ files: selectedFileObjects, targetFolder: null });
    setShowMoveDialog(true);
    loadAvailableFolders();
  };

  // Handle context menu
  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  // Handle clicking outside context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        const allFileIds = new Set(files.map(f => f.id));
        setSelectedFiles(allFileIds);
      }
      
      // Escape - Clear selection or close dialogs
      if (e.key === 'Escape') {
        setSelectedFiles(new Set());
        setShowMoveDialog(false);
        closeContextMenu();
      }
      
      // Delete - Delete selected files
      if (e.key === 'Delete' && selectedFiles.size > 0) {
        const fileNames = files.filter(f => selectedFiles.has(f.id)).map(f => f.name).join(', ');
        if (confirm(`คุณต้องการลบไฟล์ ${selectedFiles.size} รายการนี้หรือไม่?\n\n${fileNames}`)) {
          selectedFiles.forEach(fileId => {
            const file = files.find(f => f.id === fileId);
            if (file) {
              deleteFile(fileId, file.name);
            }
          });
        }
      }
      
      // F2 - Rename (if single file selected)
      if (e.key === 'F2' && selectedFiles.size === 1) {
        const fileId = Array.from(selectedFiles)[0];
        const file = files.find(f => f.id === fileId);
        if (file) {
          renameFile(fileId, file.name);
        }
      }
      
      // Ctrl/Cmd + X - Move selected files
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedFiles.size > 0) {
        e.preventDefault();
        startMoveOperation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [files, selectedFiles]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter files based on search
  const filteredFiles = files.filter(file => 
    searchQuery ? file.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  useEffect(() => {
    console.log('🔄 Effect triggered - loading files for folder:', currentFolder);
    loadFiles();
  }, [currentFolder, sortBy]);

  // Debug current state
  useEffect(() => {
    console.log('📊 Current state:', {
      currentFolder,
      filesCount: files.length,
      filteredCount: filteredFiles.length,
      searchQuery
    });
  }, [currentFolder, files, filteredFiles, searchQuery]);

  const FileCard = ({ file }) => {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    const isSelected = selectedFiles.has(file.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-lg group relative ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'
        }`}
        onDoubleClick={() => isFolder && navigateToFolder(file.id, file.name)}
        onContextMenu={(e) => handleContextMenu(e, file)}
      >
        {/* Selection Checkbox - Always visible on hover or when selected */}
        <div className={`absolute top-2 left-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFileSelection(file.id);
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border-2 border-gray-300 hover:border-blue-500'
            }`}
            title={isSelected ? 'ยกเลิกการเลือก' : 'เลือกไฟล์'}
          >
            {isSelected ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-transparent" />
            )}
          </button>
        </div>

        <div 
          className="p-4 cursor-pointer" 
          onClick={() => {
            if (isFolder) {
              navigateToFolder(file.id, file.name);
            } else if (file.webViewLink) {
              window.open(file.webViewLink, '_blank');
            }
          }}
        >
          {/* File Icon and Name */}
          <div className="flex flex-col items-center mb-3">
            <div className={`mb-3 ${isFolder ? 'text-blue-500' : 'text-gray-400'}`}>
              {isFolder ? (
                <Folder className="w-12 h-12" />
              ) : (
                <File className="w-12 h-12" />
              )}
            </div>
            
            <div className="text-center w-full">
              <p className="font-medium text-sm text-gray-900 truncate mb-1" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {isFolder ? 'โฟลเดอร์' : formatFileSize(file.size)}
              </p>
            </div>
          </div>
          
          {/* File Info Footer */}
          <div className="mt-2 text-xs text-gray-400 text-center">
            <p>{formatDate(file.modifiedTime)}</p>
          </div>
        </div>
        
        {/* Action Buttons - Show on hover */}
        <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToFolder(file.id, file.name);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="เปิดโฟลเดอร์"
            >
              <FolderOpen className="w-3 h-3" />
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, file);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="ตัวเลือกเพิ่มเติม"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
          
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="ดูใน Google Drive"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Google Drive Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-normal text-gray-900">Drive</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Server Status Indicator */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                serverError 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  serverError ? 'bg-red-500' : 'bg-green-500'
                }`} />
                <span>{serverError ? 'Offline' : 'Online'}</span>
              </div>
              
              <Button
                onClick={() => {
                  console.log('🔄 Force refresh clicked');
                  loadFiles();
                }}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="text-gray-600 hover:bg-gray-100"
                title="รีเฟรช"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
                title={`เปลี่ยนเป็น ${viewMode === 'grid' ? 'รายการ' : 'ตาราง'}`}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="ตัวเลือกเพิ่มเติม"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Action Bar */}
        <div className="px-6 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Select All Checkbox */}
              {files.length > 0 && (
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (selectedFiles.size === files.length) {
                        setSelectedFiles(new Set());
                      } else {
                        setSelectedFiles(new Set(files.map(f => f.id)));
                      }
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedFiles.size === files.length
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : selectedFiles.size > 0
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                    title={selectedFiles.size === files.length ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                  >
                    {selectedFiles.size === files.length ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : selectedFiles.size > 0 ? (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    ) : null}
                  </button>
                </div>
              )}
              
              <div className="relative max-w-xl flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาใน Drive"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchFiles()}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border-0 bg-transparent text-gray-600 focus:outline-none"
              >
                <option value="modifiedTime desc">แก้ไขล่าสุด</option>
                <option value="name">ชื่อ A-Z</option>
                <option value="name desc">ชื่อ Z-A</option>
                <option value="createdTime desc">สร้างล่าสุด</option>
              </select>
              
              <Button
                onClick={createFolder}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                โฟลเดอร์ใหม่
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className={IS_SHARED_DRIVE ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                อัพโหลด
              </Button>
            </div>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="px-6 py-2">
          <nav className="flex items-center text-sm text-gray-600">
            <button
              onClick={() => {
                setCurrentFolder('root');
                setFolderPath([{ id: 'root', name: 'My Drive' }]);
              }}
              className="hover:text-blue-600 transition-colors flex items-center px-2 py-1 rounded hover:bg-gray-100"
            >
              <Home className="w-4 h-4 mr-1" />
              My Drive
            </button>
            {folderPath.length > 1 && (
              <>
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                {folderPath.slice(1).map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <button
                      onClick={() => navigateToPath(index + 1)}
                      className="hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                    >
                      {folder.name}
                    </button>
                    {index < folderPath.length - 2 && (
                      <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Shared Drive Status - Compact */}
      {IS_SHARED_DRIVE ? (
        <div className="px-6 py-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <p className="text-sm text-green-700">
                ใช้งาน Shared Drive: <strong>Login Learning Platform</strong>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 py-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-700">
                การอัพโหลดจำกัด - ต้องใช้ Shared Drive
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      <AnimatePresence>
        {Object.keys(uploadProgress).length > 0 && (
          <div className="px-6 py-2">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <h3 className="font-medium mb-3 flex items-center text-blue-800">
                <Upload className="w-4 h-4 mr-2" />
                กำลังอัพโหลด
              </h3>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-sm mb-1 text-blue-700">
                    <span className="truncate">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File List Container */}
      <div className="flex-1 px-6 pb-6">
        {serverError ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <Cloud className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้
            </h3>
            <p className="text-gray-500 mb-6">
              เซิร์ฟเวอร์ Google Drive API หยุดทำงาน
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h4 className="font-medium text-yellow-800 mb-2">🔧 วิธีแก้ไข:</h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. เปิด Terminal</li>
                <li>2. cd "/Users/techit/Desktop/Code/New Web Login"</li>
                <li>3. node server.js</li>
              </ol>
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button 
                onClick={() => {
                  setServerError(false);
                  loadFiles();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                ลองใหม่
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดไฟล์...</p>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Folder className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? `ไม่พบ "${searchQuery}"` : 'โฟลเดอร์ว่างเปล่า'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการอัพโหลดไฟล์หรือสร้างโฟลเดอร์'}
            </p>
            
            {!searchQuery && (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    อัพโหลดไฟล์
                  </Button>
                  <Button 
                    onClick={createFolder}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างโฟลเดอร์
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="mb-1"><strong>หมายเหตุ:</strong> หากเกิดข้อผิดพลาดเกี่ยวกับการย้ายไฟล์</p>
                  <p>กรุณารีสตาร์ทเซิร์ฟเวอร์ด้วยคำสั่ง: <code className="bg-gray-200 px-1 rounded">node server.js</code></p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {selectedFiles.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800">
                    เลือกแล้ว {selectedFiles.size} รายการ
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={startMoveOperation}
                      size="sm"
                      variant="outline"
                      className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Move className="w-3 h-3 mr-1" />
                      ย้าย
                    </Button>
                    <button
                      onClick={() => setSelectedFiles(new Set())}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ยกเลิกการเลือก
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                : 'grid-cols-1'
            }`}>
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Move Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Move className="w-5 h-5 mr-2" />
                ย้ายไฟล์และโฟลเดอร์
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  ไฟล์ที่เลือก ({moveTarget.files.length} รายการ):
                </p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                  {moveTarget.files.map(file => (
                    <div key={file.id} className="flex items-center text-xs py-1">
                      {file.mimeType === 'application/vnd.google-apps.folder' ? 
                        <Folder className="w-3 h-3 mr-1 text-blue-600" /> : 
                        <File className="w-3 h-3 mr-1 text-gray-600" />
                      }
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกโฟลเดอร์ปลายทาง:
                </label>
                <select
                  value={moveTarget.targetFolder || ''}
                  onChange={(e) => setMoveTarget(prev => ({
                    ...prev, 
                    targetFolder: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">เลือกโฟลเดอร์...</option>
                  <option value="root">📁 My Drive (Root)</option>
                  <option value={DEFAULT_FOLDER}>
                    🏢 {IS_SHARED_DRIVE ? 'Login Learning Platform' : 'Database'}
                  </option>
                  {availableFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowMoveDialog(false)}
                  variant="outline"
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={() => {
                    if (!moveTarget.targetFolder) {
                      alert('กรุณาเลือกโฟลเดอร์ปลายทาง');
                      return;
                    }
                    moveFiles(
                      moveTarget.files.map(f => f.id), 
                      moveTarget.targetFolder
                    );
                  }}
                  size="sm"
                  disabled={!moveTarget.targetFolder}
                >
                  <Move className="w-4 h-4 mr-2" />
                  ย้าย
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px`,
            transform: 'translate(-50%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file && (
            <>
              {contextMenu.file.mimeType === 'application/vnd.google-apps.folder' && (
                <button
                  onClick={() => {
                    navigateToFolder(contextMenu.file.id, contextMenu.file.name);
                    closeContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FolderOpen className="w-4 h-4 mr-3" />
                  เปิดโฟลเดอร์
                </button>
              )}
              
              <button
                onClick={() => {
                  renameFile(contextMenu.file.id, contextMenu.file.name);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Edit className="w-4 h-4 mr-3" />
                เปลี่ยนชื่อ
              </button>

              <button
                onClick={() => {
                  setSelectedFiles(new Set([contextMenu.file.id]));
                  startMoveOperation();
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Move className="w-4 h-4 mr-3" />
                ย้าย
              </button>

              {contextMenu.file.webViewLink && (
                <>
                  <hr className="my-1" />
                  <a
                    href={contextMenu.file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeContextMenu}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-3" />
                    ดูใน Google Drive
                  </a>
                </>
              )}

              <hr className="my-1" />
              <button
                onClick={() => {
                  deleteFile(contextMenu.file.id, contextMenu.file.name);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                ลบ
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminGoogleDrivePage;