import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Calendar,
  Filter,
  Users,
  BookOpen,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const ExportDataModal = ({ isOpen, onClose, context = 'dashboard' }) => {
  const [exportType, setExportType] = useState('pdf');
  const [dateRange, setDateRange] = useState('7days');
  const [selectedData, setSelectedData] = useState(['users', 'courses']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  // Export type options
  const exportTypes = [
    {
      id: 'pdf',
      label: 'PDF Report',
      description: 'รายงานแบบ PDF พร้อมกราฟและตาราง',
      icon: FileText,
      color: 'red'
    },
    {
      id: 'excel',
      label: 'Excel Spreadsheet',
      description: 'ไฟล์ Excel สำหรับวิเคราะห์ข้อมูลเพิ่มเติม',
      icon: FileSpreadsheet,
      color: 'green'
    },
    {
      id: 'csv',
      label: 'CSV Data',
      description: 'ข้อมูลดิบแบบ CSV',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'image',
      label: 'Dashboard Screenshot',
      description: 'ภาพหน้าจอ Dashboard แบบ PNG',
      icon: Image,
      color: 'purple'
    }
  ];

  // Date range options
  const dateRanges = [
    { id: '7days', label: '7 วันล่าสุด' },
    { id: '30days', label: '30 วันล่าสุด' },
    { id: '90days', label: '90 วันล่าสุด' },
    { id: 'custom', label: 'กำหนดเอง' }
  ];

  // Data options based on context
  const getDataOptions = () => {
    const baseOptions = [
      { id: 'users', label: 'ข้อมูลผู้ใช้งาน', icon: Users, description: 'จำนวนผู้ใช้, การเข้าใช้งาน, สถิติ' },
      { id: 'courses', label: 'ข้อมูลคอร์ส', icon: BookOpen, description: 'คอร์สเรียน, การลงทะเบียน, ความก้าวหน้า' },
      { id: 'analytics', label: 'สถิติและกราห', icon: BarChart3, description: 'กราฟ, แผนภูมิ, เมตริก' }
    ];

    if (context === 'worktime') {
      return [
        { id: 'worktime', label: 'ข้อมูลเวลาทำงาน', icon: FileText, description: 'ชั่วโมงทำงาน, บริษัทที่ทำงาน, สรุป' },
        { id: 'timesheet', label: 'บันทึกเวลา', icon: Calendar, description: 'ชั่วโมงทำงาน, การเข้างาน' }
      ];
    }

    return baseOptions;
  };

  const dataOptions = getDataOptions();

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('processing');

    try {
      // จำลองการ export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // จำลองการสร้างไฟล์
      const filename = `${context}-report-${exportType}-${Date.now()}`;
      const mimeTypes = {
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv',
        image: 'image/png'
      };

      // สร้าง mock data สำหรับ download
      const mockData = generateMockData();
      const blob = new Blob([mockData], { type: mimeTypes[exportType] });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${exportType === 'excel' ? 'xlsx' : exportType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => {
        setIsExporting(false);
        setExportStatus(null);
      }, 2000);

    } catch (error) {
      setExportStatus('error');
      setTimeout(() => {
        setIsExporting(false);
        setExportStatus(null);
      }, 3000);
    }
  };

  // Generate mock data
  const generateMockData = () => {
    if (exportType === 'csv') {
      return `วันที่,ผู้ใช้งาน,คอร์สใหม่,การลงทะเบียน,ความก้าวหน้า
2025-08-01,45,2,12,78%
2025-08-02,48,1,8,82%
2025-08-03,52,0,15,85%
2025-08-04,47,3,20,88%
2025-08-05,51,1,18,92%
2025-08-06,49,2,14,89%
2025-08-07,55,1,22,95%`;
    }

    return JSON.stringify({
      reportType: context,
      exportType: exportType,
      dateRange: dateRange,
      generatedAt: new Date().toISOString(),
      data: selectedData,
      summary: {
        totalUsers: 55,
        totalCourses: 12,
        totalEnrollments: 109,
        averageProgress: 87
      }
    }, null, 2);
  };

  // Toggle data selection
  const toggleDataSelection = (dataId) => {
    setSelectedData(prev => 
      prev.includes(dataId) 
        ? prev.filter(id => id !== dataId)
        : [...prev, dataId]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Download className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Data</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">ส่งออกข้อมูลและรายงาน</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                {/* Export Type Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">รูปแบบการส่งออก</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exportTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <motion.label
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            exportType === type.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="exportType"
                            value={type.id}
                            checked={exportType === type.id}
                            onChange={(e) => setExportType(e.target.value)}
                            className="sr-only"
                          />
                          
                          <div className={`p-2 rounded-lg mr-3 ${
                            type.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                            type.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                            type.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{type.label}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{type.description}</p>
                          </div>

                          {exportType === type.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            </motion.div>
                          )}
                        </motion.label>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">ช่วงเวลา</h3>
                  <div className="flex flex-wrap gap-2">
                    {dateRanges.map((range) => (
                      <motion.button
                        key={range.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDateRange(range.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          dateRange === range.id
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {range.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Data Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">ข้อมูลที่ต้องการ</h3>
                  <div className="space-y-2">
                    {dataOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = selectedData.includes(option.id);
                      
                      return (
                        <motion.label
                          key={option.id}
                          whileHover={{ scale: 1.01 }}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDataSelection(option.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-3"
                          />
                          
                          <IconComponent className={`w-5 h-5 mr-3 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                          }`} />
                          
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                            }`}>
                              {option.label}
                            </h4>
                            <p className={`text-sm ${
                              isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {option.description}
                            </p>
                          </div>
                        </motion.label>
                      );
                    })}
                  </div>
                </div>

                {/* Export Status */}
                <AnimatePresence>
                  {exportStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-lg border ${
                        exportStatus === 'success' 
                          ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                          : exportStatus === 'error'
                          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                          : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {exportStatus === 'processing' && (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        )}
                        {exportStatus === 'success' && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        {exportStatus === 'error' && (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span className="font-medium">
                          {exportStatus === 'processing' && 'กำลังสร้างไฟล์...'}
                          {exportStatus === 'success' && 'ส่งออกสำเร็จ! ไฟล์จะดาวน์โหลดอัตโนมัติ'}
                          {exportStatus === 'error' && 'เกิดข้อผิดพลาดในการส่งออก'}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedData.length} รายการที่เลือก • {dateRanges.find(r => r.id === dateRange)?.label}
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    ยกเลิก
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    disabled={isExporting || selectedData.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isExporting ? 'กำลังส่งออก...' : 'ส่งออกข้อมูล'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportDataModal;