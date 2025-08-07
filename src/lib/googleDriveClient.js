// Google Drive API Client for Frontend
class GoogleDriveClient {
  constructor() {
    // Use Supabase Edge Function for Google Drive API
    this.baseURL = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
    this.authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';
  }

  // 📁 List files
  async listFiles(folderId = 'root', options = {}) {
    const params = new URLSearchParams({
      folderId,
      ...options
    });

    const response = await fetch(`${this.baseURL}/list?${params}`, {
      headers: {
        'Authorization': this.authHeader,
      },
    });
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

    const response = await fetch(`${this.baseURL}/simple-upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
      },
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
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
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