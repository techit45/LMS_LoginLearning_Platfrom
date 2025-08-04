// Google Drive API Client for Frontend
class GoogleDriveClient {
  constructor() {
    this.baseURL = '/api/drive';
  }

  // 📁 List files
  async listFiles(folderId = 'root', options = {}) {
    const params = new URLSearchParams({
      folderId,
      ...options
    });

    const response = await fetch(`${this.baseURL}/list?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }
    return response.json();
  }

  // 📤 Upload file
  async uploadFile(file, folderId = 'root') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
    return response.json();
  }

  // 🗂️ Create folder
  async createFolder(folderName, parentId = 'root') {
    const response = await fetch(`${this.baseURL}/create-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        folderName,
        parentId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }
    return response.json();
  }

  // 🗑️ Delete file
  async deleteFile(fileId) {
    const response = await fetch(`${this.baseURL}/delete?fileId=${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
    return response.json();
  }

  // ✏️ Rename file
  async renameFile(fileId, newName) {
    const response = await fetch(`${this.baseURL}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        newName
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to rename file: ${response.statusText}`);
    }
    return response.json();
  }

  // 📋 Move file
  async moveFile(fileId, newParentId, oldParentId) {
    const response = await fetch(`${this.baseURL}/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        newParentId,
        oldParentId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to move file: ${response.statusText}`);
    }
    return response.json();
  }

  // 🔍 Search files
  async searchFiles(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      ...options
    });

    const response = await fetch(`${this.baseURL}/search?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to search files: ${response.statusText}`);
    }
    return response.json();
  }

  // 🔗 Share file
  async shareFile(fileId, email, role = 'reader') {
    const response = await fetch(`${this.baseURL}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        email,
        role
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to share file: ${response.statusText}`);
    }
    return response.json();
  }

  // 📊 Get file info
  async getFileInfo(fileId) {
    const response = await fetch(`${this.baseURL}/info?fileId=${fileId}`);
    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }
    return response.json();
  }
}

// Export singleton instance
export const googleDriveClient = new GoogleDriveClient();
export default GoogleDriveClient;