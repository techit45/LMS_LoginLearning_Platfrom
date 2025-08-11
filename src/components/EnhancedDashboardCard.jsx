import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, Minus } from 'lucide-react';

const EnhancedDashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue', 
  trend = null, // 'up', 'down', 'neutral'
  trendValue = null,
  isLoading = false,
  onClick = null,
  gradient = false,
  animation = true 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
      hover: 'hover:border-blue-300'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600',
      hover: 'hover:border-green-300'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600',
      hover: 'hover:border-purple-300'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-orange-600',
      hover: 'hover:border-orange-300'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200',
      gradient: 'from-red-500 to-red-600',
      hover: 'hover:border-red-300'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      border: 'border-emerald-200',
      gradient: 'from-emerald-500 to-emerald-600',
      hover: 'hover:border-emerald-300'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4 text-red-600" />;
      case 'neutral':
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const cardContent = (
    <div className="p-6 h-full">
      {/* Header with Icon and Trend */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${gradient ? 'bg-gradient-to-br' : colors.bg} ${gradient ? colors.gradient : ''}`}>
          <Icon className={`w-6 h-6 ${gradient ? 'text-white' : colors.icon}`} />
        </div>
        
        {trendValue && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 leading-tight">{title}</h3>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </>
        )}
      </div>

      {/* Hover Effect Indicator */}
      {onClick && (
        <div className="mt-4 flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>ดูรายละเอียด</span>
          <motion.div 
            className="ml-1"
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            →
          </motion.div>
        </div>
      )}
    </div>
  );

  const cardClass = `
    relative bg-white rounded-xl border-2 ${colors.border} ${colors.hover}
    ${onClick ? 'cursor-pointer' : ''} 
    transition-all duration-200 
    hover:shadow-lg hover:-translate-y-1 
    group overflow-hidden
    ${gradient ? 'shadow-lg' : 'shadow-sm'}
  `;

  if (!animation) {
    return (
      <div className={cardClass} onClick={onClick}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent"></div>
        </div>
        <div className="relative z-10">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cardClass}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent"></div>
      </div>
      
      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      </div>
      
      <div className="relative z-10">
        {cardContent}
      </div>
    </motion.div>
  );
};

export default EnhancedDashboardCard;