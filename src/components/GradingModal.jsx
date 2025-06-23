import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X,
  Save,
  Award,
  MessageSquare,
  User,
  Calendar,
  FileText,
  Download,
  Star,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const GradingModal = ({ submission, assignment, onSave, onClose }) => {
  const { toast } = useToast();
  const [gradeData, setGradeData] = useState({
    score: submission.score || '',
    feedback: submission.feedback || '',
    grading_rubric_scores: submission.grading_rubric_scores || {}
  });
  const [loading, setLoading] = useState(false);

  // Pre-defined quick feedback options
  const quickFeedbacks = [
    "งานดีมาก! เข้าใจเนื้อหาอย่างถ่องแท้",
    "งานดี แต่ยังมีจุดที่ต้องปรับปรุง",
    "เป็นการทำงานที่ดี คิดวิเคราะห์ได้ดี",
    "งานมีคุณภาพ แต่ควรใส่ใจในรายละเอียดมากขึ้น",
    "ควรศึกษาเพิ่มเติมและปรับปรุงในครั้งต่อไป",
    "งานยังไม่ตรงตามที่กำหนด กรุณาทำใหม่"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!gradeData.score || gradeData.score === '') {
      toast({
        title: "กรุณาใส่คะแนน",
        variant: "destructive"
      });
      return;
    }

    const score = parseFloat(gradeData.score);
    if (isNaN(score) || score < 0 || score > assignment.max_score) {
      toast({
        title: "คะแนนไม่ถูกต้อง",
        description: `คะแนนต้องอยู่ระหว่าง 0-${assignment.max_score}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...gradeData,
        score: score,
        graded_at: new Date().toISOString(),
        graded_by: 'admin' // หรือ user ID ของ admin
      });
    } catch (error) {
      console.error('Grading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (fileName, filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-files')
        .download(filePath);
      
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "ไม่สามารถดาวน์โหลดไฟล์ได้",
        variant: "destructive"
      });
    }
  };

  const getScoreColor = (score) => {
    const percentage = (score / assignment.max_score) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeLetter = (score) => {
    const percentage = (score / assignment.max_score) * 100;
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-effect rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">ให้คะแนนงานมอบหมาย</h2>
              <p className="text-slate-400 mt-1">{assignment.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-88px)]">
          {/* Left Panel - Submission Details */}
          <div className="lg:w-1/2 p-6 border-r border-white/10 overflow-y-auto">
            {/* Student Info */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {submission.user_profiles?.full_name || 'ไม่ระบุชื่อ'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {submission.user_profiles?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center text-sm text-slate-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  ส่งเมื่อ: {new Date(submission.submitted_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                
                {submission.is_late && (
                  <div className="flex items-center text-sm text-red-400">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    ส่งช้า
                  </div>
                )}
              </div>
            </div>

            {/* Submission Notes */}
            {submission.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">หมายเหตุจากนักเรียน:</h4>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-sm text-slate-300">{submission.notes}</p>
                </div>
              </div>
            )}

            {/* Files */}
            {submission.file_paths && submission.file_paths.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">ไฟล์ที่ส่ง:</h4>
                <div className="space-y-2">
                  {submission.file_paths.map((filePath, index) => {
                    const fileName = filePath.split('/').pop();
                    return (
                      <div key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-blue-400 mr-2" />
                          <span className="text-sm text-slate-300">{fileName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadFile(fileName, filePath)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignment Details */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-300 mb-2">รายละเอียดงาน:</h4>
              <p className="text-sm text-slate-400 mb-3">{assignment.instructions}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">คะแนนเต็ม:</span>
                <span className="text-white font-semibold">{assignment.max_score} คะแนน</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Grading Form */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Score Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  คะแนน *
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max={assignment.max_score}
                      step="0.5"
                      value={gradeData.score}
                      onChange={(e) => setGradeData(prev => ({ ...prev, score: e.target.value }))}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-xl font-bold"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="text-xl text-slate-400">/ {assignment.max_score}</div>
                  {gradeData.score && (
                    <div className={`text-lg font-bold ${getScoreColor(parseFloat(gradeData.score))}`}>
                      {getGradeLetter(parseFloat(gradeData.score))}
                    </div>
                  )}
                </div>
                
                {/* Score Percentage */}
                {gradeData.score && (
                  <div className="mt-2 text-center">
                    <span className={`text-sm ${getScoreColor(parseFloat(gradeData.score))}`}>
                      {Math.round((parseFloat(gradeData.score) / assignment.max_score) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Score Buttons */}
              <div>
                <p className="text-sm text-slate-400 mb-2">คะแนนด่วน:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map(percentage => {
                    const score = Math.round((percentage / 100) * assignment.max_score);
                    return (
                      <Button
                        key={percentage}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGradeData(prev => ({ ...prev, score: score.toString() }))}
                        className="text-xs"
                      >
                        {percentage}%
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ความคิดเห็น/คำแนะนำ
                </label>
                <textarea
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                  rows={6}
                  placeholder="ให้คำแนะนำและความคิดเห็นเกี่ยวกับงานของนักเรียน..."
                />
              </div>

              {/* Quick Feedback */}
              <div>
                <p className="text-sm text-slate-400 mb-2">ความคิดเห็นด่วน:</p>
                <div className="space-y-2">
                  {quickFeedbacks.map((feedback, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setGradeData(prev => ({ 
                        ...prev, 
                        feedback: prev.feedback ? `${prev.feedback}\n\n${feedback}` : feedback 
                      }))}
                      className="w-full text-left p-2 text-xs bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                    >
                      {feedback}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={onClose}>
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      บันทึกคะแนน
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GradingModal;