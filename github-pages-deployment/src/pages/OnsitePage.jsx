import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Users, 
  Award, 
  CheckCircle, 
  BookOpen,
  Target,
  Calendar,
  Phone,
  Mail,
  Star,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const OnsitePage = () => {
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const onsitePrograms = [
    {
      title: "Arduino & IoT Workshop",
      duration: "5 วัน",
      participants: "15-20 คน",
      description: "เรียนรู้การสร้างระบบ IoT และการควบคุมอุปกรณ์ด้วย Arduino",
      features: ["ปฏิบัติการจริง", "อุปกรณ์ครบชุด", "โปรเจคจริง"],
      price: "12,500 บาท",
      category: "Electronics"
    },
    {
      title: "React Native Mobile Development",
      duration: "7 วัน", 
      participants: "12-18 คน",
      description: "สร้างแอปพลิเคชันมือถือด้วย React Native จากเริ่มต้นจนเสร็จสมบูรณ์",
      features: ["สร้างแอปจริง", "Deploy ขึ้น Store", "Portfolio Project"],
      price: "18,000 บาท",
      category: "Software"
    },
    {
      title: "Structural Design Intensive",
      duration: "10 วัน",
      participants: "10-15 คน", 
      description: "การออกแบบโครงสร้างอาคารเชิงลึกด้วยซอฟต์แวร์มืออาชีพ",
      features: ["AutoCAD + SAP2000", "โปรเจคจริง", "ใบรับรอง"],
      price: "25,000 บาท",
      category: "Civil Engineering"
    }
  ];

  const benefits = [
    {
      icon: Users,
      title: "เรียนแบบกลุ่มเล็ก",
      description: "จำนวนผู้เรียนจำกัด เพื่อการดูแลที่ใกล้ชิด"
    },
    {
      icon: Target,
      title: "ปฏิบัติการจริง",
      description: "70% ปฏิบัติ 30% ทฤษฎี เน้นการทำงานจริง"
    },
    {
      icon: Award,
      title: "ใบรับรองการเรียน",
      description: "รับใบรับรองหลังจบคอร์สทุกหลักสูตร"
    },
    {
      icon: BookOpen,
      title: "เอกสารประกอบ",
      description: "เอกสาร E-book และอุปกรณ์ครบชุด"
    }
  ];

  const facilities = [
    "ห้องเรียนปรับอากาศ พร้อมเครื่องมือครบชุด",
    "คอมพิวเตอร์และซอฟต์แวร์ลิขสิทธิ์แท้",
    "Wi-Fi ความเร็วสูง และพื้นที่จอดรถ",
    "พื้นที่พักผ่อนและอาหารกลางวัน",
    "ห้องสมุดและพื้นที่ทำงานกลุ่ม"
  ];

  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants} 
      className="min-h-screen pt-20"
    >
      <Helmet>
        <title>การเรียน Onsite - Login Learning</title>
        <meta name="description" content="หลักสูตรการเรียนแบบ Onsite ณ สถาบัน Login Learning พร้อมปฏิบัติการจริงและอุปกรณ์ครบชุด" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-blue-200/30"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full flex items-center justify-center">
                <MapPin className="w-10 h-10 text-blue-800" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-black mb-6">
              การเรียน <span className="gradient-text">Onsite</span>
            </h1>
            <p className="text-xl text-black mb-8 leading-relaxed">
              เรียนรู้แบบเข้มข้นกับอาจารย์ผู้เชี่ยวชาญ ปฏิบัติการจริง พร้อมอุปกรณ์ครบชุด 
              ณ ศูนย์การเรียนรู้ Login Learning
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600">
                <Calendar className="w-5 h-5 mr-2" />
                จองหลักสูตร Onsite
              </Button>
              <Button size="lg" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Phone className="w-5 h-5 mr-2" />
                สอบถามข้อมูล
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6">
              ทำไมต้องเรียน <span className="gradient-text">Onsite</span>
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              การเรียนแบบ Onsite ให้ประสบการณ์การเรียนรู้ที่เข้มข้นและมีประสิทธิภาพสูงสุด
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect p-6 rounded-xl text-center hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-800" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">{benefit.title}</h3>
                <p className="text-black">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50/80 to-blue-100/60">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6">
              หลักสูตร <span className="gradient-text">Onsite</span> ยอดนิยม
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              หลักสูตรเข้มข้นที่ได้รับความนิยมสูงสุด พร้อมปฏิบัติการจริง
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {onsitePrograms.map((program, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="glass-effect p-6 rounded-xl hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-700 to-blue-500 text-gray-800 text-sm rounded-full">
                    {program.category}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm">ยอดนิยม</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-black mb-3">{program.title}</h3>
                <p className="text-black mb-4">{program.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-black">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>ระยะเวลา: {program.duration}</span>
                  </div>
                  <div className="flex items-center text-black">
                    <Users className="w-4 h-4 mr-2" />
                    <span>ผู้เรียน: {program.participants}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {program.features.map((feature, i) => (
                    <div key={i} className="flex items-center text-blue-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-black">{program.price}</span>
                    <span className="text-black text-sm block">รวมอุปกรณ์ทั้งหมด</span>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600">
                    สอบถาม
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6">
                สิ่งอำนวยความสะดวก
              </h2>
              <p className="text-xl text-black mb-8">
                ศูนย์การเรียนรู้ที่ทันสมัย พร้อมสิ่งอำนวยความสะดวกครบครัน
              </p>
              
              <div className="space-y-4">
                {facilities.map((facility, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-black">{facility}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="glass-effect p-8 rounded-xl"
            >
              <div className="text-center">
                <Building className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-black mb-4">ที่ตั้งศูนย์การเรียน</h3>
                <div className="space-y-3 text-black">
                  <p><strong>สำนักงานใหญ่:</strong></p>
                  <p>123 ถนนเทคโนโลยี แขวงนวัตกรรม<br />เขตดิจิทัล กรุงเทพฯ 10400</p>
                  <div className="pt-4 border-t border-slate-300">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-blue-600" />
                        <span>02-xxx-xxxx</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-600" />
                        <span>onsite@loginlearning.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-100/60 to-blue-200/40">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6">
              พร้อมเริ่มต้นการเรียนรู้แบบ Onsite แล้วหรือยัง?
            </h2>
            <p className="text-xl text-black mb-8">
              ติดต่อเราวันนี้เพื่อสอบถามข้อมูลและจองที่นั่งในหลักสูตรที่คุณสนใจ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600">
                <Phone className="w-5 h-5 mr-2" />
                ติดต่อเราเลย
              </Button>
              <Button size="lg" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" asChild>
                <Link to="/contact">
                  <Mail className="w-5 h-5 mr-2" />
                  ส่งข้อความถึงเรา
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default OnsitePage;