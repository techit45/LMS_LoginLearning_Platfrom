import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Download,
  Calculator,
  Eye,
  Calendar,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PayrollReport from './PayrollReport';

const PersonalPayrollView = () => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  
  // Only show for instructors and admins
  if (!user || !['instructor', 'admin', 'super_admin'].includes(user.user_metadata?.role)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">สลิปเงินเดือนของฉัน</h3>
            <p className="text-sm text-gray-600">ดูรายละเอียดเงินเดือนและการหักภาษี</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Eye className="w-4 h-4" />
          <span>{showDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}</span>
        </button>
      </div>

      {!showDetails ? (
        <div className="text-center py-8">
          <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">คลิก "ดูรายละเอียด" เพื่อดูสลิปเงินเดือนและการคำนวณภาษี</p>
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">ข้อมูลที่จะแสดง:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>ชั่วโมงทำงานและค่าแรงรวม</li>
                  <li>เงินเดือนก่อนหักภาษี</li>
                  <li>การหักประกันสังคม 5%</li>
                  <li>การหักภาษี ณ ที่จ่าย 3%</li>
                  <li>ภาษีเงินได้บุคคลธรรมดา (อัตราก้าวหน้า)</li>
                  <li>เงินได้สุทธิหลังหักภาษี</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PayrollReport 
          selectedUserId={user.id}
          showDetails={true}
        />
      )}
    </div>
  );
};

export default PersonalPayrollView;