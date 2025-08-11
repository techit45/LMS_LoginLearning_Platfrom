import React from 'react';
import { motion } from 'framer-motion';

const ProgressChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">ไม่มีข้อมูลกราฟ</p>
        </div>
      </div>
    );
  }

  // Find max value for scaling (ensure it's at least 1 to avoid division by zero)
  const maxValue = Math.max(1, ...data.map(d => Math.max(d.progress || 0, d.courses || 0, d.activities || 0)));
  const chartHeight = 200;

  return (
    <div className="w-full">
      {/* Chart Area */}
      <div className="relative" style={{ height: chartHeight + 40 }}>
        <svg 
          width="100%" 
          height={chartHeight + 40}
          viewBox="0 0 600 240"
          className="overflow-visible"
        >
          {/* Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((fraction) => (
            <line
              key={fraction}
              x1="40"
              y1={chartHeight * (1 - fraction) + 10}
              x2="580"
              y2={chartHeight * (1 - fraction) + 10}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <text
              key={fraction}
              x="35"
              y={chartHeight * (1 - fraction) + 15}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {Math.round(maxValue * fraction)}
            </text>
          ))}

          {/* Bars */}
          {data.map((item, index) => {
            const containerWidth = 540; // Fixed width within viewBox
            const barWidth = containerWidth / data.length * 0.6;
            const barX = 50 + (index * containerWidth / data.length);
            const progressHeight = isNaN((item.progress / maxValue) * chartHeight) ? 0 : (item.progress / maxValue) * chartHeight;
            const coursesHeight = isNaN((item.courses / maxValue) * chartHeight) ? 0 : (item.courses / maxValue) * chartHeight;

            return (
              <g key={index}>
                {/* Progress Bar */}
                <motion.rect
                  initial={{ height: 0, y: chartHeight + 10 }}
                  animate={{ 
                    height: progressHeight, 
                    y: chartHeight - progressHeight + 10 
                  }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  x={barX - barWidth/4}
                  width={barWidth/2 - 2}
                  fill="#3b82f6"
                  rx="2"
                />

                {/* Courses Bar */}
                <motion.rect
                  initial={{ height: 0, y: chartHeight + 10 }}
                  animate={{ 
                    height: coursesHeight, 
                    y: chartHeight - coursesHeight + 10 
                  }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                  x={barX + barWidth/4}
                  width={barWidth/2 - 2}
                  fill="#10b981"
                  rx="2"
                />

                {/* X-axis label */}
                <text
                  x={barX}
                  y={chartHeight + 30}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {item.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">ความคืบหน้า</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">คอร์ส</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-600">กิจกรรม</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(data.reduce((sum, d) => sum + (d.progress || 0), 0) / data.length) || 0}%
          </div>
          <div className="text-xs text-blue-600">ความคืบหน้าเฉลี่ย</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">
            {data.reduce((sum, d) => sum + (d.courses || 0), 0)}
          </div>
          <div className="text-xs text-green-600">คอร์สทั้งหมด</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, d) => sum + (d.activities || 0), 0)}
          </div>
          <div className="text-xs text-purple-600">กิจกรรมทั้งหมด</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;