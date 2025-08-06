import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  Save,
  Calendar,
  Award,
  Download,
  Eye,
  Edit3,
  Paperclip,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast.jsx"
import FileUploadZone from "../components/FileUploadZone";
import {
  getAssignmentByContentId,
  getUserSubmissions,
  createSubmission,
  updateSubmission,
  submitFinalSubmission,
  uploadAssignmentFile,
  validateFile,
} from "../lib/assignmentService";

const AssignmentPlayer = ({ contentId, assignment, onComplete }) => {
  const { toast } = useToast();

  // Helper function to determine status from submission data
  const getSubmissionStatus = (submission) => {
    if (!submission) return "draft";

    if (submission.submitted_at) {
      if (submission.graded_at) return "graded";
      return "submitted";
    }

    return "draft";
  };

  // Assignment state
  const [loading, setLoading] = useState(true);
  const [assignmentData, setAssignmentData] = useState(assignment);
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState(null);

  // Form state
  const [submissionText, setSubmissionText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // View state
  const [mode, setMode] = useState("submit"); // 'submit', 'view', 'edit'

  const loadAssignmentData = useCallback(async () => {
    setLoading(true);

    try {
      let currentAssignmentData = assignmentData;
      // Load assignment if not provided
      if (!currentAssignmentData) {
        const { data: assignmentResult, error: assignmentError } =
          await getAssignmentByContentId(contentId);
        if (assignmentError) throw assignmentError;
        setAssignmentData(assignmentResult);
        currentAssignmentData = assignmentResult;
      }

      // Load user submissions
      if (currentAssignmentData) {
        const { data: submissionsData, error: submissionsError } =
          await getUserSubmissions(currentAssignmentData.id);
        if (submissionsError) throw submissionsError;

        setSubmissions(submissionsData);

        // Set current submission (latest one)
        if (submissionsData.length > 0) {
          const latest = submissionsData[0];
          setCurrentSubmission(latest);
          setSubmissionText(latest.submission_text || "");

          // Load attached files if any
          if (latest.attached_files) {
            try {
              const attachedFiles = JSON.parse(latest.attached_files);
              setUploadedFiles(attachedFiles || []);
            } catch (e) {
              console.error("Error parsing attached files:", e);
              setUploadedFiles([]);
            }
          } else {
            setUploadedFiles([]);
          }

          // Set mode based on submission status
          if (latest.submitted_at || latest.graded_at) {
            setMode("view");
          } else {
            setMode("edit");
          }
        }
      }
    } catch (error) {
      console.error("Error loading assignment data:", error);
      toast({
        title: "ไม่สามารถโหลดข้อมูลงานได้",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [contentId, assignmentData, toast]);

  useEffect(() => {
    loadAssignmentData();
  }, [loadAssignmentData]);

  const handleFileUpload = async (file) => {
    if (!assignmentData) return null;

    setUploading(true);
    try {
      // Validate file
      const validation = validateFile(file, assignmentData);

      if (!validation.isValid) {
        toast({
          title: "ไฟล์ไม่ถูกต้อง",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return null;
      }

      // Upload file
      const { data, error } = await uploadAssignmentFile(
        file,
        assignmentData.id
      );
      if (error) throw error;

      toast({
        title: "อัปโหลดไฟล์สำเร็จ",
        description: `อัปโหลดไฟล์ ${file.name} สำเร็จแล้ว`,
      });

      return data;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "ไม่สามารถอัปโหลดไฟล์ได้",
        description: error.message,
        variant: "destructive",
      });

      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!assignmentData) return;

    setSaving(true);
    try {
      const submissionData = {
        text: submissionText,
        attached_files: JSON.stringify(uploadedFiles),
      };

      let result;
      if (currentSubmission && !currentSubmission.submitted_at) {
        // Update existing draft
        result = await updateSubmission(currentSubmission.id, submissionData);
      } else {
        // Create new draft
        result = await createSubmission(assignmentData.id, submissionData);
      }

      if (result.error) throw result.error;

      setCurrentSubmission(result.data);

      toast({
        title: "บันทึกแบบร่างแล้ว",
        description: "งานของคุณได้รับการบันทึกเป็นแบบร่างเรียบร้อยแล้ว",
      });

      // Reload submissions
      loadAssignmentData();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "ไม่สามารถบันทึกแบบร่างได้",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignmentData) return;

    // Validate submission
    if (submissionText.trim().length === 0 && uploadedFiles.length === 0) {
      toast({
        title: "กรุณาเพิ่มเนื้อหาหรือไฟล์แนบ",
        description: "กรุณาเขียนคำตอบหรือแนบไฟล์อย่างน้อย 1 อย่าง",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = {
        text: submissionText,
        attached_files: JSON.stringify(uploadedFiles),
      };

      let result;

      if (currentSubmission) {
        // Update existing submission and mark as submitted
        result = await updateSubmission(currentSubmission.id, submissionData);
        if (!result.error) {
          // Mark as submitted
          result = await submitFinalSubmission(currentSubmission.id);
        }
      } else {
        // Create and submit new submission
        result = await createSubmission(assignmentData.id, submissionData);
        if (!result.error) {
          // Mark as submitted
          result = await submitFinalSubmission(result.data.id);
        }
      }

      if (result.error) throw result.error;

      toast({
        title: "ส่งงานสำเร็จ! 🎉",
        description: "งานของคุณได้รับการส่งเรียบร้อยแล้ว",
      });

      // Mark as completed and reload
      onComplete?.(result.data);
      setMode("view");
      loadAssignmentData();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast({
        title: "ไม่สามารถส่งงานได้",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue =
    assignmentData?.due_date && new Date() > new Date(assignmentData.due_date);
  const canEdit = mode === "submit" || mode === "edit";
  const hasSubmitted =
    currentSubmission &&
    (getSubmissionStatus(currentSubmission) === "submitted" ||
      getSubmissionStatus(currentSubmission) === "graded");

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-700">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          ไม่พบข้อมูลงาน
        </h3>
        <p className="text-gray-700">
          ไม่พบข้อมูลงานที่ต้องการ กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {assignmentData.title}
            </h3>
            <p className="text-gray-600">{assignmentData.description}</p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {hasSubmitted && (
              <div className="flex items-center space-x-1 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>ส่งแล้ว</span>
              </div>
            )}
            {isOverdue && (
              <div className="flex items-center space-x-1 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>เกินกำหนด</span>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {assignmentData.due_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-gray-700">กำหนดส่ง</p>
                <p className="text-gray-900">
                  {new Date(assignmentData.due_date).toLocaleString("th-TH", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-gray-700">คะแนนเต็ม</p>
              <p className="text-gray-900">{assignmentData.max_score || 100}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <FileText className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-gray-700">ไฟล์ที่อนุญาต</p>
              <p className="text-gray-900">
                {assignmentData.allowed_file_types?.join(", ") ||
                  "pdf, doc, docx, jpg, png"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {assignmentData.instructions && (
        <div className="glass-effect p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">คำแนะนำ</h4>
          <div className="text-gray-700 prose max-w-none">
            {assignmentData.instructions}
          </div>
        </div>
      )}

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">ประวัติการส่งงาน</h4>
          <div className="space-y-2">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-gray-800">ส่งเมื่อ:</span>
                    <span className="ml-2 text-xs text-gray-700">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleString(
                            "th-TH"
                          )
                        : "แบบร่าง"}
                    </span>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      getSubmissionStatus(submission) === "graded"
                        ? "bg-green-100 text-green-800"
                        : getSubmissionStatus(submission) === "submitted"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {getSubmissionStatus(submission) === "graded"
                      ? `ตรวจแล้ว (${submission.score || 0}/${
                          assignmentData.max_score || 100
                        })`
                      : getSubmissionStatus(submission) === "submitted"
                      ? "ส่งแล้ว"
                      : "แบบร่าง"}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCurrentSubmission(submission);
                    setSubmissionText(submission.submission_text || "");

                    // Load attached files if any
                    if (submission.attached_files) {
                      try {
                        const attachedFiles = JSON.parse(
                          submission.attached_files
                        );
                        setUploadedFiles(attachedFiles || []);
                      } catch (e) {
                        console.error("Error parsing attached files:", e);
                        setUploadedFiles([]);
                      }
                    } else {
                      setUploadedFiles([]);
                    }

                    setMode("view");
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  ดู
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Mode Switcher */}
          {currentSubmission && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={mode === "view" ? "default" : "ghost"}
                  onClick={() => setMode("view")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  ดูงาน
                </Button>
                {!hasSubmitted && (
                  <Button
                    size="sm"
                    variant={mode === "edit" ? "default" : "ghost"}
                    onClick={() => setMode("edit")}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    แก้ไข
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {mode === "view" ? (
              /* View Mode */
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  งานที่ส่ง
                </h4>

                {currentSubmission?.submission_text && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      ข้อความ/คำตอบ
                    </h5>
                    <div className="p-4 bg-white border border-gray-300 rounded-lg whitespace-pre-wrap">
                      {currentSubmission.submission_text}
                    </div>
                  </div>
                )}

                {/* Display uploaded files */}
                {uploadedFiles.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      ไฟล์แนบ
                    </h5>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Paperclip className="w-4 h-4 text-blue-400 mr-2" />
                            <span className="text-gray-900 flex-1">
                              {file.originalName || file.name}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSubmission?.feedback && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      ข้อเสนอแนะจากผู้สอน
                    </h5>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                      {currentSubmission.feedback}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  {currentSubmission ? "แก้ไขงาน" : "ส่งงาน"}
                </h4>

                {/* Text submission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ข้อความ/คำตอบ
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    disabled={!canEdit || submitting}
                    rows={8}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base shadow-sm resize-none"
                    placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ไฟล์แนบ (สูงสุด {assignmentData.max_files || 5} ไฟล์)
                  </label>
                  <FileUploadZone
                    contentId={assignmentData.id}
                    onFilesUploaded={(uploadedFiles) => {
                      setUploadedFiles((prev) => [...prev, ...uploadedFiles]);
                    }}
                    maxFiles={assignmentData.max_files || 5}
                    disabled={!canEdit || submitting}
                  />
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/10">
                    <div className="flex items-center space-x-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>การส่งงานหลังกำหนดอาจมีผลต่อคะแนน</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving || submitting}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            บันทึกแบบร่าง
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleSubmit}
                        disabled={saving || submitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            กำลังส่ง...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            ส่งงาน
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AssignmentPlayer;
