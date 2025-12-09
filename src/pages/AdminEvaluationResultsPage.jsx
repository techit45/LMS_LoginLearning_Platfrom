import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getEvaluationById,
  getEvaluationSubmissions,
  getEvaluationStatistics,
  exportEvaluationToCSV
} from '../lib/evaluationService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  ArrowLeft,
  Download,
  Users,
  Star,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminEvaluationResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [evaluation, setEvaluation] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [id, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load evaluation details
      const { data: evalData, error: evalError } = await getEvaluationById(id);
      if (evalError) throw new Error(evalError);
      setEvaluation(evalData);

      // Load submissions
      const { data: subData, error: subError } = await getEvaluationSubmissions({
        evaluationId: id
      });
      if (subError) throw new Error(subError);
      setSubmissions(subData || []);

      // Load statistics
      const { data: statsData, error: statsError } = await getEvaluationStatistics(id);
      if (statsError) throw new Error(statsError);
      setStatistics(statsData);

    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
      navigate('/admin/evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data, error } = await exportEvaluationToCSV(id);
      if (error) throw new Error(error);

      // Create download link
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `evaluation_${id}_results.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'สำเร็จ',
        description: 'ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const renderQuestionStats = (questionStat) => {
    if (questionStat.questionType === 'rating') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">คะแนนเฉลี่ย:</span>
            <span className="text-lg font-bold text-indigo-600">
              {questionStat.average?.toFixed(2) || 0} / 5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${((questionStat.average || 0) / 5) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Min: {questionStat.min || 0}</span>
            <span>Max: {questionStat.max || 0}</span>
          </div>
        </div>
      );
    }

    if (questionStat.questionType === 'multiple_choice' && questionStat.distribution) {
      const total = Object.values(questionStat.distribution).reduce((a, b) => a + b, 0);
      return (
        <div className="space-y-2">
          {Object.entries(questionStat.distribution).map(([choice, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return (
              <div key={choice} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{choice}</span>
                  <span className="text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600">
        {questionStat.totalResponses} คำตอบ
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold text-red-600">ไม่มีสิทธิ์เข้าถึง</h2>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/evaluations')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {evaluation?.title}
              </h1>
              <p className="text-gray-600">{evaluation?.description}</p>
            </div>
            <Button onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              ดาวน์โหลด CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">จำนวนผู้ตอบ</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statistics?.totalSubmissions || 0}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">คะแนนเฉลี่ย</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statistics?.averageRating?.toFixed(2) || 0}
                  <span className="text-lg text-gray-500"> / 5</span>
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">อัตราการตอบ</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statistics?.completionRate?.toFixed(1) || 0}
                  <span className="text-lg text-gray-500">%</span>
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Question Statistics */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            สถิติแต่ละคำถาม
          </h2>

          <div className="space-y-6">
            {statistics?.questionStats?.map((qStat, index) => (
              <div key={qStat.questionId} className="border-b pb-6 last:border-b-0">
                <h3 className="font-medium text-gray-900 mb-4">
                  {index + 1}. {qStat.questionText}
                </h3>
                {renderQuestionStats(qStat)}
              </div>
            ))}
          </div>
        </Card>

        {/* Individual Submissions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            รายการผู้ตอบทั้งหมด ({submissions.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ผู้ตอบ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    อีเมล
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    วันที่ตอบ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    คำตอบ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.student?.full_name || 'ไม่ระบุ'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {submission.student?.email || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(submission.submitted_at).toLocaleString('th-TH')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {submission.responses?.length || 0} คำตอบ
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {submissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>ยังไม่มีผู้ตอบแบบประเมิน</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminEvaluationResultsPage;
