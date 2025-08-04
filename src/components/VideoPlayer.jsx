import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Loader2,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Helper function to detect video type
const getVideoType = (url) => {
  if (!url) return 'unknown';
  
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { type: 'youtube', id: match[1] };
    }
  }
  
  // Check for direct video files
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  if (hasVideoExtension || url.startsWith('blob:') || url.startsWith('data:')) {
    return { type: 'direct', url };
  }
  
  return { type: 'unknown' };
};

// YouTube embed URL generator
const getYouTubeEmbedUrl = (videoId, autoplay = false) => {
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin: window.location.origin,
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3', // Hide annotations
    cc_load_policy: '0', // Hide captions by default
    disablekb: '1', // Disable keyboard controls
    fs: '1', // Allow fullscreen
    playsinline: '1', // Play inline on mobile
    controls: '1', // Show controls
    showinfo: '0' // Hide video title and uploader info
  });
  
  // Use youtube-nocookie.com for privacy-enhanced mode (reduces tracking)
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

const VideoPlayer = ({ 
  src,
  contentId,
  title, 
  autoPlay = false,
  initialTime = 0,
  onComplete
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // Detect video type
  const videoInfo = getVideoType(src);
  const isYouTube = videoInfo.type === 'youtube';
  const isDirect = videoInfo.type === 'direct';
  
  // Simple video player without progress tracking
  
  // Simple player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirect) return;

    // Set initial time if provided
    if (initialTime > 0) {
      video.currentTime = initialTime;
    }

    // Basic video event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [initialTime, isDirect]);

  // Auto-hide controls - Only for direct videos
  useEffect(() => {
    if (!isDirect) return;
    
    let timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false);
        }
      });
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying, isDirect]);


  const togglePlay = () => {
    if (!isDirect) return; // Only work for direct videos
    const video = videoRef.current;
    if (video && video.paused) {
      video.play();
    } else if (video) {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    if (!isDirect) return;
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const toggleMute = () => {
    if (!isDirect) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e) => {
    if (!isDirect) return;
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const skip = (seconds) => {
    if (!isDirect) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const changePlaybackSpeed = (rate) => {
    if (!isDirect) return;
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = isDirect && duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle unsupported video types
  if (videoInfo.type === 'unknown') {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden p-8 text-center">
        <div className="text-white">
          <ExternalLink className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">ไม่รองรับประเภทวิดีโอนี้</h3>
          <p className="text-gray-300 mb-4">กรุณาใช้ YouTube URL หรือไฟล์วิดีโอที่รองรับ (.mp4, .webm, .ogg)</p>
          <p className="text-xs text-gray-400 break-all">{src}</p>
          {src && (
            <a 
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              เปิดในแท็บใหม่
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group cursor-pointer"
      onClick={isDirect ? togglePlay : undefined}
    >
      {/* YouTube Embed */}
      {isYouTube && (
        <>
          <iframe
            src={getYouTubeEmbedUrl(videoInfo.id, autoPlay)}
            className="w-full h-[400px] lg:h-[500px]"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => {
              console.log('🎬 Iframe loaded');
              setIsLoading(false);
            }}
          />
          
          {/* YouTube Notice */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            YouTube
          </div>
        </>
      )}

      {/* Direct Video Element */}
      {isDirect && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-auto max-h-[500px] object-contain"
          autoPlay={autoPlay}
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Loading Spinner - Only for direct videos */}
      {isDirect && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay - Only for direct videos */}
      {isDirect && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/20 backdrop-blur-sm rounded-full p-4"
          >
            <Play className="w-16 h-16 text-white ml-2" />
          </motion.div>
        </div>
      )}

      {/* Controls - Only for direct videos */}
      {isDirect && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-blue-500 rounded-full relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full -mr-2"></div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            {/* Skip buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => skip(-10)}
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => skip(10)}
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none slider"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
            >
              <option value="0.5" className="bg-black">0.5x</option>
              <option value="0.75" className="bg-black">0.75x</option>
              <option value="1" className="bg-black">1x</option>
              <option value="1.25" className="bg-black">1.25x</option>
              <option value="1.5" className="bg-black">1.5x</option>
              <option value="2" className="bg-black">2x</option>
            </select>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
        </motion.div>
      )}

      {/* Video Title Overlay */}
      {title && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-4 left-4 right-4 ${isYouTube ? 'z-10' : ''}`}
        >
          <h3 className="text-white text-lg font-semibold bg-black/50 backdrop-blur-sm rounded px-3 py-2">
            {title}
          </h3>
        </motion.div>
      )}

      {/* Complete Button for Videos */}
      {contentId && onComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-20 right-4 z-20"
        >
          <Button
            onClick={() => onComplete(contentId)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            ผ่านเนื้อหานี้
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default VideoPlayer;