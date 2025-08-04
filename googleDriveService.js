import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load service account credentials
      const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
      const credentials = JSON.parse(
        fs.readFileSync(path.resolve(credentialsPath), 'utf8')
      );

      // Create JWT client
      this.auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ]
      );

      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.initialized = true;

      console.log('✅ Google Drive Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive Service:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // 📁 List files in a folder
  async listFiles(folderId = 'root', options = {}) {
    await this.ensureInitialized();

    try {
      const {
        pageSize = 50,
        orderBy = 'modifiedTime desc',
        q = ''
      } = options;

      const query = `'${folderId}' in parents and trashed=false${q ? ` and ${q}` : ''}`;

      const response = await this.drive.files.list({
        q: query,
        pageSize,
        orderBy,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, thumbnailLink, webViewLink, webContentLink, parents)'
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // 📤 Upload file
  async uploadFile(fileBuffer, fileName, mimeType, folderId = 'root') {
    await this.ensureInitialized();

    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType,
        body: fileBuffer
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, size, createdTime, webViewLink'
      });

      console.log(`✅ File uploaded: ${fileName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // 🗂️ Create folder
  async createFolder(folderName, parentId = 'root') {
    await this.ensureInitialized();

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, createdTime'
      });

      console.log(`✅ Folder created: ${folderName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // 🗑️ Delete file
  async deleteFile(fileId) {
    await this.ensureInitialized();

    try {
      await this.drive.files.delete({
        fileId
      });

      console.log(`✅ File deleted: ${fileId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // ✏️ Rename file
  async renameFile(fileId, newName) {
    await this.ensureInitialized();

    try {
      const response = await this.drive.files.update({
        fileId,
        requestBody: {
          name: newName
        },
        fields: 'id, name, modifiedTime'
      });

      console.log(`✅ File renamed: ${newName} (ID: ${fileId})`);
      return response.data;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  }

  // 📋 Move file
  async moveFile(fileId, newParentId, oldParentId) {
    await this.ensureInitialized();

    try {
      const response = await this.drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: oldParentId,
        fields: 'id, name, parents'
      });

      console.log(`✅ File moved: ${fileId} to ${newParentId}`);
      return response.data;
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }

  // 📥 Download file
  async downloadFile(fileId) {
    await this.ensureInitialized();

    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // 🔍 Search files
  async searchFiles(query, options = {}) {
    await this.ensureInitialized();

    try {
      const {
        pageSize = 50,
        orderBy = 'relevance'
      } = options;

      const searchQuery = `name contains '${query}' and trashed=false`;

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize,
        orderBy,
        fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink)'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  // 🔗 Share file
  async shareFile(fileId, email, role = 'reader') {
    await this.ensureInitialized();

    try {
      // Add permission
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role, // 'owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader'
          type: 'user',
          emailAddress: email
        }
      });

      // Get shareable link
      const response = await this.drive.files.get({
        fileId,
        fields: 'webViewLink, webContentLink'
      });

      console.log(`✅ File shared with ${email} as ${role}`);
      return response.data;
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  // 📊 Get file info
  async getFileInfo(fileId) {
    await this.ensureInitialized();

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, owners, permissions, parents, webViewLink, webContentLink, thumbnailLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default GoogleDriveService;