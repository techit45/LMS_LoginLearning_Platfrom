import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  FileText,
  Users,
  Download,
  Eye,
  MessageSquare,
  Award,
  Clock,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAssignmentSubmissions, 
  updateSubmissionGrade,
  getAssignmentById 
} from '@/lib/assignmentService';
import SubmissionCard from '@/components/SubmissionCard';
import GradingModal from '@/components/GradingModal';

const AdminAssignmentGradingPage = () => {
  const { assignmentId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);

  useEffect(() => {
    loadAssignmentData();
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    setLoading(true);
    try {
      // Load assignment details
      const { data: assignmentData, error: assignmentError } = await getAssignmentById(assignmentId);
      if (assignmentError) throw assignmentError;
      
      setAssignment(assignmentData);

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await getAssignmentSubmissions(assignmentId);
      if (submissionsError) throw submissionsError;
      
      setSubmissions(submissionsData || []);
    } catch (error) {
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleSaveGrade = async (gradeData) => {
    try {
      const { error } = await updateSubmissionGrade(selectedSubmission.id, gradeData);
      
      if (error) throw error;

      toast({
        title: "บันทึกคะแนนสำเร็จ",
        description: `ให้คะแนน ${gradeData.score}/${assignment.max_score} คะแนน`
      });

      // Refresh submissions
      loadAssignmentData();
      setShowGradingModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      toast({
        title: "ไม่สามารถบันทึกคะแนนได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.user_profiles?.full_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) || false;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'graded' && submission.score !== null) ||
      (statusFilter === 'ungraded' && submission.score === null) ||
      (statusFilter === 'late' && submission.is_late);
    
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.score !== null).length,
    ungraded: submissions.filter(s => s.score === null).length,
    average: submissions.length > 0 
      ? Math.round(submissions.filter(s => s.score !== null)
          .reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score !== null).length) || 0
      : 0
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-400">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-12"
    >
      <Helmet>
        <title>ให้คะแนนงานมอบหมาย - ผู้ดูแลระบบ Login Learning</title>
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            to="/admin/courses" 
            className="text-slate-400 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">ให้คะแนนงานมอบหมาย</h1>
        </div>
        
        {assignment && (
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {assignment.title}
                </h2>
                <p className="text-slate-400 mb-4">{assignment.description}</p>
                <div className="flex items-center space-x-6 text-sm text-slate-400">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    คะแนนเต็ม: {assignment.max_score}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    กำหนดส่ง: {assignment.due_date ? 
                      new Date(assignment.due_date).toLocaleDateString('th-TH') : 
                      'ไม่ระบุ'
                    }
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    ส่งงานแล้ว: {stats.total} คน
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-effect p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">งานทั้งหมด</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="glass-effect p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">ให้คะแนนแล้ว</p>
              <p className="text-2xl font-bold text-green-400">{stats.graded}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="glass-effect p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">รอให้คะแนน</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.ungraded}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="glass-effect p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">คะแนนเฉลี่ย</p>
              <p className="text-2xl font-bold text-purple-400">{stats.average}</p>
            </div>
            <Award className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-effect p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="ค้นหาชื่อนักเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ungraded">รอให้คะแนน</option>
              <option value="graded">ให้คะแนนแล้ว</option>
              <option value="late">ส่งช้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'ไม่พบงานที่ตรงกับเงื่อนไขการค้นหา' 
                : 'ยังไม่มีนักเรียนส่งงาน'}
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              assignment={assignment}
              onGrade={() => handleGradeSubmission(submission)}
            />
          ))
        )}
      </div>

      {/* Grading Modal */}
      <AnimatePresence>
        {showGradingModal && selectedSubmission && (
          <GradingModal
            submission={selectedSubmission}
            assignment={assignment}
            onSave={handleSaveGrade}
            onClose={() => {
              setShowGradingModal(false);
              setSelectedSubmission(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminAssignmentGradingPage;