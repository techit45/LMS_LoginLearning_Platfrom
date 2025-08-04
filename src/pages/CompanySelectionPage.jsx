import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import {
  Building2,
  Code2,
  Stethoscope,
  GraduationCap,
  Cpu,
  Palette,
  ArrowRight,
  Star,
  Users,
  BookOpen
} from 'lucide-react';

const CompanySelectionPage = () => {
  const navigate = useNavigate();
  const { getAvailableCompanies, switchCompany } = useCompany();
  const companies = getAvailableCompanies();

  const getCompanyIcon = (companyId) => {
    const iconMap = {
      login: GraduationCap,
      meta: Code2,
      med: Stethoscope,
      edtech: BookOpen,
      innotech: Cpu,
      w2d: Palette
    };
    return iconMap[companyId] || Building2;
  };

  const getCompanyGradient = (color) => {
    const gradientMap = {
      indigo: 'from-indigo-600 to-purple-600',
      blue: 'from-blue-600 to-cyan-600',
      green: 'from-green-600 to-emerald-600',
      purple: 'from-purple-600 to-pink-600',
      orange: 'from-orange-600 to-red-600',
      pink: 'from-pink-600 to-rose-600'
    };
    return gradientMap[color] || gradientMap.indigo;
  };

  const handleCompanySelect = (companyId) => {
    switchCompany(companyId);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              เลือกองค์กรที่คุณสนใจ
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              เรามีหลากหลายองค์กรที่เชี่ยวชาญในด้านต่างๆ 
              เลือกองค์กรที่ตรงกับความสนใจของคุณเพื่อเริ่มต้นการเรียนรู้
            </p>
          </motion.div>
        </div>
      </div>

      {/* Company Cards */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {companies.map((company) => {
            const IconComponent = getCompanyIcon(company.id);
            const isDefault = company.isDefault;
            
            return (
              <motion.div
                key={company.id}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="relative group cursor-pointer"
                onClick={() => handleCompanySelect(company.id)}
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full hover:shadow-xl transition-all duration-300">
                  {/* Default Badge */}
                  {isDefault && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        หลัก
                      </div>
                    </div>
                  )}

                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${getCompanyGradient(company.color)} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{company.name}</h3>
                      <p className="text-sm opacity-90">{company.fullName}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {company.description}
                    </p>

                    {/* Special features for Meta */}
                    {company.id === 'meta' && company.tracks && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Code2 className="w-4 h-4 mr-2 text-blue-600" />
                          สายการเรียน
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {company.tracks.map((track) => (
                            <div key={track} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium text-center">
                              {track.charAt(0).toUpperCase() + track.slice(1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats/Features */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        <span>สำหรับทุกระดับ</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <BookOpen className="w-4 h-4 mr-1" />
                        <span>หลักสูตรครบ</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button className={`w-full bg-gradient-to-r ${getCompanyGradient(company.color)} text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center group-hover:shadow-lg transition-all duration-300`}>
                      เลือกองค์กรนี้
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-200"
        >
          <div className="text-center">
            <Building2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              ทำไมต้องเลือกองค์กร?
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              แต่ละองค์กรมีความเชี่ยวชาญและหลักสูตรที่แตกต่างกัน 
              การเลือกองค์กรที่เหมาะสมจะช่วยให้คุณได้รับประสบการณ์การเรียนรู้ที่ตรงกับความสนใจ
              และเป้าหมายในอนาคตของคุณมากที่สุด
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CompanySelectionPage;