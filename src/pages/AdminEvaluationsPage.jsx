import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getEvaluations,
  deleteEvaluation,
  getEvaluationStatistics
} from '../lib/evaluationService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  FileText,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminEvaluationsPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive, archived
  const [typeFilter, setTypeFilter] = useState('all'); // all, satisfaction, knowledge, pre_test, post_test

  useEffect(() => {
    if (isAdmin) {
      loadEvaluations();
    }
  }, [isAdmin, filter, typeFilter]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      if (typeFilter !== 'all') filters.type = typeFilter;

      const { data, error } = await getEvaluations(filters);

      if (error) throw new Error(error);

      setEvaluations(data || []);
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

  const handleDelete = async (evaluationId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบแบบประเมินนี้?')) return;

    try {
      const { error } = await deleteEvaluation(evaluationId);

      if (error) throw new Error(error);

      toast({
        title: 'สำเร็จ',
        description: 'ลบแบบประเมินเรียบร้อยแล้ว'
      });

      loadEvaluations();
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      satisfaction: 'ความพึงพอใจ',
      knowledge: 'ทดสอบความรู้',
      pre_test: 'ทดสอบก่อนเรียน',
      post_test: 'ทดสอบหลังเรียน'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: 'ใช้งาน',
      inactive: 'ปิดใช้งาน',
      archived: 'เก็บถาวร'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการแบบประเมิน</h1>
            <p className="mt-2 text-gray-600">สร้างและจัดการแบบประเมินความพึงพอใจและทดสอบความรู้</p>
          </div>
          <Link to="/admin/evaluations/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              สร้างแบบประเมินใหม่
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
                <option value="archived">เก็บถาวร</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="satisfaction">ความพึงพอใจ</option>
                <option value="knowledge">ทดสอบความรู้</option>
                <option value="pre_test">ทดสอบก่อนเรียน</option>
                <option value="post_test">ทดสอบหลังเรียน</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Evaluations List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : evaluations.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ยังไม่มีแบบประเมิน
            </h3>
            <p className="text-gray-600 mb-4">
              เริ่มสร้างแบบประเมินแรกของคุณตอนนี้เลย
            </p>
            <Link to="/admin/evaluations/new">
              <Button>สร้างแบบประเมินใหม่</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {evaluation.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {evaluation.description || 'ไม่มีคำอธิบาย'}
                    </p>
                  </div>
                  {getStatusBadge(evaluation.status)}
                </div>

                {/* Meta Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{getTypeLabel(evaluation.type)}</span>
                  </div>

                  {evaluation.course && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{evaluation.course.title}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      สร้างเมื่อ {new Date(evaluation.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>

                  {evaluation._count?.[0]?.count !== undefined && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      <span>{evaluation._count[0].count} การตอบกลับ</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Link
                    to={`/admin/evaluations/${evaluation.id}/results`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      ผลประเมิน
                    </Button>
                  </Link>

                  <Link to={`/admin/evaluations/${evaluation.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(evaluation.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Public Link */}
                {evaluation.status === 'active' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">ลิงก์สำหรับนักเรียน:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/#/evaluation/${evaluation.id}`}
                        readOnly
                        className="flex-1 text-xs border rounded px-2 py-1 bg-gray-50"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/#/evaluation/${evaluation.id}`
                          );
                          toast({
                            title: 'คัดลอกแล้ว',
                            description: 'คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว'
                          });
                        }}
                      >
                        คัดลอก
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvaluationsPage;
