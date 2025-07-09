import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createQuizForContent } from '@/lib/quizService';

const QuickQuizSetup = ({ isOpen, onClose, contentId, courseId }) => {
  const { toast } = useToast();
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    time_limit: 30,
    passing_score: 70,
    questions: [
      {
        id: 1,
        question: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: 0
      }
    ]
  });

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: 0
    };
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (questionId) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
            }
          : q
      )
    }));
  };

  const handleSave = async () => {
    try {
      // Validate quiz data
      if (!quizData.title.trim()) {
        toast({
          title: "กรุณาใส่ชื่อแบบทดสอบ",
          variant: "destructive"
        });
        return;
      }

      // Basic validation for questions
      for (const question of quizData.questions) {
        if (!question.question.trim()) {
          toast({
            title: "กรุณาใส่คำถาม",
            variant: "destructive"
          });
          return;
        }
        if (question.options.some(opt => !opt.trim())) {
          toast({
            title: "กรุณาใส่ตัวเลือกให้ครบ",
            variant: "destructive"
          });
          return;
        }
      }

      // Save to database
      const { data, error } = await createQuizForContent(contentId, courseId, quizData);
      
      if (error) {
        throw error;
      }

      toast({
        title: "บันทึกแบบทดสอบสำเร็จ",
        description: `แบบทดสอบ "${quizData.title}" ถูกสร้างแล้ว`
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการบันทึก",
        description: error.message || "ไม่สามารถบันทึกแบบทดสอบได้",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">ตั้งค่าแบบทดสอบ</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Quiz Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ชื่อแบบทดสอบ</label>
                <input
                  type="text"
                  value={quizData.title}
                  onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ใส่ชื่อแบบทดสอบ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">เวลาทำ (นาที)</label>
                <input
                  type="number"
                  value={quizData.time_limit}
                  onChange={(e) => setQuizData(prev => ({ ...prev, time_limit: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">คำอธิบาย</label>
              <textarea
                value={quizData.description}
                onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="คำอธิบายเกี่ยวกับแบบทดสอบ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">คะแนนขั้นต่ำที่ผ่าน (%)</label>
              <input
                type="number"
                value={quizData.passing_score}
                onChange={(e) => setQuizData(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">คำถาม</h3>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มคำถาม
                </Button>
              </div>

              <div className="space-y-6">
                {quizData.questions.map((question, questionIndex) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">คำถามที่ {questionIndex + 1}</h4>
                      {quizData.questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">คำถาม</label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="ใส่คำถาม"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">ตัวเลือก</label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correct_answer === optionIndex}
                                onChange={() => updateQuestion(question.id, 'correct_answer', optionIndex)}
                                className="text-blue-600"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`ตัวเลือกที่ ${optionIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">เลือกวงกลมเพื่อกำหนดคำตอบที่ถูกต้อง</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            บันทึกแบบทดสอบ
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickQuizSetup;