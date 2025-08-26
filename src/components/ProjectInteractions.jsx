import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Eye,
  ExternalLink,
  Calendar,
  User,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Star
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuthContext } from '../contexts/AuthContext';
import projectInteractionService from '../lib/projectInteractionService';

const ProjectInteractions = ({ 
  projectId, 
  initialStats = {}, 
  showComments = true,
  showFullStats = true 
}) => {
  const { user } = useAuthContext();
  
  const [stats, setStats] = useState({
    likes: 0,
    views: 0,
    comments: 0,
    bookmarks: 0,
    rating: 0,
    ...initialStats
  });
  
  const [userInteractions, setUserInteractions] = useState({
    liked: false,
    bookmarked: false,
    rating: 0
  });
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    if (projectId) {
      loadInteractionData();
      if (showComments) {
        loadComments();
      }
    }
  }, [projectId]);

  // Load interaction data
  const loadInteractionData = async () => {
    try {
      const [statsResult, userResult] = await Promise.all([
        projectInteractionService.getProjectStats(projectId),
        user ? projectInteractionService.getUserInteractions(user.id, projectId) : null
      ]);

      if (statsResult.data) {
        setStats(statsResult.data);
      }

      if (userResult?.data) {
        setUserInteractions(userResult.data);
      }
    } catch (error) {
      console.error('Failed to load interaction data:', error);
    }
  };

  // Load comments
  const loadComments = async () => {
    try {
      const result = await projectInteractionService.getProjectComments(projectId);
      if (result.data) {
        setComments(result.data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  // Handle like/unlike
  const handleLike = async () => {
    if (!user) return;
    
    try {
      if (userInteractions.liked) {
        await projectInteractionService.removeLike(user.id, projectId);
        setUserInteractions(prev => ({ ...prev, liked: false }));
        setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
      } else {
        await projectInteractionService.addLike(user.id, projectId);
        setUserInteractions(prev => ({ ...prev, liked: true }));
        setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Handle bookmark
  const handleBookmark = async () => {
    if (!user) return;
    
    try {
      if (userInteractions.bookmarked) {
        await projectInteractionService.removeBookmark(user.id, projectId);
        setUserInteractions(prev => ({ ...prev, bookmarked: false }));
        setStats(prev => ({ ...prev, bookmarks: Math.max(0, prev.bookmarks - 1) }));
      } else {
        await projectInteractionService.addBookmark(user.id, projectId);
        setUserInteractions(prev => ({ ...prev, bookmarked: true }));
        setStats(prev => ({ ...prev, bookmarks: prev.bookmarks + 1 }));
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Handle rating
  const handleRating = async (rating) => {
    if (!user) return;
    
    try {
      await projectInteractionService.rateProject(user.id, projectId, rating);
      setUserInteractions(prev => ({ ...prev, rating }));
      // Reload stats to get updated average rating
      loadInteractionData();
    } catch (error) {
      console.error('Failed to rate project:', error);
    }
  };

  // Handle new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const result = await projectInteractionService.addComment(user.id, projectId, newComment.trim());
      if (result.data) {
        setComments(prev => [result.data, ...prev]);
        setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
        setNewComment('');
        setShowCommentForm(false);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ดูโปรเจคนี้',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show toast notification here
    }
  };

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Main Interaction Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              userInteractions.liked 
                ? 'bg-red-50 text-red-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart 
              className={`w-5 h-5 ${userInteractions.liked ? 'fill-current' : ''}`} 
            />
            <span className="text-sm font-medium">{formatNumber(stats.likes)}</span>
          </motion.button>

          {/* Comment Button */}
          {showComments && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{formatNumber(stats.comments)}</span>
            </motion.button>
          )}

          {/* Bookmark Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBookmark}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              userInteractions.bookmarked 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bookmark 
              className={`w-5 h-5 ${userInteractions.bookmarked ? 'fill-current' : ''}`} 
            />
            <span className="text-sm font-medium">{formatNumber(stats.bookmarks)}</span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Share className="w-5 h-5" />
            <span className="text-sm font-medium">แชร์</span>
          </motion.button>
        </div>

        {/* Views Counter */}
        {showFullStats && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{formatNumber(stats.views)} ครั้ง</span>
          </div>
        )}
      </div>

      {/* Rating Section */}
      {user && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">ให้คะแนนโปรเจคนี้</h4>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <motion.button
                key={rating}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRating(rating)}
                className={`p-1 rounded ${
                  rating <= userInteractions.rating 
                    ? 'text-yellow-500' 
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Star 
                  className={`w-6 h-6 ${
                    rating <= userInteractions.rating ? 'fill-current' : ''
                  }`} 
                />
              </motion.button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              คะแนนเฉลี่ย: {stats.rating?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>
      )}

      {/* Comment Form */}
      <AnimatePresence>
        {showCommentForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmitComment} className="p-4 bg-gray-50 rounded-lg">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="แสดงความคิดเห็นของคุณ..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end space-x-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCommentForm(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                >
                  {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List */}
      {showComments && comments.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">
            ความคิดเห็น ({comments.length})
          </h4>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.user_profiles?.full_name || 'ผู้ใช้'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectInteractions;