import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { startQuizAttempt, submitQuizAttempt } from '@/lib/quizService';

const QuizPlayer = ({ quiz, onComplete, onClose }) => {
  const { toast } = useToast();
  
  // Quiz state
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize quiz attempt
  useEffect(() => {
    initializeQuiz();
  }, [quiz.id]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz.time_limit > 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  const initializeQuiz = async () => {
    setLoading(true);
    const { data, error } = await startQuizAttempt(quiz.id);
    
    if (error) {
      toast({
        title: "ไม่สามารถเริ่มแบบทดสอบได้",
        description: error.message,
        variant: "destructive"
      });
      onClose?.();
      return;
    }

    setCurrentAttempt(data);
    
    // Set timer if there's a time limit
    if (quiz.time_limit > 0) {
      setTimeLeft(quiz.time_limit * 60); // Convert minutes to seconds
    }
    
    setLoading(false);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!currentAttempt) return;

    setLoading(true);
    const { data, error } = await submitQuizAttempt(currentAttempt.id, answers);
    
    if (error) {
      toast({
        title: "ไม่สามารถส่งแบบทดสอบได้",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    setResults(data);
    setIsSubmitted(true);
    setLoading(false);

    // Show success message
    toast({
      title: data.is_passed ? "ผ่านแบบทดสอบ! 🎉" : "ไม่ผ่านแบบทดสอบ",
      description: `คะแนนที่ได้: ${data.score}/${data.max_score} (${data.score}%)`,
      variant: data.is_passed ? "default" : "destructive"
    });

    onComplete?.(data);
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading && !currentAttempt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">กำลังเตรียมแบบทดสอบ...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (isSubmitted && results) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Results Header */}
        <div className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            results.is_passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {results.is_passed ? <Trophy className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {results.is_passed ? 'ยินดีด้วย! คุณผ่านแบบทดสอบ' : 'เสียใจด้วย คุณไม่ผ่านแบบทดสอบ'}
            </h3>
            <p className="text-slate-400">
              คะแนนที่ได้: {results.score}% | ต้องการ: {quiz.passing_score}%
            </p>
          </div>
        </div>

        {/* Score Details */}
        <div className="glass-effect p-6 rounded-xl">
          <h4 className="text-lg font-semibold text-white mb-4">รายละเอียดคะแนน</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{results.score_details?.correct_count || 0}</div>
              <div className="text-sm text-slate-400">ตอบถูก</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-300">{results.score_details?.total_questions || 0}</div>
              <div className="text-sm text-slate-400">ทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{results.score}%</div>
              <div className="text-sm text-slate-400">คะแนนรวม</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{results.time_spent_minutes || 0}</div>
              <div className="text-sm text-slate-400">นาที</div>
            </div>
          </div>
        </div>

        {/* Question Review (if enabled) */}
        {quiz.show_correct_answers && results.score_details?.feedback && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">ตรวจสอบคำตอบ</h4>
            {quiz.questions.map((question, index) => {
              const questionId = question.id || index.toString();
              const feedback = results.score_details.feedback[questionId];
              
              return (
                <motion.div
                  key={questionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-effect p-4 rounded-lg border-l-4 ${
                    feedback?.is_correct ? 'border-green-500' : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${feedback?.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                      {feedback?.is_correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">{question.question}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">คำตอบของคุณ: </span>
                          <span className={feedback?.is_correct ? 'text-green-400' : 'text-red-400'}>
                            {Array.isArray(feedback?.user_answer) 
                              ? feedback.user_answer.join(', ') 
                              : feedback?.user_answer || 'ไม่ได้ตอบ'}
                          </span>
                        </div>
                        
                        {!feedback?.is_correct && (
                          <div>
                            <span className="text-slate-400">คำตอบที่ถูก: </span>
                            <span className="text-green-400">
                              {Array.isArray(feedback?.correct_answer) 
                                ? feedback.correct_answer.join(', ') 
                                : feedback?.correct_answer}
                            </span>
                          </div>
                        )}
                        
                        {feedback?.explanation && (
                          <div className="mt-2 p-2 bg-blue-500/10 rounded text-blue-300">
                            <strong>คำอธิบาย:</strong> {feedback.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button onClick={onClose} variant="outline">
            ปิด
          </Button>
          
          {!results.is_passed && currentAttempt?.attempt_number < quiz.max_attempts && (
            <Button 
              onClick={() => {
                setIsSubmitted(false);
                setResults(null);
                setCurrentQuestion(0);
                setAnswers({});
                initializeQuiz();
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              ลองใหม่
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Quiz taking view
  const question = quiz.questions[currentQuestion];
  const questionId = question.id || currentQuestion.toString();
  const userAnswer = answers[questionId];

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{quiz.title}</h3>
          <p className="text-slate-400">
            คำถามที่ {currentQuestion + 1} จาก {quiz.questions.length}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timer */}
          {quiz.time_limit > 0 && (
            <div className={`flex items-center space-x-2 ${
              timeLeft < 300 ? 'text-red-400' : 'text-slate-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          {/* Progress */}
          <div className="text-slate-400 text-sm">
            ตอบแล้ว: {getAnsweredCount()}/{quiz.questions.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-effect p-6 rounded-xl"
        >
          <QuestionRenderer
            question={question}
            questionId={questionId}
            userAnswer={userAnswer}
            onAnswerChange={handleAnswerChange}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          ก่อนหน้า
        </Button>

        <div className="flex items-center space-x-2">
          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || getAnsweredCount() === 0}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              ถัดไป
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Warning for unanswered questions */}
      {getAnsweredCount() < quiz.questions.length && (
        <div className="flex items-center space-x-2 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>คุณยังตอบคำถามไม่ครบ ({quiz.questions.length - getAnsweredCount()} ข้อ)</span>
        </div>
      )}
    </div>
  );
};

// Question Renderer Component
const QuestionRenderer = ({ question, questionId, userAnswer, onAnswerChange }) => {
  const renderQuestionByType = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                <input
                  type="radio"
                  name={questionId}
                  value={option}
                  checked={userAnswer === option}
                  onChange={(e) => onAnswerChange(questionId, e.target.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-slate-200">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_select':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(userAnswer) && userAnswer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(userAnswer) ? userAnswer : [];
                    if (e.target.checked) {
                      onAnswerChange(questionId, [...currentAnswers, option]);
                    } else {
                      onAnswerChange(questionId, currentAnswers.filter(a => a !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-slate-200">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {[true, false].map((value) => (
              <label key={value.toString()} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                <input
                  type="radio"
                  name={questionId}
                  value={value}
                  checked={userAnswer === value}
                  onChange={(e) => onAnswerChange(questionId, e.target.value === 'true')}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-slate-200">{value ? 'ถูก' : 'ผิด'}</span>
              </label>
            ))}
          </div>
        );

      case 'fill_blank':
        return (
          <input
            type="text"
            value={userAnswer || ''}
            onChange={(e) => onAnswerChange(questionId, e.target.value)}
            placeholder="พิมพ์คำตอบของคุณ..."
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          />
        );

      default:
        return <p className="text-red-400">ไม่รองรับประเภทคำถามนี้</p>;
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">{question.question}</h4>
      
      {question.image && (
        <img 
          src={question.image} 
          alt="Question" 
          className="max-w-full h-auto rounded-lg"
        />
      )}
      
      {renderQuestionByType()}
      
      {question.hint && (
        <div className="text-sm text-blue-300 bg-blue-500/10 p-3 rounded-lg">
          <strong>คำแนะนำ:</strong> {question.hint}
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;