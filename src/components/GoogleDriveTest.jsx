import React, { useState, useEffect } from 'react';
import { Upload, Folder, File, Trash2, Edit, Search, Share, Download } from 'lucide-react';
import { Button } from './ui/button';

function GoogleDriveTest() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('134qcR1t2BQqRUJCHexjLEoDZjU9MWPLY');
  const [uploadProgress, setUploadProgress] = useState({});

  // 📁 Load files from current folder
  const loadFiles = async (folderId = currentFolder) => {
    setLoading(true);
    try {
      const response = await fetch(`https://google-drive-api-server.onrender.com/api/drive/list?folderId=${folderId}`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📤 Upload file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', currentFolder);

    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

    try {
      const response = await fetch('https://google-drive-api-server.onrender.com/api/drive/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ File uploaded:', result);
        loadFiles(); // Refresh file list
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 2000);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // 🗂️ Create folder
  const createFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const response = await fetch('https://google-drive-api-server.onrender.com/api/drive/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderName,
          parentId: currentFolder
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Folder created:', result);
        loadFiles(); // Refresh file list
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  // 🗑️ Delete file
  const deleteFile = async (fileId, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const response = await fetch(`https://google-drive-api-server.onrender.com/api/drive/delete?fileId=${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ File deleted');
        loadFiles(); // Refresh file list
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // ✏️ Rename file
  const renameFile = async (fileId, currentName) => {
    const newName = prompt('Enter new name:', currentName);
    if (!newName || newName === currentName) return;

    try {
      const response = await fetch('https://google-drive-api-server.onrender.com/api/drive/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          newName
        })
      });

      if (response.ok) {
        console.log('✅ File renamed');
        loadFiles(); // Refresh file list
      }
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  // 🔍 Search files
  const searchFiles = async () => {
    const query = prompt('Enter search query:');
    if (!query) return;

    setLoading(true);
    try {
      const response = await fetch(`https://google-drive-api-server.onrender.com/api/drive/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setFiles(data || []);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to folder
  const navigateToFolder = (folderId) => {
    setCurrentFolder(folderId);
    loadFiles(folderId);
  };

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

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔥 Google Drive Integration Test
          </h2>
          
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </label>
            
            <Button onClick={createFolder} variant="outline">
              <Folder className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            
            <Button onClick={searchFiles} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            
            <Button onClick={() => loadFiles()} variant="outline">
              🔄 Refresh
            </Button>
            
            {currentFolder !== '134qcR1t2BQqRUJCHexjLEoDZjU9MWPLY' && (
              <Button onClick={() => navigateToFolder('134qcR1t2BQqRUJCHexjLEoDZjU9MWPLY')} variant="outline">
                🏠 Home
              </Button>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="border-b p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Upload Progress:</h3>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No files found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                
                return (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div 
                        className={`flex items-center cursor-pointer ${isFolder ? 'text-blue-600' : 'text-gray-700'}`}
                        onClick={() => isFolder && navigateToFolder(file.id)}
                      >
                        {isFolder ? (
                          <Folder className="w-5 h-5 mr-2" />
                        ) : (
                          <File className="w-5 h-5 mr-2" />
                        )}
                        <span className="font-medium truncate">{file.name}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => renameFile(file.id, file.name)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Rename"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id, file.name)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      {!isFolder && (
                        <p>Size: {formatFileSize(file.size)}</p>
                      )}
                      <p>Modified: {formatDate(file.modifiedTime)}</p>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          View in Drive
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoogleDriveTest;