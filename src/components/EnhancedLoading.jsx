import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';

const EnhancedLoading = ({ 
  type = 'spinner', 
  message = 'กำลังโหลด...', 
  fullScreen = false,
  overlay = true,
  size = 'md',
  context = 'general'
}) => {
  
  const sizeClasses = {
    sm: {
      spinner: 'w-6 h-6',
      text: 'text-sm',
      container: 'space-y-2'
    },
    md: {
      spinner: 'w-8 h-8',
      text: 'text-base',
      container: 'space-y-3'
    },
    lg: {
      spinner: 'w-12 h-12',
      text: 'text-lg',
      container: 'space-y-4'
    }
  };

  const contextMessages = {
    dashboard: 'กำลังโหลดข้อมูล Dashboard...',
    analytics: 'กำลังประมวลผลข้อมูลสถิติ...',
    users: 'กำลังดึงข้อมูลผู้ใช้งาน...',
    courses: 'กำลังโหลดข้อมูลคอร์ส...',
    charts: 'กำลังสร้างกราฟ...',
    general: 'กำลังโหลด...'
  };

  const currentMessage = message || contextMessages[context] || contextMessages.general;
  const sizes = sizeClasses[size];

  // Loading Spinner
  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className={`${sizes.spinner} text-blue-600`} />
    </motion.div>
  );

  // Pulsing Dots
  const PulsingDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-blue-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );

  // Skeleton Card
  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
        <div className="w-16 h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </div>
    </motion.div>
  );

  // Dashboard Skeleton
  const DashboardSkeleton = () => (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex space-x-3">
          <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <SkeletonCard />
          </motion.div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i === 1 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-32 h-6 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-60 bg-gray-100 rounded-lg"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Progress Bar
  const ProgressBar = () => {
    const [progress, setProgress] = React.useState(0);
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{currentMessage}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  };

  // Wave Loading
  const WaveLoading = () => (
    <div className="flex items-end space-x-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-2 bg-blue-600 rounded-full"
          animate={{
            height: [20, 40, 20]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );

  // Context-specific icons
  const getContextIcon = () => {
    const iconProps = { className: `${sizes.spinner} text-blue-600 animate-pulse` };
    
    switch (context) {
      case 'dashboard':
        return <BarChart3 {...iconProps} />;
      case 'analytics':
        return <TrendingUp {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'courses':
        return <BookOpen {...iconProps} />;
      default:
        return <LoadingSpinner />;
    }
  };

  // Render loading content
  const renderLoadingContent = () => {
    switch (type) {
      case 'skeleton':
        return <DashboardSkeleton />;
      case 'dots':
        return (
          <div className={`flex flex-col items-center ${sizes.container}`}>
            <PulsingDots />
            <p className={`${sizes.text} text-gray-600 font-medium`}>
              {currentMessage}
            </p>
          </div>
        );
      case 'progress':
        return (
          <div className={`flex flex-col items-center ${sizes.container}`}>
            <ProgressBar />
          </div>
        );
      case 'wave':
        return (
          <div className={`flex flex-col items-center ${sizes.container}`}>
            <WaveLoading />
            <p className={`${sizes.text} text-gray-600 font-medium`}>
              {currentMessage}
            </p>
          </div>
        );
      case 'context':
        return (
          <div className={`flex flex-col items-center ${sizes.container}`}>
            {getContextIcon()}
            <p className={`${sizes.text} text-gray-600 font-medium`}>
              {currentMessage}
            </p>
          </div>
        );
      default: // spinner
        return (
          <div className={`flex flex-col items-center ${sizes.container}`}>
            <LoadingSpinner />
            <p className={`${sizes.text} text-gray-600 font-medium`}>
              {currentMessage}
            </p>
          </div>
        );
    }
  };

  if (type === 'skeleton') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full"
      >
        {renderLoadingContent()}
      </motion.div>
    );
  }

  if (fullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            overlay ? 'bg-white/80 backdrop-blur-sm dark:bg-gray-900/80' : ''
          }`}
        >
          {renderLoadingContent()}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-8"
    >
      {renderLoadingContent()}
    </motion.div>
  );
};

export default EnhancedLoading;