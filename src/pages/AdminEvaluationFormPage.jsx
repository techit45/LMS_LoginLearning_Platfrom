import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  createEvaluation,
  getEvaluationById,
  updateEvaluation,
  addEvaluationQuestion,
  updateEvaluationQuestion,
  deleteEvaluationQuestion,
  reorderQuestions,
  validateEvaluationData,
  validateQuestionData
} from '../lib/evaluationService';
import { getCoursesByCompany } from '../lib/courseService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Question Item Component
const SortableQuestionItem = ({ question, index, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id || `question-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const questionTypes = [
    { value: 'rating', label: 'คะแนน (1-5)' },
    { value: 'multiple_choice', label: 'ตัวเลือก' },
    { value: 'yes_no', label: 'ใช่/ไม่ใช่' },
    { value: 'text', label: 'ข้อความ' },
    { value: 'checkbox', label: 'เลือกหลายตัวเลือก' }
  ];

  const [choices, setChoices] = useState(
    question.options?.choices || [{ id: '1', text: '' }]
  );

  const handleQuestionChange = (field, value) => {
    onUpdate(index, { ...question, [field]: value });
  };

  const handleOptionsChange = (newOptions) => {
    onUpdate(index, { ...question, options: newOptions });
  };

  const addChoice = () => {
    const newChoices = [...choices, { id: String(choices.length + 1), text: '' }];
    setChoices(newChoices);
    handleOptionsChange({ ...question.options, choices: newChoices });
  };

  const updateChoice = (choiceIndex, text) => {
    const newChoices = choices.map((c, i) =>
      i === choiceIndex ? { ...c, text } : c
    );
    setChoices(newChoices);
    handleOptionsChange({ ...question.options, choices: newChoices });
  };

  const removeChoice = (choiceIndex) => {
    const newChoices = choices.filter((_, i) => i !== choiceIndex);
    setChoices(newChoices);
    handleOptionsChange({ ...question.options, choices: newChoices });
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-2">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Question Content */}
        <div className="flex-1 space-y-3">
          {/* Question Number and Type */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-700">คำถามที่ {index + 1}</span>
            <select
              value={question.questionType || 'text'}
              onChange={(e) => handleQuestionChange('questionType', e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.isRequired !== false}
                onChange={(e) => handleQuestionChange('isRequired', e.target.checked)}
                className="rounded"
              />
              <span>จำเป็น</span>
            </label>
          </div>

          {/* Question Text */}
          <textarea
            value={question.questionText || ''}
            onChange={(e) => handleQuestionChange('questionText', e.target.value)}
            placeholder="ใส่คำถาม..."
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
            rows={2}
          />

          {/* Options based on question type */}
          {question.questionType === 'multiple_choice' && (
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              <p className="text-sm font-medium text-gray-700">ตัวเลือก:</p>
              {choices.map((choice, choiceIndex) => (
                <div key={choiceIndex} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{choiceIndex + 1}.</span>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => updateChoice(choiceIndex, e.target.value)}
                    placeholder={`ตัวเลือก ${choiceIndex + 1}`}
                    className="flex-1 border rounded-md px-3 py-1 text-sm"
                  />
                  {choices.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChoice(choiceIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChoice}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มตัวเลือก
              </Button>
            </div>
          )}

          {question.questionType === 'rating' && (
            <div className="pl-4 border-l-2 border-gray-200 text-sm text-gray-600">
              <p>คะแนน 1-5 (1 = น้อยที่สุด, 5 = มากที่สุด)</p>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="text-red-600 hover:text-red-700 mt-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const AdminEvaluationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    type: 'satisfaction',
    status: 'active'
  });

  const [questions, setQuestions] = useState([]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadCourses();
    if (isEditMode) {
      loadEvaluation();
    }
  }, [id]);

  const loadCourses = async () => {
    try {
      const { data } = await getCoursesByCompany();
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadEvaluation = async () => {
    try {
      const { data, error } = await getEvaluationById(id);
      if (error) throw new Error(error);

      setFormData({
        title: data.title,
        description: data.description || '',
        courseId: data.course_id || '',
        type: data.type,
        status: data.status
      });

      setQuestions(data.questions?.map((q, index) => ({
        id: q.id,
        questionText: q.question_text,
        questionType: q.question_type,
        options: q.options || {},
        isRequired: q.is_required,
        displayOrder: q.display_order || index
      })) || []);
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        questionText: '',
        questionType: 'text',
        options: {},
        isRequired: true,
        displayOrder: prev.length
      }
    ]);
  };

  const updateQuestion = (index, updatedQuestion) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? updatedQuestion : q))
    );
  };

  const deleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `question-${items.indexOf(item)}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `question-${items.indexOf(item)}`) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validateEvaluationData(formData);
    if (!validation.isValid) {
      toast({
        title: 'ข้อมูลไม่ถูกต้อง',
        description: Object.values(validation.errors)[0],
        variant: 'destructive'
      });
      return;
    }

    // Validate questions
    if (questions.length === 0) {
      toast({
        title: 'ข้อมูลไม่ครบ',
        description: 'กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ',
        variant: 'destructive'
      });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const qValidation = validateQuestionData(questions[i]);
      if (!qValidation.isValid) {
        toast({
          title: `คำถามที่ ${i + 1} ไม่ถูกต้อง`,
          description: Object.values(qValidation.errors)[0],
          variant: 'destructive'
        });
        return;
      }
    }

    setSaving(true);

    try {
      let evaluationId = id;

      // Create or update evaluation
      if (isEditMode) {
        const { error } = await updateEvaluation(id, formData);
        if (error) throw new Error(error);
      } else {
        const { data, error } = await createEvaluation(formData);
        if (error) throw new Error(error);
        evaluationId = data.id;
      }

      // Save questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionData = {
          evaluationId,
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          isRequired: question.isRequired,
          displayOrder: i
        };

        if (question.id && !question.id.startsWith('temp-')) {
          await updateEvaluationQuestion(question.id, questionData);
        } else {
          await addEvaluationQuestion(questionData);
        }
      }

      toast({
        title: 'สำเร็จ',
        description: isEditMode ? 'แก้ไขแบบประเมินเรียบร้อยแล้ว' : 'สร้างแบบประเมินเรียบร้อยแล้ว'
      });

      navigate('/admin/evaluations');
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'แก้ไขแบบประเมิน' : 'สร้างแบบประเมินใหม่'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ข้อมูลพื้นฐาน</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อแบบประเมิน *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภท *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="satisfaction">ความพึงพอใจ</option>
                    <option value="knowledge">ทดสอบความรู้</option>
                    <option value="pre_test">ทดสอบก่อนเรียน</option>
                    <option value="post_test">ทดสอบหลังเรียน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="active">ใช้งาน</option>
                    <option value="inactive">ปิดใช้งาน</option>
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คอร์ส (ถ้ามี)
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">ไม่เลือก</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Questions */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">คำถาม</h2>
              <Button type="button" onClick={addQuestion} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มคำถาม
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>ยังไม่มีคำถาม</p>
                <p className="text-sm">กดปุ่ม "เพิ่มคำถาม" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q, i) => q.id || `question-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question, index) => (
                    <SortableQuestionItem
                      key={question.id || `question-${index}`}
                      question={question}
                      index={index}
                      onUpdate={updateQuestion}
                      onDelete={deleteQuestion}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/evaluations')}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>กำลังบันทึก...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'บันทึกการแก้ไข' : 'สร้างแบบประเมิน'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEvaluationFormPage;
