import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Eye, 
  Heart, 
  Pin, 
  Lock, 
  CheckCircle, 
  Clock,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { formatRelativeTime, getTopicTypeDisplay, getTopicTypeColor } from '../lib/forumService';
import { Button } from '../components/ui/button';

const ForumTopicCard = ({ 
  topic, 
  onTopicClick, 
  onLike, 
  onPin, 
  onLock, 
  onDelete, 
  onEdit,
  userRole = 'student',
  currentUserId 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isLiked, setIsLiked] = useState(topic.user_liked || false);
  const [likeCount, setLikeCount] = useState(topic.like_count || 0);

  const isAuthor = currentUserId === topic.author_id;
  const isInstructor = userRole === 'instructor' || userRole === 'admin';
  const canModerate = isInstructor;
  const canEdit = isAuthor || isInstructor;
  const canDelete = isAuthor || isInstructor;

  const topicTypeColor = getTopicTypeColor(topic.topic_type);
  const typeColorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      await onLike(topic.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error liking topic:', error);
    }
  };

  const handlePin = async (e) => {
    e.stopPropagation();
    try {
      await onPin(topic.id, !topic.is_pinned);
    } catch (error) {
      console.error('Error pinning topic:', error);
    }
  };

  const handleLock = async (e) => {
    e.stopPropagation();
    try {
      await onLock(topic.id, !topic.is_locked);
    } catch (error) {
      console.error('Error locking topic:', error);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(topic);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้?')) {
      try {
        await onDelete(topic.id);
      } catch (error) {
        console.error('Error deleting topic:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative ${
        topic.is_pinned ? 'ring-2 ring-yellow-200 bg-yellow-50' : ''
      }`}
      onClick={() => onTopicClick(topic.id)}
    >
      {/* Header with badges and actions */}
      <div className="flex items-start justify-between p-6 pb-3">
        <div className="flex items-start space-x-3 flex-1">
          {/* Author Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {topic.user_profiles?.avatar_url ? (
              <img 
                src={topic.user_profiles.avatar_url} 
                alt={topic.user_profiles.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>

          {/* Topic Info */}
          <div className="flex-1 min-w-0">
            {/* Title and badges */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-4">
                <h3 className={`text-lg font-semibold text-gray-900 line-clamp-2 ${
                  topic.is_locked ? 'opacity-60' : ''
                }`}>
                  {topic.title}
                </h3>
                
                {/* Badges */}
                <div className="flex items-center space-x-2 mt-2">
                  {/* Topic Type */}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                    typeColorClasses[topicTypeColor]
                  }`}>
                    {getTopicTypeDisplay(topic.topic_type)}
                  </span>

                  {/* Category */}
                  {topic.forum_categories && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {topic.forum_categories.name}
                    </span>
                  )}

                  {/* Status badges */}
                  {topic.is_pinned && (
                    <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <Pin className="w-3 h-3" />
                      <span>ปักหมุด</span>
                    </span>
                  )}

                  {topic.is_locked && (
                    <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                      <Lock className="w-3 h-3" />
                      <span>ล็อค</span>
                    </span>
                  )}

                  {topic.is_solved && (
                    <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle className="w-3 h-3" />
                      <span>แก้ไขแล้ว</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              {(canEdit || canDelete || canModerate) && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(!showActions);
                    }}
                    className="p-1 h-8 w-8"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>

                  {showActions && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                      {canEdit && (
                        <button
                          onClick={handleEdit}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>แก้ไข</span>
                        </button>
                      )}

                      {canModerate && (
                        <>
                          <button
                            onClick={handlePin}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Pin className="w-4 h-4" />
                            <span>{topic.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}</span>
                          </button>

                          <button
                            onClick={handleLock}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Lock className="w-4 h-4" />
                            <span>{topic.is_locked ? 'ปลดล็อค' : 'ล็อค'}</span>
                          </button>
                        </>
                      )}

                      {canDelete && (
                        <button
                          onClick={handleDelete}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>ลบ</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Report functionality
                          setShowActions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 border-t border-gray-100"
                      >
                        <Flag className="w-4 h-4" />
                        <span>รายงาน</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content Preview */}
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {topic.content}
            </p>

            {/* Author and Time */}
            <div className="flex items-center text-xs text-gray-500 space-x-3">
              <span className="font-medium">
                {topic.user_profiles?.full_name || 'ผู้ใช้ไม่ระบุตัวตน'}
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(topic.created_at)}</span>
              </span>
              {topic.user_profiles?.role === 'instructor' && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  ผู้สอน
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with stats and actions */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{topic.reply_count || 0}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{topic.view_count || 0}</span>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isLiked 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>
      </div>

      {/* Click overlay to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
};

export default ForumTopicCard;