import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  MessageCircle, 
  Eye, 
  Heart, 
  Pin, 
  Lock, 
  CheckCircle, 
  Clock,
  User,
  Send,
  Award,
  Reply,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  getTopicWithReplies, 
  createReply, 
  toggleLike, 
  markReplyAsBestAnswer,
  subscribeToTopic,
  unsubscribeFromTopic,
  formatRelativeTime, 
  getTopicTypeDisplay, 
  getTopicTypeColor 
} from '@/lib/forumService';
import AttachmentList from './AttachmentList';

const ForumTopicDetail = ({ 
  topicId, 
  onBack, 
  currentUserId, 
  userRole = 'student' 
}) => {
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const isInstructor = userRole === 'instructor' || userRole === 'admin';
  const canModerate = isInstructor;

  useEffect(() => {
    loadTopicData();
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      const { data, error } = await getTopicWithReplies(topicId);
      
      if (error) throw error;
      
      setTopic(data);
      setReplies(data.replies || []);
    } catch (error) {
      console.error('Error loading topic:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลหัวข้อได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const { data, error } = await createReply({
        topic_id: topicId,
        content: replyContent,
        parent_reply_id: replyingTo?.id || null
      });

      if (error) throw error;

      setReplies(prev => [...prev, data]);
      setReplyContent('');
      setReplyingTo(null);
      
      // Update reply count in topic
      setTopic(prev => ({
        ...prev,
        reply_count: (prev.reply_count || 0) + 1
      }));

      toast({
        title: "ส่งความคิดเห็นสำเร็จ",
        description: "ความคิดเห็นของคุณถูกเพิ่มแล้ว"
      });
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งความคิดเห็นได้",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (targetType, targetId) => {
    try {
      const { data, error } = await toggleLike(targetType, targetId);
      if (error) throw error;

      if (targetType === 'topic') {
        setTopic(prev => ({
          ...prev,
          like_count: data.liked ? (prev.like_count || 0) + 1 : Math.max((prev.like_count || 0) - 1, 0),
          user_liked: data.liked
        }));
      } else {
        setReplies(prev => prev.map(reply => 
          reply.id === targetId 
            ? {
                ...reply,
                like_count: data.liked ? (reply.like_count || 0) + 1 : Math.max((reply.like_count || 0) - 1, 0),
                user_liked: data.liked
              }
            : reply
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleMarkBestAnswer = async (replyId) => {
    try {
      const { error } = await markReplyAsBestAnswer(replyId, topicId);
      if (error) throw error;

      setReplies(prev => prev.map(reply => ({
        ...reply,
        is_best_answer: reply.id === replyId
      })));

      setTopic(prev => ({
        ...prev,
        is_solved: true,
        solved_reply_id: replyId
      }));

      toast({
        title: "เลือกคำตอบที่ดีที่สุดแล้ว",
        description: "หัวข้อนี้ถูกทำเครื่องหมายว่าแก้ไขแล้ว"
      });
    } catch (error) {
      console.error('Error marking best answer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเลือกคำตอบที่ดีที่สุดได้",
        variant: "destructive"
      });
    }
  };

  const toggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromTopic(topicId);
        setIsSubscribed(false);
        toast({
          title: "ยกเลิกการติดตามแล้ว",
          description: "คุณจะไม่ได้รับการแจ้งเตือนจากหัวข้อนี้อีก"
        });
      } else {
        await subscribeToTopic(topicId);
        setIsSubscribed(true);
        toast({
          title: "ติดตามหัวข้อแล้ว",
          description: "คุณจะได้รับการแจ้งเตือนเมื่อมีความคิดเห็นใหม่"
        });
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบหัวข้อที่ต้องการ</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  const topicTypeColor = getTopicTypeColor(topic.topic_type);
  const typeColorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปรายการหัวข้อ</span>
        </Button>

        <Button
          variant="outline"
          onClick={toggleSubscription}
          className="flex items-center space-x-2"
        >
          {isSubscribed ? (
            <>
              <BellOff className="w-4 h-4" />
              <span>ยกเลิกติดตาม</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>ติดตาม</span>
            </>
          )}
        </Button>
      </div>

      {/* Topic Detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl shadow-sm"
      >
        {/* Topic Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start space-x-4">
            {/* Author Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {topic.user_profiles?.avatar_url ? (
                <img 
                  src={topic.user_profiles.avatar_url} 
                  alt={topic.user_profiles.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              {/* Badges */}
              <div className="flex items-center space-x-2 mb-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
                  typeColorClasses[topicTypeColor]
                }`}>
                  {getTopicTypeDisplay(topic.topic_type)}
                </span>

                {topic.forum_categories && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    {topic.forum_categories.name}
                  </span>
                )}

                {topic.is_pinned && (
                  <span className="flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Pin className="w-4 h-4" />
                    <span>ปักหมุด</span>
                  </span>
                )}

                {topic.is_locked && (
                  <span className="flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                    <Lock className="w-4 h-4" />
                    <span>ล็อค</span>
                  </span>
                )}

                {topic.is_solved && (
                  <span className="flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                    <CheckCircle className="w-4 h-4" />
                    <span>แก้ไขแล้ว</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{topic.title}</h1>

              {/* Author Info */}
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="font-medium">
                  {topic.user_profiles?.full_name || 'ผู้ใช้ไม่ระบุตัวตน'}
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatRelativeTime(topic.created_at)}</span>
                </span>
                {topic.user_profiles?.role === 'instructor' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    ผู้สอน
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Topic Content */}
        <div className="p-6 border-b border-gray-100">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
          </div>
          
          {/* Topic Attachments */}
          <div className="mt-6">
            <AttachmentList
              targetType="topic"
              targetId={topic.id}
              currentUserId={currentUserId}
              userRole={userRole}
            />
          </div>
        </div>

        {/* Topic Stats and Actions */}
        <div className="flex items-center justify-between p-6 bg-gray-50">
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{topic.reply_count || 0} ความคิดเห็น</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{topic.view_count || 0} ครั้ง</span>
            </div>
          </div>

          <button
            onClick={() => handleLike('topic', topic.id)}
            className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-200 ${
              topic.user_liked 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${topic.user_liked ? 'fill-current' : ''}`} />
            <span className="font-medium">{topic.like_count || 0}</span>
          </button>
        </div>
      </motion.div>

      {/* Replies Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          ความคิดเห็น ({replies.length})
        </h2>

        {/* Reply Form */}
        {!topic.is_locked && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {replyingTo && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    ตอบกลับ: {replyingTo.user_profiles?.full_name}
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-blue-700 line-clamp-2">{replyingTo.content}</p>
              </div>
            )}

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="เขียนความคิดเห็น..."
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={4}
                required
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {replyingTo ? 'ตอบกลับความคิดเห็น' : 'ความคิดเห็นใหม่'}
                </span>
                <Button 
                  type="submit" 
                  disabled={submitting || !replyContent.trim()}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}</span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Replies List */}
        <AnimatePresence>
          {replies.map((reply, index) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white border border-gray-200 rounded-xl p-6 ${
                reply.is_best_answer ? 'ring-2 ring-green-200 bg-green-50' : ''
              }`}
            >
              {/* Reply Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  {/* Author Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {reply.user_profiles?.avatar_url ? (
                      <img 
                        src={reply.author.user_profiles.profile_image_url} 
                        alt={reply.author.user_profiles.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {reply.user_profiles?.full_name || 'ผู้ใช้ไม่ระบุตัวตน'}
                      </span>
                      
                      {reply.user_profiles?.role === 'instructor' && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          ผู้สอน
                        </span>
                      )}

                      {reply.is_best_answer && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Award className="w-3 h-3" />
                          <span>คำตอบที่ดีที่สุด</span>
                        </span>
                      )}
                    </div>
                    
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(reply.created_at)}
                    </span>
                  </div>
                </div>

                {/* Reply Actions */}
                <div className="flex items-center space-x-2">
                  {canModerate && !reply.is_best_answer && topic.topic_type === 'question' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkBestAnswer(reply.id)}
                      className="flex items-center space-x-1"
                    >
                      <Award className="w-4 h-4" />
                      <span>เลือกเป็นคำตอบที่ดีที่สุด</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(reply)}
                    className="flex items-center space-x-1"
                  >
                    <Reply className="w-4 h-4" />
                    <span>ตอบกลับ</span>
                  </Button>
                </div>
              </div>

              {/* Reply Content */}
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
              </div>

              {/* Reply Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {reply.updated_at !== reply.created_at && (
                    <span>แก้ไขเมื่อ {formatRelativeTime(reply.updated_at)}</span>
                  )}
                </div>

                <button
                  onClick={() => handleLike('reply', reply.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
                    reply.user_liked 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${reply.user_liked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{reply.like_count || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {replies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>ยังไม่มีความคิดเห็น</p>
            <p className="text-sm">เป็นคนแรกที่แสดงความคิดเห็นในหัวข้อนี้</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumTopicDetail;