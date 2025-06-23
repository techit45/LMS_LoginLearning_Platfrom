import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Users, Target, Zap, Briefcase, Lightbulb, MapPin, Phone, Mail, Users as UsersIcon } from 'lucide-react';

const AboutPage = () => {
  const companyInfo = {
    name: "LOGIN LEARNING Co.",
    mission: "คอร์สเรียนเสริมทักษะและค้นหาตัวตนของน้องมัธยม ต้น-ปลาย เพื่อตัดสินใจเข้าเรียนต่อในระดับมัธยมปลาย/มหาวิทยาลัย",
    address: "917 จรัญสนิทวงศ์ 75 บางพลัด บางพลัด",
    contacts: [
      { name: "พี่ก้อง", phone: "090-969-9578" },
      { name: "พี่เก็ก", phone: "083-436-0294" },
    ],
    lineGroup: "https://line.me/ti/g/TbTTLXEkRS",
    email: "info@loginlearning.com",
  };

  const branches = [
    { name: "สาขาลาดกระบัง", address: "ถนนฉลองกรุง ลาดกระบัง, กรุงเทพฯ 10520", image: "Ladkrabang branch of Login Learning with students" },
    { name: "สาขาบางพลัด", address: "400 ซ.จรัญสนิทวงศ์ 75 แขวงบางพลัด, กรุงเทพฯ 10700", image: "Bang Phlat branch of Login Learning with modern classroom" },
    { name: "สาขาศรีราชา", address: "165/31 อำเภอศรีราชา ชลบุรี 20110", image: "Sriracha branch of Login Learning, coastal city view" },
    { name: "สาขาระยอง", address: "84/48 อำเภอเมืองระยอง ระยอง 21000", image: "Rayong branch of Login Learning, industrial area context" },
  ];

  const services = [
    { icon: Zap, title: "สอนทำโครงงานด้านวิศวกรรม", description: "เสริมสร้างทักษะการทำโครงงานจริง พร้อมพี่เลี้ยงดูแลใกล้ชิด" },
    { icon: Target, title: "สอนทฤษฎีและการแข่งขัน", description: "เตรียมความพร้อมทั้งภาคทฤษฎีและสนามแข่งขัน เช่น หุ่นยนต์เดินตามเส้น, TESA Top Gun Rally" },
    { icon: Briefcase, title: "อบรม Professional Skills", description: "พัฒนาทักษะจำเป็นสำหรับวิศวกร เช่น การโปรแกรม (Python, C++), Arduino, IoT, แขนกล DOBOT, PLC" },
    { icon: Lightbulb, title: "Engineering Services", description: "บริการด้านวิศวกรรม เช่น ออกแบบชุดฝึกขนถ่ายโลหะ, เครื่องตรวจความสุกมะม่วง, เครื่องจำลองการชุบโลหะ" },
    { icon: Users, title: "จัดค่ายนอกสถานที่", description: "เปิดประสบการณ์การเรียนรู้วิศวกรรมรูปแบบใหม่ สนุกและได้ความรู้" },
  ];

  const sampleProjects = [
    "แบบจำลองการปลูกข้าวสมัยใหม่ด้วยระบบ IOT",
    "แบบจำลองการควบคุมและตรวจสอบคุณภาพน้ำด้วยระบบ IOT และ AI",
    "แบบจำลองเครื่องกวนสารโดยใช้ AI และ PID Control",
    "เครื่องตรวจความสุกมะม่วง",
    "เครื่องช่วยกายภาพบำบัดแขน",
    "กระถางต้นไม้อัจฉริยะ",
    "เครื่องตรวจสอบคุณภาพน็อตและจำลองการชุบแข็ง",
  ];

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="pt-24 pb-16 px-6">
      <Helmet>
        <title>เกี่ยวกับเรา - Login Learning</title>
        <meta name="description" content={`เรียนรู้เพิ่มเติมเกี่ยวกับ ${companyInfo.name} ภารกิจของเรา และทีมงานผู้เชี่ยวชาญที่พร้อมช่วยน้องๆ ค้นหาเส้นทางวิศวะ`} />
      </Helmet>

      {/* Hero Section */}
      <section className="text-center mb-16 pt-8">
        <motion.h1 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
        >
          เกี่ยวกับ <span className="gradient-text">Login Learning</span>
        </motion.h1>
        <motion.p 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-xl text-gray-700 max-w-3xl mx-auto"
        >
          {companyInfo.mission}
        </motion.p>
      </section>

      {/* Company Info Section */}
      <section className="mb-16">
        <div className="max-w-4xl mx-auto glass-effect p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">ข้อมูลองค์กร</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img 
                className="rounded-lg shadow-md w-full h-64 object-cover mb-4"
                alt="ทีมงาน Login Learning กำลังสอนนักเรียน" src="https://images.unsplash.com/photo-1701229404076-5629809b331d" />
              <div className="flex items-start space-x-3 mb-3">
                <MapPin className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                <p className="text-gray-800">{companyInfo.address}</p>
              </div>
              <div className="flex items-center space-x-3 mb-3">
                <Mail className="w-6 h-6 text-blue-400 shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="text-gray-800 hover:text-blue-600 transition-colors">{companyInfo.email}</a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">ติดต่อเรา:</h3>
              {companyInfo.contacts.map((contact, index) => (
                <div key={index} className="flex items-center space-x-3 mb-3">
                  <Phone className="w-6 h-6 text-blue-400 shrink-0" />
                  <p className="text-gray-800">{contact.name}: {contact.phone}</p>
                </div>
              ))}
              <div className="flex items-center space-x-3 mt-4">
                <UsersIcon className="w-6 h-6 text-green-400 shrink-0" />
                <a href={companyInfo.lineGroup} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-green-600 transition-colors underline">
                  เข้าร่วม Line Group ของเรา
                </a>
              </div>
              <img 
                className="rounded-lg shadow-md w-full h-40 object-cover mt-4"
                alt="บรรยากาศการเรียนการสอนที่ Login Learning" src="https://images.unsplash.com/photo-1645001399108-e5c236218018" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Branches Section */}
      <section className="mb-16" id="branches">
        <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">สาขาของเรา</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {branches.map((branch, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="course-card rounded-xl overflow-hidden p-6 text-center"
            >
              <img 
                className="w-full h-40 object-cover rounded-md mb-4"
                alt={`สาขา ${branch.name} ของ Login Learning`} src="https://images.unsplash.com/photo-1683419405479-e79a7a6a1d53" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{branch.name}</h3>
              <p className="text-gray-600 text-sm">{branch.address}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="mb-16" id="services">
        <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">บริการและกิจกรรมของเรา</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-effect rounded-xl p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 mx-auto">
                <service.icon className="w-8 h-8 text-blue-800" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3 text-center">{service.title}</h3>
              <p className="text-gray-700 leading-relaxed text-center">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sample Projects Section */}
      <section id="projects">
        <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">ตัวอย่างโครงงาน ปี 2568</h2>
        <div className="max-w-3xl mx-auto glass-effect p-8 rounded-xl shadow-lg">
          <ul className="list-disc list-inside space-y-3 text-gray-800">
            {sampleProjects.map((project, index) => (
              <motion.li 
                key={index}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="text-lg"
              >
                {project}
              </motion.li>
            ))}
          </ul>
          <p className="text-gray-600 mt-6 text-sm italic">
            ข้อมูลนี้เป็นข้อมูลเบื้องต้นและอาจมีการเปลี่ยนแปลง โปรดตรวจสอบข้อมูลล่าสุดจากประกาศอย่างเป็นทางการ
          </p>
        </div>
      </section>
    </motion.div>
  );
};

export default AboutPage;