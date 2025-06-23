import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Award, 
  Eye, 
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { validateQuizData, generateSampleQuestions } from '@/lib/quizService';

const QuizEditor = ({ contentId, initialQuiz, onSave }) => {
  const { toast } = useToast();
  const [quizData, setQuizData] = useState({
    title: initialQuiz?.title || '',
    description: initialQuiz?.description || '',
    instructions: initialQuiz?.instructions || '',
    time_limit: initialQuiz?.time_limit || 0,
    max_attempts: initialQuiz?.max_attempts || 3,
    passing_score: initialQuiz?.passing_score || 70,
    show_correct_answers: initialQuiz?.show_correct_answers ?? true,
    randomize_questions: initialQuiz?.randomize_questions ?? false,
    questions: initialQuiz?.questions || []
  });

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  const questionTypes = [
    { value: 'multiple_choice', label: 'เลือกตอบ (ตัวเลือกเดียว)' },
    { value: 'multiple_select', label: 'เลือกตอบ (หลายตัวเลือก)' },
    { value: 'true_false', label: 'ถูก/ผิด' },
    { value: 'fill_blank', label: 'เติมคำ' }
  ];

  const handleSaveQuiz = () => {
    const validation = validateQuizData(quizData);
    if (!validation.isValid) {
      toast({
        title: "ข้อมูลแบบทดสอบไม่ถูกต้อง",
        description: validation.errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    onSave(quizData);
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: Date.now().toString(),
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 1
    });
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setShowQuestionEditor(true);
  };

  const handleSaveQuestion = (questionData) => {
    if (questionData.id && quizData.questions.find(q => q.id === questionData.id)) {
      // Update existing question
      setQuizData(prev => ({
        ...prev,
        questions: prev.questions.map(q => 
          q.id === questionData.id ? questionData : q
        )
      }));
    } else {
      // Add new question
      setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, questionData]
      }));
    }
    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคำถามนี้?')) return;
    
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleDuplicateQuestion = (question) => {
    const duplicatedQuestion = {
      ...question,
      id: Date.now().toString(),
      question: `${question.question} (สำเนา)`
    };
    
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, duplicatedQuestion]
    }));
  };

  const handleLoadSample = () => {
    const sampleQuestions = generateSampleQuestions();
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, ...sampleQuestions]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Quiz Settings */}
      <div className="glass-effect p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">การตั้งค่าแบบทดสอบ</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ชื่อแบบทดสอบ
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="ชื่อแบบทดสอบ"
            />
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              เวลาจำกัด (นาที)
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={quizData.time_limit}
                onChange={(e) => setQuizData(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 0 }))}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
                placeholder="0 = ไม่จำกัดเวลา"
              />
            </div>
          </div>

          {/* Max Attempts */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              จำนวนครั้งที่ทำได้สูงสุด
            </label>
            <input
              type="number"
              value={quizData.max_attempts}
              onChange={(e) => setQuizData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              min="1"
            />
          </div>

          {/* Passing Score */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              คะแนนผ่าน (%)
            </label>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={quizData.passing_score}
                onChange={(e) => setQuizData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            คำอธิบาย
          </label>
          <textarea
            value={quizData.description}
            onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
            rows={2}
            placeholder="อธิบายเกี่ยวกับแบบทดสอบนี้"
          />
        </div>

        {/* Instructions */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            คำแนะนำ
          </label>
          <textarea
            value={quizData.instructions}
            onChange={(e) => setQuizData(prev => ({ ...prev, instructions: e.target.value }))}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
            rows={3}
            placeholder="คำแนะนำสำหรับผู้ทำแบบทดสอบ"
          />
        </div>

        {/* Options */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="show_correct_answers"
              checked={quizData.show_correct_answers}
              onChange={(e) => setQuizData(prev => ({ ...prev, show_correct_answers: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="show_correct_answers" className="text-sm text-slate-300">
              แสดงเฉลยหลังทำเสร็จ
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="randomize_questions"
              checked={quizData.randomize_questions}
              onChange={(e) => setQuizData(prev => ({ ...prev, randomize_questions: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="randomize_questions" className="text-sm text-slate-300">
              สุ่มลำดับคำถาม
            </label>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="glass-effect p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            คำถาม ({quizData.questions.length} ข้อ)
          </h3>
          <div className="flex items-center space-x-2">
            {quizData.questions.length === 0 && (
              <Button
                onClick={handleLoadSample}
                variant="outline"
                size="sm"
              >
                โหลดตัวอย่าง
              </Button>
            )}
            <Button onClick={handleAddQuestion} className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มคำถาม
            </Button>
          </div>
        </div>

        {/* Questions List */}
        {quizData.questions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">ยังไม่มีคำถาม</p>
            <Button onClick={handleAddQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มคำถามแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {quizData.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onEdit={() => handleEditQuestion(question)}
                onDelete={() => handleDeleteQuestion(question.id)}
                onDuplicate={() => handleDuplicateQuestion(question)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveQuiz} className="bg-blue-500 hover:bg-blue-600">
          บันทึกแบบทดสอบ
        </Button>
      </div>

      {/* Question Editor Modal */}
      <AnimatePresence>
        {showQuestionEditor && (
          <QuestionEditor
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onClose={() => {
              setShowQuestionEditor(false);
              setEditingQuestion(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Question Card Component
const QuestionCard = ({ question, index, onEdit, onDelete, onDuplicate }) => {
  const [expanded, setExpanded] = useState(false);

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'เลือกตอบ',
      multiple_select: 'เลือกหลายข้อ',
      true_false: 'ถูก/ผิด',
      fill_blank: 'เติมคำ'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-slate-700/30 rounded-lg border border-slate-600">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-sm font-medium text-slate-400">#{index + 1}</span>
            <div className="flex-1">
              <h4 className="text-white font-medium truncate">{question.question}</h4>
              <p className="text-xs text-slate-400 mt-1">
                {getQuestionTypeLabel(question.type)} • {question.points || 1} คะแนน
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDuplicate}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-400">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-slate-600"
            >
              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option, i) => (
                    <div key={i} className={`p-2 rounded ${
                      option === question.correct_answer 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {option === question.correct_answer && '✓ '}{option}
                    </div>
                  ))}
                </div>
              )}
              
              {question.type === 'true_false' && (
                <div className="text-slate-300">
                  คำตอบที่ถูก: <span className="text-green-300">
                    {question.correct_answer ? 'ถูก' : 'ผิด'}
                  </span>
                </div>
              )}
              
              {question.explanation && (
                <div className="mt-3 p-3 bg-blue-500/10 rounded text-blue-300 text-sm">
                  <strong>คำอธิบาย:</strong> {question.explanation}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Question Editor Modal Component
const QuestionEditor = ({ question, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    id: question?.id || Date.now().toString(),
    type: question?.type || 'multiple_choice',
    question: question?.question || '',
    options: question?.options || ['', '', '', ''],
    correct_answer: question?.correct_answer || '',
    explanation: question?.explanation || '',
    points: question?.points || 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.question.trim()) {
      alert('กรุณาใส่คำถาม');
      return;
    }

    if (formData.type === 'multiple_choice' && formData.options.filter(o => o.trim()).length < 2) {
      alert('ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก');
      return;
    }

    if (!formData.correct_answer) {
      alert('กรุณาระบุคำตอบที่ถูกต้อง');
      return;
    }

    onSave(formData);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
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
        className="glass-effect p-6 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4">
          {question?.id ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ประเภทคำถาม</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="multiple_choice">เลือกตอบ (ตัวเลือกเดียว)</option>
              <option value="multiple_select">เลือกตอบ (หลายตัวเลือก)</option>
              <option value="true_false">ถูก/ผิด</option>
              <option value="fill_blank">เติมคำ</option>
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">คำถาม</label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
              rows={3}
              placeholder="ใส่คำถาม"
              required
            />
          </div>

          {/* Options (for multiple choice) */}
          {formData.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">ตัวเลือก</label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={formData.correct_answer === option}
                      onChange={() => setFormData(prev => ({ ...prev, correct_answer: option }))}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      placeholder={`ตัวเลือกที่ ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" onClick={addOption} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มตัวเลือก
                </Button>
              </div>
            </div>
          )}

          {/* True/False */}
          {formData.type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">คำตอบที่ถูกต้อง</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    value="true"
                    checked={formData.correct_answer === true || formData.correct_answer === 'true'}
                    onChange={() => setFormData(prev => ({ ...prev, correct_answer: true }))}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">ถูก</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    value="false"
                    checked={formData.correct_answer === false || formData.correct_answer === 'false'}
                    onChange={() => setFormData(prev => ({ ...prev, correct_answer: false }))}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">ผิด</span>
                </label>
              </div>
            </div>
          )}

          {/* Fill in the blank */}
          {formData.type === 'fill_blank' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">คำตอบที่ถูกต้อง</label>
              <input
                type="text"
                value={formData.correct_answer}
                onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="คำตอบที่ถูกต้อง"
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">คำอธิบาย (ไม่บังคับ)</label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
              rows={2}
              placeholder="อธิบายเหตุผลของคำตอบที่ถูกต้อง"
            />
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">คะแนน</label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              className="w-32 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              min="1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">บันทึก</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default QuizEditor;