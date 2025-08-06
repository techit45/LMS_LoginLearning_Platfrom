import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Building2, 
  AlertTriangle, 
  X, 
  Check,
  FolderOpen,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useCompany, COMPANIES } from '../contexts/CompanyContext';

const TransferItemModal = ({ 
  isOpen, 
  onClose, 
  item, 
  itemType, // 'project' or 'course'
  onTransferComplete 
}) => {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen || !item) return null;

  const currentCompanyName = COMPANIES[item.company]?.name || item.company;
  const itemTypeLabel = itemType === 'project' ? 'โครงงาน' : 'คอร์สเรียน';
  const expectedConfirmText = `MOVE ${item.title}`;
  
  // Available companies (exclude current company)
  const availableCompanies = Object.values(COMPANIES).filter(
    company => company.id !== item.company
  );

  const handleTransfer = async () => {
    if (!selectedCompany) {
      toast({
        title: "กรุณาเลือกบริษัทปลายทาง",
        variant: "destructive"
      });
      return;
    }

    if (confirmText !== expectedConfirmText) {
      toast({
        title: "กรุณาพิมพ์ข้อความยืนยันให้ถูกต้อง",
        description: `พิมพ์: ${expectedConfirmText}`,
        variant: "destructive"
      });
      return;
    }

    setTransferring(true);
    try {
      // Import the appropriate service
      const serviceName = itemType === 'project' ? 'projectService' : 'courseService';
      const { transferItemToCompany } = await import(`../lib/${serviceName}.js`);
      
      // Perform the transfer
      const result = await transferItemToCompany(item.id, selectedCompany, {
        fromCompany: item.company,
        itemTitle: item.title,
        itemType,
        transferDriveFolder: true
      });

      if (result.error) {
        throw new Error(result.error.message || 'การย้ายล้มเหลว');
      }

      toast({
        title: "ย้ายสำเร็จ!",
        description: `${itemTypeLabel} "${item.title}" ถูกย้ายไปยัง ${COMPANIES[selectedCompany].name} แล้ว`,
        variant: "default"
      });

      // Call the completion callback
      if (onTransferComplete) {
        onTransferComplete(result.data);
      }

      onClose();
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || `ไม่สามารถย้าย${itemTypeLabel}ได้`,
        variant: "destructive"
      });
    } finally {
      setTransferring(false);
    }
  };

  const selectedCompanyData = COMPANIES[selectedCompany];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  ย้าย{itemTypeLabel}
                </h2>
                <p className="text-white/90 text-sm">
                  ย้ายไปยังบริษัทอื่น พร้อมโฟลเดอร์ Google Drive
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl"
              disabled={transferring}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Item Info */}
          <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                {itemType === 'project' ? (
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  ปัจจุบันอยู่ใน: <span className="font-medium">{currentCompanyName}</span>
                </p>
                {item.google_drive_folder_id && (
                  <div className="flex items-center text-xs text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    มีโฟลเดอร์ Google Drive
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">
                  ข้อควรระวัง
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• การย้ายจะย้ายทั้งข้อมูลและโฟลเดอร์ Google Drive</li>
                  <li>• ลิงก์เก่าอาจไม่สามารถเข้าถึงได้</li>
                  <li>• การดำเนินการนี้ไม่สามารถยกเลิกได้</li>
                  <li>• ผู้ดูแลระบบเท่านั้นที่สามารถย้ายได้</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Company Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              เลือกบริษัทปลายทาง *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableCompanies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedCompany(company.id)}
                  disabled={transferring}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedCompany === company.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${transferring ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedCompany === company.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        selectedCompany === company.id ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        selectedCompany === company.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {company.name}
                      </h3>
                      <p className={`text-xs ${
                        selectedCompany === company.id ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {company.description}
                      </p>
                    </div>
                    {selectedCompany === company.id && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Preview */}
          {selectedCompany && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">
                ตัวอย่างหลังการย้าย
              </h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="bg-gray-100 p-3 rounded-lg mb-2">
                    <Building2 className="w-6 h-6 text-gray-600 mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {currentCompanyName}
                  </p>
                  <p className="text-xs text-gray-500">ปัจจุบัน</p>
                </div>
                
                <ArrowRight className="w-6 h-6 text-blue-500" />
                
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-lg mb-2">
                    <Building2 className="w-6 h-6 text-blue-600 mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-blue-700">
                    {selectedCompanyData.name}
                  </p>
                  <p className="text-xs text-blue-500">ปลายทาง</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ยืนยันการย้าย *
            </label>
            <p className="text-sm text-gray-600 mb-3">
              พิมพ์ <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">
                {expectedConfirmText}
              </code> เพื่อยืนยัน
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder={expectedConfirmText}
              disabled={transferring}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={transferring}
              className="px-6"
            >
              ยกเลิก
            </Button>
            
            <Button
              onClick={handleTransfer}
              disabled={!selectedCompany || confirmText !== expectedConfirmText || transferring}
              className="px-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {transferring ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังย้าย...
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  ย้าย{itemTypeLabel}
                </div>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransferItemModal;