import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast.jsx"
import {
  uploadMultipleAttachments,
  validateAttachmentFile,
  formatFileSize,
  getFileCategory,
  isPreviewable,
} from "../lib/attachmentService";

const FileUploadZone = ({
  contentId,
  onFilesUploaded,
  maxFiles = 5,
  disabled = false,
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState({});
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Generate thumbnail for images
  const generateThumbnail = async (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(null);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", 0.8);
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (newFiles) => {
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "ไฟล์เกินจำนวนที่กำหนด",
        description: `สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    for (const file of newFiles) {
      const validation = validateAttachmentFile(file);
      if (validation.isValid) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substring(2),
          status: "pending",
          error: null,
        });
      } else {
        invalidFiles.push({
          name: file.name,
          errors: validation.errors,
        });
      }
    }

    if (invalidFiles.length > 0) {
      toast({
        title: "ไฟล์บางไฟล์ไม่ถูกต้อง",
        description: invalidFiles
          .map((f) => `${f.name}: ${f.errors.join(", ")}`)
          .join("\n"),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);

      // Generate previews for images
      for (const fileObj of validFiles) {
        if (fileObj.file.type.startsWith("image/")) {
          const thumbnail = await generateThumbnail(fileObj.file);
          if (thumbnail) {
            setPreviews((prev) => ({
              ...prev,
              [fileObj.id]: URL.createObjectURL(thumbnail),
            }));
          }
        }
      }
    }
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      if (newPreviews[fileId]) {
        URL.revokeObjectURL(newPreviews[fileId]);
        delete newPreviews[fileId];
      }
      return newPreviews;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      const filesToUpload = files
        .filter((f) => f.status === "pending")
        .map((f) => f.file);

      const result = await uploadMultipleAttachments(filesToUpload, contentId);

      if (result.data) {
        // Update file statuses
        setFiles((prev) =>
          prev.map((fileObj) => {
            const wasSuccessful = result.data.find(
              (item) => item.filename === fileObj.file.name
            );
            const wasFailed = result.errors?.find(
              (err) => err.file === fileObj.file.name
            );

            if (wasSuccessful) {
              return { ...fileObj, status: "completed" };
            } else if (wasFailed) {
              return { ...fileObj, status: "error", error: wasFailed.error };
            }
            return fileObj;
          })
        );

        if (result.success > 0) {
          toast({
            title: "อัปโหลดสำเร็จ",
            description: `อัปโหลดไฟล์สำเร็จ ${result.success} ไฟล์`,
          });

          onFilesUploaded?.(result.data);
        }

        if (result.failed > 0) {
          toast({
            title: "อัปโหลดบางไฟล์ไม่สำเร็จ",
            description: `${result.failed} ไฟล์อัปโหลดไม่สำเร็จ`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดไฟล์ได้",
        variant: "destructive",
      });
    }

    setUploading(false);
  };

  const clearCompleted = () => {
    const completedIds = files
      .filter((f) => f.status === "completed")
      .map((f) => f.id);

    completedIds.forEach((id) => {
      if (previews[id]) {
        URL.revokeObjectURL(previews[id]);
      }
    });

    setFiles((prev) => prev.filter((f) => f.status !== "completed"));
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      completedIds.forEach((id) => delete newPreviews[id]);
      return newPreviews;
    });
  };

  const getFileIcon = (fileType) => {
    const category = getFileCategory(fileType.split("/")[1]);
    switch (category) {
      case "image":
        return <ImageIcon className="w-6 h-6 text-blue-500" />;
      case "document":
        return <File className="w-6 h-6 text-red-500" />;
      case "video":
        return <File className="w-6 h-6 text-purple-500" />;
      case "audio":
        return <File className="w-6 h-6 text-green-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusIcon = (status, error) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />

        <Upload
          className={`w-8 h-8 mx-auto mb-3 ${
            disabled ? "text-gray-400" : "text-gray-600"
          }`}
        />

        <p
          className={`text-sm font-medium ${
            disabled ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {isDragging ? "วางไฟล์ที่นี่" : "คลิกหรือลากไฟล์มาวางที่นี่"}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          รองรับ: รูปภาพ, PDF, เอกสาร (สูงสุด 50MB ต่อไฟล์)
        </p>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((fileObj) => (
              <motion.div
                key={fileObj.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${
                  fileObj.status === "error" ? "border border-red-200" : ""
                }`}
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {previews[fileObj.id] ? (
                    <img
                      src={previews[fileObj.id]}
                      alt={fileObj.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-lg">
                      {getFileIcon(fileObj.file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileObj.file.size)}
                  </p>
                  {fileObj.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileObj.error.message || "เกิดข้อผิดพลาด"}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  {getStatusIcon(fileObj.status, fileObj.error)}

                  {fileObj.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileObj.id)}
                      className="p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-gray-600">
            {files.length} ไฟล์ (
            {files.filter((f) => f.status === "pending").length} รอการอัปโหลด)
          </span>

          <div className="flex space-x-2">
            {files.some((f) => f.status === "completed") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompleted}
                disabled={uploading}
              >
                ล้างไฟล์ที่เสร็จแล้ว
              </Button>
            )}

            <Button
              onClick={uploadFiles}
              disabled={
                uploading ||
                files.filter((f) => f.status === "pending").length === 0
              }
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  อัปโหลด ({files.filter((f) => f.status === "pending").length})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
