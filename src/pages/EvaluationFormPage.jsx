import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getEvaluationById,
  getEvaluationQuestions,
  submitEvaluation,
  checkIfSubmitted
} from '../lib/evaluationService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Star,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const EvaluationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [evaluation, setEvaluation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    loadEvaluation();
  }, [id, user]);

  const loadEvaluation = async () => {
    setLoading(true);
    try {
      // Load evaluation details
      const { data: evalData, error: evalError } = await getEvaluationById(id);
      if (evalError) throw new Error(evalError);

      if (!evalData) {
        throw new Error('ไม่พบแบบประเมินนี้');
      }

      if (evalData.status !== 'active') {
        throw new Error('แบบประเมินนี้ไม่เปิดรับคำตอบในขณะนี้');
      }

      setEvaluation(evalData);

      // Load questions
      const { data: questionsData, error: questionsError } = await getEvaluationQuestions(id);
      if (questionsError) throw new Error(questionsError);
      setQuestions(questionsData || []);

      // Check if already submitted (if logged in)
      if (user) {
        const { data: submittedData, error: submittedError } = await checkIfSubmitted(id);
        if (submittedError) throw new Error(submittedError);
        setAlreadySubmitted(submittedData.hasSubmitted);
      }

    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required questions
    const requiredQuestions = questions.filter(q => q.is_required);
    const missingRequired = requiredQuestions.some(q => !responses[q.id] || responses[q.id] === '');

    if (missingRequired) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        description: 'กรุณาตอบคำถามที่มีเครื่องหมาย * ให้ครบถ้วน',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Format responses
      const formattedResponses = questions.map(question => ({
        questionId: question.id,
        value: responses[question.id] || ''
      }));

      const { error } = await submitEvaluation({
        evaluationId: id,
        responses: formattedResponses
      });

      if (error) throw new Error(error);

      toast({
        title: 'สำเร็จ',
        description: 'ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความร่วมมือ'
      });

      setAlreadySubmitted(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        if (user) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 2000);

    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question.id];

    switch (question.question_type) {
      case 'rating':
        const maxRating = question.options?.max || 5;
        const minRating = question.options?.min || 1;
        const labels = question.options?.labels || [];

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: maxRating - minRating + 1 }, (_, i) => minRating + i).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleResponseChange(question.id, rating.toString())}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    response === rating.toString()
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      response === rating.toString()
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <div className="text-xs mt-1 font-medium">{rating}</div>
                </button>
              ))}
            </div>
            {labels.length >= 2 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{labels[0]}</span>
                <span>{labels[1]}</span>
              </div>
            )}
          </div>
        );

      case 'multiple_choice':
        const choices = question.options?.choices || [];
        return (
          <div className="space-y-2">
            {choices.map((choice) => (
              <label
                key={choice.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  response === choice.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={choice.id}
                  checked={response === choice.id}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900">{choice.text}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        const checkboxChoices = question.options?.choices || [];
        const selectedChoices = response ? response.split(',') : [];

        return (
          <div className="space-y-2">
            {checkboxChoices.map((choice) => (
              <label
                key={choice.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedChoices.includes(choice.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-300'
                }`}
              >
                <input
                  type="checkbox"
                  value={choice.id}
                  checked={selectedChoices.includes(choice.id)}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selectedChoices, choice.id]
                      : selectedChoices.filter(id => id !== choice.id);
                    handleResponseChange(question.id, newSelected.join(','));
                  }}
                  className="mr-3"
                />
                <span className="text-gray-900">{choice.text}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                response === 'yes'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value="yes"
                checked={response === 'yes'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-900 font-medium">ใช่</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                response === 'no'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-red-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value="no"
                checked={response === 'no'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-900 font-medium">ไม่ใช่</span>
            </label>
          </div>
        );

      case 'text':
      default:
        return (
          <textarea
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
            rows="4"
            placeholder="พิมพ์คำตอบของคุณที่นี่..."
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ส่งแบบประเมินแล้ว</h2>
          <p className="text-gray-600 mb-6">
            ขอบคุณสำหรับความร่วมมือในการตอบแบบประเมิน
          </p>
          <Button onClick={() => navigate(user ? '/dashboard' : '/')} className="w-full">
            <ChevronLeft className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {evaluation?.title}
          </h1>
          {evaluation?.description && (
            <p className="text-gray-600 mb-4">{evaluation.description}</p>
          )}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">คำแนะนำ:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>กรุณาตอบคำถามตามความเป็นจริง</li>
                <li>คำถามที่มีเครื่องหมาย * จำเป็นต้องตอบ</li>
                <li>คุณสามารถตอบแบบประเมินได้เพียงครั้งเดียวเท่านั้น</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Questions Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mb-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {index + 1}. {question.question_text}
                    {question.is_required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                </div>
                {renderQuestion(question)}
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                กรุณาตรวจสอบคำตอบของคุณก่อนส่ง
              </p>
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    ส่งแบบประเมิน
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EvaluationFormPage;
