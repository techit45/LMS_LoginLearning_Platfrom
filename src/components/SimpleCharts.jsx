import React from 'react';

// Simple CSS-based charts component to replace recharts
const SimpleCharts = {
  
  // Simple Bar Chart Component
  BarChart: ({ data, title, height = 200, colors = ['#3b82f6', '#10b981'] }) => {
    // Ensure height is a valid number
    const validHeight = typeof height === 'number' && !isNaN(height) && height > 0 ? height : 200;
    
    if (!data || data.length === 0) {
      return (
        <div className="w-full bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          ไม่มีข้อมูลแสดงผล
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => Math.max(item.users || 0, item.enrollments || 0, item.count || 0, item.value || 0)));
    
    return (
      <div className="w-full">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        <div className="flex items-end justify-between space-x-1" style={{ height: `${validHeight}px` }}>
          {data.map((item, index) => {
            const userHeight = ((item.users || item.count || item.value || 0) / maxValue) * (validHeight - 40);
            const enrollmentHeight = ((item.enrollments || 0) / maxValue) * (validHeight - 40);
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex items-end space-x-1 mb-2">
                  {/* First bar (users/count/value) */}
                  <div
                    className="bg-blue-500 rounded-t-sm relative group transition-all duration-200 hover:bg-blue-600 min-w-4"
                    style={{ height: `${Math.max(userHeight, 1)}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.users || item.count || item.value || 0}
                    </div>
                  </div>
                  
                  {/* Second bar (enrollments) - only if exists */}
                  {item.enrollments !== undefined && (
                    <div
                      className="bg-green-500 rounded-t-sm relative group transition-all duration-200 hover:bg-green-600 min-w-4"
                      style={{ height: `${Math.max(enrollmentHeight, 1)}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.enrollments}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <div className="text-xs text-gray-600 text-center mt-1 transform -rotate-45 origin-center w-16">
                  {item.date || item.name || `Item ${index + 1}`}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">
              {data[0]?.users !== undefined ? 'ผู้ใช้' : data[0]?.count !== undefined ? 'จำนวน' : 'ค่า'}
            </span>
          </div>
          {data[0]?.enrollments !== undefined && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">การลงทะเบียน</span>
            </div>
          )}
        </div>
      </div>
    );
  },

  // Simple Pie Chart Component
  PieChart: ({ data, title, size = 200 }) => {
    // Ensure size is a valid number
    const validSize = typeof size === 'number' && !isNaN(size) && size > 0 ? size : 200;
    
    if (!data || data.length === 0) {
      return (
        <div className="w-full bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          ไม่มีข้อมูลแสดงผล
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
    let cumulativePercentage = 0;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    return (
      <div className="w-full">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: validSize, height: validSize }}>
            <svg width={validSize} height={validSize} className="transform -rotate-90">
              <circle
                cx={validSize / 2}
                cy={validSize / 2}
                r={(validSize - 40) / 2}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="20"
              />
              {data.map((item, index) => {
                const percentage = ((item.value || item.count || 0) / total) * 100;
                const strokeDasharray = `${percentage * 2.51} 251.2`; // 2π * r ≈ 251.2 for r=40
                const strokeDashoffset = -cumulativePercentage * 2.51;
                cumulativePercentage += percentage;

                return (
                  <circle
                    key={index}
                    cx={validSize / 2}
                    cy={validSize / 2}
                    r={(validSize - 40) / 2}
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-600">ทั้งหมด</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round(((item.value || item.count || 0) / total) * 100) : 0;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.value || item.count || 0} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },

  // Simple Line Chart Component (using CSS)
  LineChart: ({ data, title, height = 200 }) => {
    if (!data || data.length === 0) {
      return (
        <div className="w-full bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          ไม่มีข้อมูลแสดงผล
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => Math.max(item.users || 0, item.enrollments || 0, item.value || 0)));
    const minValue = Math.min(...data.map(item => Math.min(item.users || 0, item.enrollments || 0, item.value || 0)));
    const range = maxValue - minValue || 1;

    return (
      <div className="w-full">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        <div className="relative bg-gray-50 rounded-lg p-4" style={{ height: `${height + 60}px` }}>
          <div className="relative w-full" style={{ height: `${height}px` }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>{maxValue}</span>
              <span>{Math.round((maxValue + minValue) / 2)}</span>
              <span>{minValue}</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-8 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="border-t border-gray-200"></div>
                ))}
              </div>
              
              {/* Data points and lines */}
              <div className="relative h-full flex items-end justify-between">
                {data.map((item, index) => {
                  const userValue = item.users || item.value || 0;
                  const userHeight = ((userValue - minValue) / range) * (height - 20);
                  
                  return (
                    <div key={index} className="flex flex-col items-center relative group">
                      {/* Data point */}
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full relative cursor-pointer hover:bg-blue-600 transition-colors"
                        style={{ marginBottom: `${userHeight}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {userValue}
                        </div>
                      </div>
                      
                      {/* X-axis label */}
                      <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-center">
                        {item.date || item.name || index}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  // Simple Progress Bar
  ProgressBar: ({ value, max = 100, label, color = 'blue' }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500', 
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };

    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{label}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color] || colorClasses.blue}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  }
};

export default SimpleCharts;