import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCertificateSubmissions,
  approveCertificateRequest,
  rejectCertificateRequest,
  getCertificateStatistics
} from '../lib/certificateService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Award,
  FileText,
  Download,
  Eye,
  Filter
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminCertificateSubmissionsPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, issued, all
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load submissions
      const filters = filter !== 'all' ? { status: filter } : {};
      const { data: subData, error: subError } = await getCertificateSubmissions(filters);
      if (subError) throw new Error(subError);
      setSubmissions(subData || []);

      // Load statistics
      const { data: statsData, error: statsError } = await getCertificateStatistics();
      if (statsError) throw new Error(statsError);
      setStatistics(statsData);

    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId, notes = '') => {
    setProcessingId(submissionId);
    try {
      const { error } = await approveCertificateRequest(submissionId, notes);
      if (error) throw new Error(error);

      toast({
        title: 'สำเร็จ',
        description: 'อนุมัติคำขอใบเซอร์เรียบร้อยแล้ว'
      });

      setShowDetailModal(false);
      setReviewNotes('');
      loadData();
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submissionId, notes) => {
    if (!notes.trim()) {
      toast({
        title: 'กรุณากรอกเหตุผล',
        description: 'กรุณาระบุเหตุผลในการปฏิเสธ',
        variant: 'destructive'
      });
      return;
    }

    setProcessingId(submissionId);
    try {
      const { error } = await rejectCertificateRequest(submissionId, notes);
      if (error) throw new Error(error);

      toast({
        title: 'สำเร็จ',
        description: 'ปฏิเสธคำขอใบเซอร์เรียบร้อยแล้ว'
      });

      setShowDetailModal(false);
      setReviewNotes('');
      loadData();
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'รอพิจารณา' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'อนุมัติแล้ว' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'ปฏิเสธ' },
      issued: { bg: 'bg-green-100', text: 'text-green-800', label: 'ออกใบเซอร์แล้ว' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const openDetailModal = (submission) => {
    setSelectedSubmission(submission);
    setReviewNotes(submission.review_notes || '');
    setShowDetailModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold text-red-600">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="mt-2 text-gray-600">คุณต้องเป็น Admin เพื่อเข้าถึงหน้านี้</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">คำขอใบเซอร์</h1>
          <p className="mt-2 text-gray-600">จัดการคำขอใบประกาศนียบัตรจากนักเรียน</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">รอพิจารณา</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {statistics.totalPending || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {statistics.totalApproved || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ออกแล้ว</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {statistics.totalIssued || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statistics.totalSubmissions || 0}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'pending', label: 'รอพิจารณา' },
                { value: 'approved', label: 'อนุมัติแล้ว' },
                { value: 'issued', label: 'ออกแล้ว' },
                { value: 'rejected', label: 'ปฏิเสธ' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === item.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Submissions List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีคำขอใบเซอร์
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'ไม่มีคำขอที่รอพิจารณา' : 'ไม่มีคำขอในสถานะนี้'}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      นักเรียน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      คอร์ส
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      วันที่ขอ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      เลขที่ใบเซอร์
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.course?.title || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(submission.submitted_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">
                          {submission.certificate_number || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(submission)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            ดูรายละเอียด
                          </Button>

                          {submission.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(submission.id)}
                                disabled={processingId === submission.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                อนุมัติ
                              </Button>
                            </>
                          )}

                          {submission.status === 'issued' && submission.certificate_url && (
                            <a
                              href={submission.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4 mr-1" />
                                ดาวน์โหลด
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">รายละเอียดคำขอใบเซอร์</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      ส่งคำขอเมื่อ {new Date(selectedSubmission.submitted_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                  {getStatusBadge(selectedSubmission.status)}
                </div>

                {/* Student Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">ข้อมูลนักเรียน</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ชื่อ:</span>
                      <span className="text-sm font-medium">{selectedSubmission.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">อีเมล:</span>
                      <span className="text-sm font-medium">{selectedSubmission.student_email}</span>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">ข้อมูลคอร์ส</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">คอร์ส:</span>
                      <span className="text-sm font-medium">
                        {selectedSubmission.course?.title || '-'}
                      </span>
                    </div>
                    {selectedSubmission.template && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">เทมเพลต:</span>
                        <span className="text-sm font-medium">
                          {selectedSubmission.template.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {selectedSubmission.additional_info && Object.keys(selectedSubmission.additional_info).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">ข้อมูลเพิ่มเติม</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedSubmission.additional_info, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Certificate Info (if issued) */}
                {selectedSubmission.certificate_number && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">ข้อมูลใบเซอร์</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">เลขที่:</span>
                        <span className="text-sm font-medium font-mono">
                          {selectedSubmission.certificate_number}
                        </span>
                      </div>
                      {selectedSubmission.issued_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">ออกเมื่อ:</span>
                          <span className="text-sm font-medium">
                            {new Date(selectedSubmission.issued_at).toLocaleString('th-TH')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedSubmission.status === 'pending' ? (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมายเหตุ (ถ้ามี)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full border rounded-md px-3 py-2"
                      rows="3"
                      placeholder="ระบุหมายเหตุหรือเหตุผล..."
                    />
                  </div>
                ) : selectedSubmission.review_notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">หมายเหตุจากผู้พิจารณา</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{selectedSubmission.review_notes}</p>
                      {selectedSubmission.reviewed_by && selectedSubmission.reviewed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          โดย {selectedSubmission.reviewed_by.full_name} เมื่อ{' '}
                          {new Date(selectedSubmission.reviewed_at).toLocaleString('th-TH')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedSubmission.status === 'pending' && (
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedSubmission.id, reviewNotes)}
                      disabled={processingId === selectedSubmission.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      ปฏิเสธ
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedSubmission.id, reviewNotes)}
                      disabled={processingId === selectedSubmission.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      อนุมัติ
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCertificateSubmissionsPage;
