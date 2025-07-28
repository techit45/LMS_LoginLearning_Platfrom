import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const WeekPicker = ({ currentWeek, onWeekChange, scheduleType = 'weekends' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(currentWeek));
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get week number for a date
  const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  // Get start of week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Get dates for calendar grid
  const getCalendarDates = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDate = getStartOfWeek(firstDayOfMonth);
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Check if date is in current week
  const isDateInCurrentWeek = (date) => {
    const weekStart = getStartOfWeek(currentWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  };

  // Handle week selection
  const handleWeekSelect = (date) => {
    const weekStart = getStartOfWeek(date);
    onWeekChange(weekStart);
    setIsOpen(false);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get week range display
  const getWeekRange = (date) => {
    const weekStart = getStartOfWeek(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const weekNum = getWeekNumber(date);
    
    return `สัปดาห์ที่ ${weekNum}: ${startStr} - ${endStr}`;
  };

  const calendarDates = getCalendarDates();
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors text-white text-xs md:text-sm"
      >
        <Calendar className="w-4 h-4 text-white/80" />
        <span className="text-sm font-medium text-white">
          {getWeekRange(currentWeek)}
        </span>
      </button>

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[320px] max-w-[90vw] md:max-w-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-blue-50 rounded-full transition-colors border border-gray-300 hover:border-blue-400 shadow-sm hover:shadow-md bg-white"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 hover:text-blue-600" />
              </button>
              
              <div className="flex-1 text-center">
                <h3 className="font-bold text-lg text-gray-800 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h3>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-blue-50 rounded-full transition-colors border border-gray-300 hover:border-blue-400 shadow-sm hover:shadow-md bg-white"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700 hover:text-blue-600" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors border border-gray-300 hover:border-red-400 shadow-sm hover:shadow-md bg-white ml-2"
                  title="ปิด"
                >
                  <X className="w-4 h-4 text-gray-700 hover:text-red-600" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDates.map((date, index) => {
                const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isInCurrentWeek = isDateInCurrentWeek(date);
                const weekStart = getStartOfWeek(date);
                
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleWeekSelect(date)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative h-8 w-8 text-xs rounded transition-colors
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                      ${isToday ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                      ${isInCurrentWeek ? 'bg-green-100 text-green-700 font-semibold' : ''}
                      hover:bg-gray-100
                    `}
                  >
                    {date.getDate()}
                    
                    {/* Week indicator */}
                    {date.getDay() === 1 && ( // Monday
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-60" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Navigation */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleWeekSelect(new Date())}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  สัปดาห์นี้
                </button>
                <button
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleWeekSelect(nextWeek);
                  }}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  สัปดาห์หน้า
                </button>
                <button
                  onClick={() => {
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    handleWeekSelect(lastWeek);
                  }}
                  className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                >
                  สัปดาห์ที่แล้ว
                </button>
              </div>
            </div>

            {/* Current Selection Info */}
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                เลือกแล้ว: <span className="font-medium text-gray-900">{getWeekRange(currentWeek)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeekPicker;