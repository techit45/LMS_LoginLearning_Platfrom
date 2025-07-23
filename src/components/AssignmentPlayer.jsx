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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import {
  getAssignmentByContentId,
  getUserSubmissions,
  createSubmission,
  updateSubmission,
  submitFinalSubmission,
} from "@/lib/assignmentService";

const AssignmentPlayer = ({ contentId, assignment, onComplete, onClose }) => {
  const { toast } = useToast();

  // Helper function to determine status from submission data
  const getSubmissionStatus = (submission) => {
    if (!submission) return "draft";
    if (submission.graded_at && submission.score !== null) return "graded";
    if (submission.submitted_at) return "submitted";
    return "draft";
  };

  // Assignment state
  const [loading, setLoading] = useState(true);
  const [assignmentData, setAssignmentData] = useState(assignment);
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState(null);

  // Form state
  const [submissionText, setSubmissionText] = useState("");
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI state
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
      if (currentAssignmentData?.id) {
        const { data: submissionsData, error: submissionsError } =
          await getUserSubmissions(currentAssignmentData.id);
        if (submissionsError) throw submissionsError;

        setSubmissions(submissionsData);

        // Set current submission (latest one)
        if (submissionsData.length > 0) {
          const latest = submissionsData[0];
          setCurrentSubmission(latest);
          setSubmissionText(latest.submission_text || "");
          setFiles([]); // ปิดการใช้งาน file upload ชั่วคราว

          // Set mode based on submission status
          if (
            latest.submitted_at ||
            getSubmissionStatus(latest) === "submitted" ||
            getSubmissionStatus(latest) === "graded"
          ) {
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

  const handleSaveDraft = async () => {
    if (!assignmentData) return;

    setSaving(true);
    try {
      const submissionData = {
        text: submissionText,
      };

      let result;
      if (currentSubmission && !currentSubmission.submitted_at) {
        // Update existing draft (has no submitted_at)
        result = await updateSubmission(currentSubmission.id, submissionData);
      } else {
        // Create new draft
        result = await createSubmission(assignmentData.id, submissionData);
      }

      if (result.error) throw result.error;

      setCurrentSubmission(result.data);

      toast({
        title: "บันทึกแบบร่างแล้ว",
        description: "งานของคุณได้รับการบันทึกเป็นแบบร่างแล้ว",
      });

      // Reload submissions
      loadAssignmentData();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "ไม่สามารถบันทึกได้",
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
    if (!submissionText.trim()) {
      toast({
        title: "กรุณาเพิ่มเนื้อหา",
        description: "กรุณาเขียนคำตอบหรือเนื้อหางาน",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = {
        text: submissionText,
      };

      let result;
      if (currentSubmission && !currentSubmission.submitted_at) {
        // Submit existing draft
        await updateSubmission(currentSubmission.id, submissionData);
        result = await submitFinalSubmission(currentSubmission.id);
      } else {
        // Create and submit new submission
        result = await createSubmission(assignmentData.id, submissionData);
        if (!result.error) {
          // Mark as submitted immediately
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
    currentSubmission?.submitted_at ||
    getSubmissionStatus(currentSubmission) === "submitted" ||
    getSubmissionStatus(currentSubmission) === "graded";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">กำลังโหลดงานมอบหมาย...</p>
        </div>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          ไม่พบงานมอบหมาย
        </h3>
        <p className="text-gray-700">ไม่สามารถโหลดข้อมูลงานมอบหมายได้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {assignmentData.title}
            </h3>
            <p className="text-gray-800">{assignmentData.description}</p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {hasSubmitted && (
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>ส่งแล้ว</span>
              </div>
            )}
            {isOverdue && !hasSubmitted && (
              <div className="flex items-center space-x-1 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>เกินกำหนด</span>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white border border-gray-300/30 rounded-lg">
          {assignmentData.due_date && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-gray-700">กำหนดส่ง</p>
                <p className="text-gray-900">
                  {new Date(assignmentData.due_date).toLocaleDateString(
                    "th-TH",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm">
            <Award className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-gray-700">คะแนนเต็ม</p>
              <p className="text-gray-900">
                {assignmentData.max_score || 100} คะแนน
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <FileText className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-gray-700">จำนวนไฟล์สูงสุด</p>
              <p className="text-gray-900">
                {assignmentData.max_files || 5} ไฟล์
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {assignmentData.instructions && (
        <div className="glass-effect p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">คำแนะนำ</h4>
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {assignmentData.instructions}
          </div>
        </div>
      )}

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="glass-effect p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            ประวัติการส่งงาน
          </h4>
          <div className="space-y-2">
            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-300/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <span className="text-gray-800">ส่งเมื่อ</span>
                    <span className="ml-2 text-xs text-gray-700">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleDateString(
                            "th-TH"
                          )
                        : "ยังไม่ส่ง"}
                    </span>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      getSubmissionStatus(submission) === "submitted"
                        ? "bg-green-500/20 text-green-400"
                        : getSubmissionStatus(submission) === "graded"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {getSubmissionStatus(submission) === "submitted" &&
                      "ส่งแล้ว"}
                    {getSubmissionStatus(submission) === "graded" &&
                      `ให้คะแนนแล้ว (${submission.score}/${
                        assignmentData?.max_score || 100
                      })`}
                    {getSubmissionStatus(submission) === "draft" && "แบบร่าง"}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCurrentSubmission(submission);
                    setSubmissionText(submission.submission_text || "");
                    setFiles([]); // ไม่ใช้ file upload
                    setMode("view");
                  }}
                >
                  <Eye className="w-4 h-4" />
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
          className="glass-effect rounded-lg overflow-hidden"
        >
          {/* Mode Switcher */}
          {currentSubmission && (
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center space-x-2">
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

          <div className="p-6">
            {mode === "view" ? (
              /* View Mode */
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  งานที่ส่ง
                </h4>

                {currentSubmission?.submission_text && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      ข้อความ
                    </h5>
                    <div className="p-4 bg-white border border-gray-300/30 rounded-lg text-gray-900 whitespace-pre-wrap">
                      {currentSubmission.submission_text}
                    </div>
                  </div>
                )}

                {currentSubmission?.feedback && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      ความคิดเห็นจากอาจารย์
                    </h5>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800">
                      {currentSubmission.feedback}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  {currentSubmission ? "แก้ไขงาน" : "ส่งงานมอบหมาย"}
                </h4>

                {/* Text Submission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ข้อความ/คำตอบ
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    disabled={!canEdit}
                    rows={8}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="เขียนคำตอบหรือคำอธิบายงานของคุณที่นี่..."
                  />
                </div>

                {/* File Upload - ปิดใช้งานชั่วคราว */}
                <div className="text-xs text-gray-500">
                  หมายเหตุ: การอัปโหลดไฟล์จะเพิ่มเติมในเวอร์ชันถัดไป
                  ตอนนี้ใช้ข้อความเท่านั้น
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-500">
                      {isOverdue && (
                        <div className="flex items-center space-x-1 text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>การส่งงานหลังกำหนดอาจมีผลต่อคะแนน</span>
                        </div>
                      )}
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
                        className="bg-green-500 hover:bg-green-600"
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
