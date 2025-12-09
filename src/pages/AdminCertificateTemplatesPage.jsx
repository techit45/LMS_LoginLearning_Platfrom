import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getCertificateTemplates,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  uploadTemplateBackground
} from '../lib/certificateService';
import { getCourses } from '../lib/courseService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  Layout,
  Eye,
  X,
  Save
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminCertificateTemplatesPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templates, setTemplates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: null,
    backgroundUrl: '',
    isActive: true,
    layoutConfig: {
      studentName: { x: 400, y: 300, fontSize: 32, color: '#000000', fontFamily: 'Sarabun', align: 'center' },
      courseName: { x: 400, y: 350, fontSize: 24, color: '#333333', fontFamily: 'Sarabun', align: 'center' },
      completionDate: { x: 400, y: 400, fontSize: 18, color: '#666666', fontFamily: 'Sarabun', align: 'center' },
      certificateNumber: { x: 100, y: 50, fontSize: 14, color: '#999999', fontFamily: 'Sarabun', align: 'left' }
    }
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesRes, coursesRes] = await Promise.all([
        getCertificateTemplates(),
        getCourses()
      ]);

      if (templatesRes.error) throw new Error(templatesRes.error);
      if (coursesRes.error) throw new Error(coursesRes.error);

      setTemplates(templatesRes.data || []);
      setCourses(coursesRes.data || []);
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

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        courseId: template.course_id || null,
        backgroundUrl: template.background_url || '',
        isActive: template.is_active,
        layoutConfig: template.layout_config || formData.layoutConfig
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        courseId: null,
        backgroundUrl: '',
        isActive: true,
        layoutConfig: {
          studentName: { x: 400, y: 300, fontSize: 32, color: '#000000', fontFamily: 'Sarabun', align: 'center' },
          courseName: { x: 400, y: 350, fontSize: 24, color: '#333333', fontFamily: 'Sarabun', align: 'center' },
          completionDate: { x: 400, y: 400, fontSize: 18, color: '#666666', fontFamily: 'Sarabun', align: 'center' },
          certificateNumber: { x: 100, y: 50, fontSize: 14, color: '#999999', fontFamily: 'Sarabun', align: 'left' }
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleBackgroundUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'ไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'ไฟล์ใหญ่เกินไป',
        description: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploadingBackground(true);
    try {
      const { data, error } = await uploadTemplateBackground(file);
      if (error) throw new Error(error);

      setFormData(prev => ({
        ...prev,
        backgroundUrl: data.publicUrl
      }));

      toast({
        title: 'สำเร็จ',
        description: 'อัปโหลดพื้นหลังเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'กรุณากรอกชื่อเทมเพลต',
        variant: 'destructive'
      });
      return;
    }

    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        courseId: formData.courseId,
        backgroundUrl: formData.backgroundUrl,
        layoutConfig: formData.layoutConfig,
        isActive: formData.isActive
      };

      if (editingTemplate) {
        const { error } = await updateCertificateTemplate(editingTemplate.id, templateData);
        if (error) throw new Error(error);

        toast({
          title: 'สำเร็จ',
          description: 'แก้ไขเทมเพลตเรียบร้อยแล้ว'
        });
      } else {
        const { error } = await createCertificateTemplate(templateData);
        if (error) throw new Error(error);

        toast({
          title: 'สำเร็จ',
          description: 'สร้างเทมเพลตเรียบร้อยแล้ว'
        });
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้?')) return;

    try {
      const { error } = await deleteCertificateTemplate(templateId);
      if (error) throw new Error(error);

      toast({
        title: 'สำเร็จ',
        description: 'ลบเทมเพลตเรียบร้อยแล้ว'
      });

      loadData();
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateLayoutField = (field, property, value) => {
    setFormData(prev => ({
      ...prev,
      layoutConfig: {
        ...prev.layoutConfig,
        [field]: {
          ...prev.layoutConfig[field],
          [property]: value
        }
      }
    }));
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
            <h1 className="text-3xl font-bold text-gray-900">เทมเพลตใบเซอร์</h1>
            <p className="mt-2 text-gray-600">จัดการเทมเพลตสำหรับออกใบประกาศนียบัตร</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            สร้างเทมเพลตใหม่
          </Button>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ยังไม่มีเทมเพลต
            </h3>
            <p className="text-gray-600 mb-4">
              เริ่มสร้างเทมเพลตแรกของคุณตอนนี้เลย
            </p>
            <Button onClick={() => handleOpenModal()}>สร้างเทมเพลตใหม่</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Background Preview */}
                {template.background_url && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-40">
                    <img
                      src={template.background_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Template Info */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {template.course && (
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <Layout className="w-4 h-4 mr-2" />
                      <span>{template.course.title}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenModal(template)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingTemplate ? 'แก้ไขเทมเพลต' : 'สร้างเทมเพลตใหม่'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อเทมเพลต *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="เช่น เทมเพลตมาตรฐาน"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำอธิบาย
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        rows="3"
                        placeholder="อธิบายเทมเพลตนี้"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คอร์ส (ถ้ามี)
                      </label>
                      <select
                        value={formData.courseId || ''}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value || null })}
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="">ไม่ระบุคอร์ส (ใช้งานทั่วไป)</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        เปิดใช้งานเทมเพลต
                      </label>
                    </div>
                  </div>

                  {/* Background Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">พื้นหลังใบเซอร์</h3>

                    {formData.backgroundUrl && (
                      <div className="relative rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={formData.backgroundUrl}
                          alt="Background preview"
                          className="w-full h-64 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, backgroundUrl: '' })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 mb-2">
                            {uploadingBackground ? 'กำลังอัปโหลด...' : 'คลิกเพื่ออัปโหลดรูปพื้นหลัง'}
                          </p>
                          <p className="text-xs text-gray-500">
                            รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className="hidden"
                            disabled={uploadingBackground}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Layout Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">การจัดวางข้อความ</h3>

                    {Object.entries(formData.layoutConfig).map(([field, config]) => {
                      const labels = {
                        studentName: 'ชื่อนักเรียน',
                        courseName: 'ชื่อคอร์ส',
                        completionDate: 'วันที่สำเร็จ',
                        certificateNumber: 'เลขที่ใบเซอร์'
                      };

                      return (
                        <Card key={field} className="p-4">
                          <h4 className="font-medium text-gray-900 mb-4">{labels[field]}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">X</label>
                              <input
                                type="number"
                                value={config.x}
                                onChange={(e) => updateLayoutField(field, 'x', parseInt(e.target.value))}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Y</label>
                              <input
                                type="number"
                                value={config.y}
                                onChange={(e) => updateLayoutField(field, 'y', parseInt(e.target.value))}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">ขนาดตัวอักษร</label>
                              <input
                                type="number"
                                value={config.fontSize}
                                onChange={(e) => updateLayoutField(field, 'fontSize', parseInt(e.target.value))}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">สี</label>
                              <input
                                type="color"
                                value={config.color}
                                onChange={(e) => updateLayoutField(field, 'color', e.target.value)}
                                className="w-full border rounded px-2 py-1 h-8"
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {editingTemplate ? 'บันทึกการแก้ไข' : 'สร้างเทมเพลต'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCertificateTemplatesPage;
