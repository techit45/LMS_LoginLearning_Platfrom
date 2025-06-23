import React from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Calendar,
  Download,
  Award,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const SubmissionCard = ({ submission, assignment, onGrade }) => {
  const isGraded = submission.score !== null;
  const isLate = submission.is_late;
  const submitDate = new Date(submission.submitted_at);
  
  // Calculate days late if applicable
  const daysLate = isLate && assignment.due_date 
    ? Math.ceil((submitDate - new Date(assignment.due_date)) / (1000 * 60 * 60 * 24))
    : 0;

  const handleDownloadFile = async (fileName, filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-files')
        .download(filePath);
      
      if (error) throw error;

      // Create download link
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
      alert('ไม่สามารถดาวน์โหลดไฟล์ได้');
    }
  };

  const getStatusColor = () => {
    if (isGraded) return 'text-green-400';
    if (isLate) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getStatusIcon = () => {
    if (isGraded) return <CheckCircle className="w-4 h-4" />;
    if (isLate) return <AlertTriangle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isGraded) return `ให้คะแนนแล้ว (${submission.score}/${assignment.max_score})`;
    if (isLate) return `ส่งช้า ${daysLate} วัน`;
    return 'รอให้คะแนน';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect p-6 rounded-xl hover:bg-slate-700/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        {/* Student Info */}
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {submission.user_profiles?.full_name || 'ไม่ระบุชื่อ'}
              </h3>
              <p className="text-sm text-slate-400">
                {submission.user_profiles?.email || 'ไม่ระบุอีเมล'}
              </p>
            </div>
          </div>

          {/* Submission Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-sm text-slate-400">
              <Calendar className="w-4 h-4 mr-2" />
              ส่งเมื่อ: {submitDate.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className={`flex items-center text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </div>
          </div>

          {/* Submission Note */}
          {submission.notes && (
            <div className="mb-4">
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-start">
                  <MessageSquare className="w-4 h-4 text-slate-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-1">หมายเหตุจากนักเรียน:</p>
                    <p className="text-sm text-slate-400">{submission.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files */}
          {submission.file_paths && submission.file_paths.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-300 mb-2">ไฟล์ที่ส่ง:</p>
              <div className="space-y-2">
                {submission.file_paths.map((filePath, index) => {
                  const fileName = filePath.split('/').pop();
                  return (
                    <div key={index} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
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

          {/* Feedback (if graded) */}
          {isGraded && submission.feedback && (
            <div className="mb-4">
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                <div className="flex items-start">
                  <Award className="w-4 h-4 text-green-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-300 mb-1">ความคิดเห็นจากอาจารย์:</p>
                    <p className="text-sm text-green-200">{submission.feedback}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-6 flex flex-col space-y-2">
          <Button
            onClick={onGrade}
            className={`${
              isGraded 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Award className="w-4 h-4 mr-2" />
            {isGraded ? 'แก้ไขคะแนน' : 'ให้คะแนน'}
          </Button>
          
          {submission.file_paths && submission.file_paths.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Download all files
                submission.file_paths.forEach(filePath => {
                  const fileName = filePath.split('/').pop();
                  handleDownloadFile(fileName, filePath);
                });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              ดาวน์โหลดทั้งหมด
            </Button>
          )}
        </div>
      </div>

      {/* Score Badge */}
      {isGraded && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm text-slate-400">คะแนน:</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white mr-1">{submission.score}</span>
              <span className="text-lg text-slate-400">/ {assignment.max_score}</span>
              <span className="ml-2 text-sm text-slate-400">
                ({Math.round((submission.score / assignment.max_score) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SubmissionCard;