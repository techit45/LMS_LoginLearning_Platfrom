import React from 'react';
import { motion } from 'framer-motion';
import { useCompany } from '@/contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Code2,
  Stethoscope,
  BookOpen,
  Cpu,
  Palette,
  ArrowRight,
  Star,
  Users,
  Target,
  Lightbulb,
  Award
} from 'lucide-react';

const CompanyHomePage = () => {
  const { currentCompany, getCompanyTheme, getCompanyUrl } = useCompany();
  const navigate = useNavigate();
  const theme = getCompanyTheme();

  if (!currentCompany) {
    return <div>Loading...</div>;
  }

  const getCompanyIcon = (companyId) => {
    const iconMap = {
      login: GraduationCap,
      meta: Code2,
      med: Stethoscope,
      edtech: BookOpen,
      innotech: Cpu,
      w2d: Palette
    };
    return iconMap[companyId] || GraduationCap;
  };

  const getCompanyContent = (companyId) => {
    const contentMap = {
      login: {
        hero: {
          title: 'เรียนรู้วิศวกรรมกับผู้เชี่ยวชาญ',
          subtitle: 'ค้นหาความถนัดสำหรับน้องมัธยม เตรียมความพร้อมสู่คณะวิศวกรรม',
          cta: 'เริ่มต้นเรียนรู้'
        },
        features: [
          { icon: Target, title: 'ค้นหาความถนัด', desc: 'ทดสอบและค้นหาสาขาวิศวกรรมที่เหมาะกับคุณ' },
          { icon: Users, title: 'เรียนกับผู้เชี่ยวชาญ', desc: 'วิศวกรมืออาชีพสอนแบบ hands-on' },
          { icon: Award, title: 'โครงงานจริง', desc: 'สร้างผลงานที่ใช้งานได้จริงในอุตสาหกรรม' }
        ]
      },
      meta: {
        hero: {
          title: 'Meta Technology Academy',
          subtitle: 'พัฒนาทักษะเทคโนโลยีขั้นสูง 4 สายหลัก: Cyber Security, Data Science, Web App, AI/ML',
          cta: 'เลือกสายการเรียน'
        },
        features: [
          { icon: Code2, title: 'เทคโนโลยีล้ำสมัย', desc: 'เรียนรู้เทคโนโลยีที่ทันสมัยที่สุด' },
          { icon: Target, title: '4 สายเฉพาะทาง', desc: 'เลือกเรียนตามความสนใจและความถนัด' },
          { icon: Award, title: 'อาชีพในอนาคต', desc: 'เตรียมพร้อมงานเทคโนโลยีที่ต้องการสูง' }
        ]
      },
      med: {
        hero: {
          title: 'Medical Technology Solutions',
          subtitle: 'ศูนย์พัฒนาเทคโนโลยีการแพทย์และสุขภาพ นำเทคโนโลยีมาช่วยในงานการแพทย์',
          cta: 'เรียนรู้เทคโนโลยีการแพทย์'
        },
        features: [
          { icon: Stethoscope, title: 'เทคโนโลยีการแพทย์', desc: 'เรียนรู้การใช้เทคโนโลยีในงานการแพทย์' },
          { icon: Lightbulb, title: 'นวัตกรรมสุขภาพ', desc: 'พัฒนานวัตกรรมเพื่อสุขภาพที่ดีขึ้น' },
          { icon: Users, title: 'ทีมสหสาขา', desc: 'ทำงานร่วมกับแพทย์และเทคโนโลยี' }
        ]
      },
      edtech: {
        hero: {
          title: 'Educational Technology Innovation',
          subtitle: 'ศูนย์นวัตกรรมเทคโนโลยีการศึกษา สร้างการเรียนรู้ยุคใหม่',
          cta: 'สำรวจนวัตกรรม'
        },
        features: [
          { icon: BookOpen, title: 'นวัตกรรมการเรียนรู้', desc: 'พัฒนาเครื่องมือการเรียนรู้ยุคใหม่' },
          { icon: Lightbulb, title: 'เทคโนโลยีการศึกษา', desc: 'ใช้เทคโนโลยีเพิ่มประสิทธิภาพการเรียน' },
          { icon: Target, title: 'อนาคตการศึกษา', desc: 'สร้างการศึกษาที่เข้าถึงได้ทุกคน' }
        ]
      },
      innotech: {
        hero: {
          title: 'Innovation Technology Labs',
          subtitle: 'ห้องปฏิบัติการวิจัยและพัฒนาเทคโนโลยี นวัตกรรมสำหรับอนาคต',
          cta: 'เข้าร่วมการวิจัย'
        },
        features: [
          { icon: Cpu, title: 'ห้องแล็บล้ำสมัย', desc: 'เครื่องมือวิจัยเทคโนโลยีขั้นสูง' },
          { icon: Lightbulb, title: 'วิจัยนวัตกรรม', desc: 'พัฒนาเทคโนโลยีที่จะเปลี่ยนโลก' },
          { icon: Award, title: 'งานวิจัยระดับโลก', desc: 'ผลงานวิจัยที่ได้รับการยอมรับ' }
        ]
      },
      w2d: {
        hero: {
          title: 'Web to Digital Creative Studio',
          subtitle: 'สตูดิโอสร้างสรรค์ดิจิทัลและเว็บเทคโนโลยี ผสมผสานศิลปะกับเทคโนโลยี',
          cta: 'สร้างสรรค์ผลงาน'
        },
        features: [
          { icon: Palette, title: 'ดีไซน์ดิจิทัล', desc: 'เรียนรู้การออกแบบดิจิทัลสมัยใหม่' },
          { icon: Code2, title: 'เว็บเทคโนโลジี', desc: 'พัฒนาเว็บไซต์และแอปพลิเคชัน' },
          { icon: Lightbulb, title: 'ความคิดสร้างสรรค์', desc: 'ผสมผสานศิลปะกับเทคโนโลยี' }
        ]
      }
    };
    return contentMap[companyId] || contentMap.login;
  };

  const IconComponent = getCompanyIcon(currentCompany.id);
  const content = getCompanyContent(currentCompany.id);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`bg-gradient-to-r ${theme.primary === 'bg-indigo-600' ? 'from-indigo-600 to-purple-600' : `from-${currentCompany.color}-600 to-${currentCompany.color}-700`} py-20`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <IconComponent className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {content.hero.title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto opacity-90">
              {content.hero.subtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(getCompanyUrl('/courses'))}
              className="bg-white text-gray-800 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 inline-flex items-center"
            >
              {content.hero.cta}
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              ทำไมต้องเลือก {currentCompany.name}?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentCompany.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br from-${currentCompany.color}-500 to-${currentCompany.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                    <FeatureIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meta-specific Tracks Section */}
      {currentCompany.id === 'meta' && (
        <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                4 สายการเรียนหลัก
              </h2>
              <p className="text-xl text-gray-600">
                เลือกสายที่ตรงกับความสนใจและความถนัดของคุณ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentCompany.tracks?.map((track, index) => (
                <motion.div
                  key={track}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200 cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(getCompanyUrl(`/tracks/${track}`))}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Code2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {track.charAt(0).toUpperCase() + track.slice(1)}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      เรียนรู้เชิงลึกเฉพาะทาง
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={`py-20 bg-gradient-to-r from-${currentCompany.color}-600 to-${currentCompany.color}-700`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <h2 className="text-4xl font-bold mb-6">
              พร้อมที่จะเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              เข้าร่วมกับเราวันนี้ และเริ่มต้นการเรียนรู้ที่จะเปลี่ยนอนาคตของคุณ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(getCompanyUrl('/courses'))}
                className="bg-white text-gray-800 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 inline-flex items-center justify-center"
              >
                ดูหลักสูตร
                <BookOpen className="w-5 h-5 ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(getCompanyUrl('/contact'))}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-gray-800 transition-all duration-300"
              >
                ติดต่อเรา
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CompanyHomePage;