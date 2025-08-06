import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SimpleModal = ({ isOpen, onClose, entry }) => {
  console.log('🔍 SimpleModal render:', { 
    isOpen, 
    hasEntry: !!entry, 
    entryId: entry?.id,
    propsReceived: Object.keys({ isOpen, onClose, entry })
  });
  
  if (!isOpen) {
    console.log('❌ SimpleModal not showing - isOpen is false');
    return null;
  }
  
  console.log('✅ SimpleModal SHOULD SHOW NOW!');
  
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: 'white', zIndex: 100000 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">รายละเอียดการลงเวลา</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {entry ? (
          <div className="space-y-4">
            <div>
              <strong>ID:</strong> {entry.id}
            </div>
            <div>
              <strong>วันที่:</strong> {entry.entry_date}
            </div>
            <div>
              <strong>เช็คอิน:</strong> {entry.check_in_time ? new Date(entry.check_in_time).toLocaleString('th-TH') : '-'}
            </div>
            <div>
              <strong>เช็คเอาท์:</strong> {entry.check_out_time ? new Date(entry.check_out_time).toLocaleString('th-TH') : '-'}
            </div>
            <div>
              <strong>ชั่วโมงรวม:</strong> {entry.total_hours || '0'} ชม.
            </div>
            <div>
              <strong>สถานที่ทำงาน:</strong> {entry.work_location || '-'}
            </div>
            <div>
              <strong>สถานะ:</strong> {entry.status || '-'}
            </div>
            
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-medium mb-2">ข้อมูลดิบ:</h3>
              <pre className="text-xs bg-gray-200 p-2 rounded overflow-auto">
                {JSON.stringify(entry, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div>ไม่มีข้อมูล</div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};

export default SimpleModal;