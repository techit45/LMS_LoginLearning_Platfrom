import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const ContactPage = () => {
  const { toast } = useToast();

  const companyInfo = {
    address: "917 จรัญสนิทวงศ์ 75 บางพลัด บางพลัด, กรุงเทพฯ",
    contacts: [
      { name: "พี่ก้อง", phone: "090-969-9578" },
      { name: "พี่เก็ก", phone: "083-436-0294" },
    ],
    email: "info@loginlearning.com",
    lineGroup: "https://line.me/ti/g/TbTTLXEkRS",
  };
  
  const branches = [
    { name: "สาขาลาดกระบัง", address: "ถนนฉลองกรุง ลาดกระบัง, กรุงเทพฯ 10520" },
    { name: "สาขาบางพลัด", address: "400 ซ.จรัญสนิทวงศ์ 75 แขวงบางพลัด, กรุงเทพฯ 10700" },
    { name: "สาขาศรีราชา", address: "165/31 อำเภอศรีราชา ชลบุรี 20110" },
    { name: "สาขาระยอง", address: "84/48 อำเภอเมืองระยอง ระยอง 21000" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "🚧 ระบบส่งข้อความยังไม่พร้อมใช้งาน",
      description: "ขออภัยในความไม่สะดวก กรุณาติดต่อเราผ่านช่องทางอื่นที่ระบุไว้ 🚀",
    });
  };

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
        <title>ติดต่อเรา - Login Learning</title>
        <meta name="description" content="ติดต่อ Login Learning เพื่อสอบถามข้อมูลคอร์สเรียน บริการ หรือขอคำปรึกษาด้านวิศวกรรม" />
      </Helmet>

      <section className="pt-8 mb-12">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            ติดต่อ <span className="gradient-text">Login Learning</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            มีคำถาม? ต้องการคำแนะนำ? หรือสนใจคอร์สเรียน? ติดต่อเราได้เลย!
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="glass-effect p-8 rounded-xl shadow-xl"
          >
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">ส่งข้อความถึงเรา</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1">ชื่อ-นามสกุล</label>
                <Input type="text" id="name" placeholder="เช่น สมชาย ใจดี" className="text-black bg-white/90 focus:bg-white" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">อีเมล</label>
                <Input type="email" id="email" placeholder="เช่น somchai.j@example.com" className="text-black bg-white/90 focus:bg-white" required />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-800 mb-1">หัวข้อ</label>
                <Input type="text" id="subject" placeholder="เช่น สอบถามเกี่ยวกับคอร์ส Arduino" className="text-black bg-white/90 focus:bg-white" required />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-1">ข้อความ</label>
                <Textarea id="message" rows="4" placeholder="พิมพ์ข้อความของคุณที่นี่..." className="text-black bg-white/90 focus:bg-white" required />
              </div>
              <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Send className="w-5 h-5 mr-2" />
                ส่งข้อความ
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="space-y-8"
          >
            <div className="glass-effect p-8 rounded-xl shadow-xl">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6">ข้อมูลติดต่อ</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">ที่ตั้งสำนักงานใหญ่</h3>
                    <p className="text-gray-700">{companyInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-6 h-6 text-green-400 mt-1 shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">เบอร์โทรศัพท์</h3>
                    {companyInfo.contacts.map(contact => (
                      <p key={contact.name} className="text-gray-700">{contact.name}: {contact.phone}</p>
                    ))}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-6 h-6 text-yellow-400 mt-1 shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">อีเมล</h3>
                    <a href={`mailto:${companyInfo.email}`} className="text-gray-700 hover:text-yellow-600 transition-colors">{companyInfo.email}</a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-6 h-6 text-teal-400 mt-1 shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Line Group</h3>
                    <a href={companyInfo.lineGroup} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-teal-600 transition-colors underline">
                      คลิกเพื่อเข้าร่วมกลุ่ม Line
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-effect p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">สาขาที่เปิดบริการ</h2>
                <div className="space-y-3">
                    {branches.map(branch => (
                        <div key={branch.name} className="flex items-start space-x-2">
                            <MapPin className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                            <div>
                                <p className="text-md font-medium text-gray-800">{branch.name}</p>
                                <p className="text-sm text-gray-600">{branch.address}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="mt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="text-center mb-6"
        >
            <h2 className="text-3xl font-bold text-gray-900">ค้นหาเราบนแผนที่</h2>
        </motion.div>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.0 }}
          className="glass-effect rounded-xl p-4 shadow-xl h-96 flex items-center justify-center"
        >
          <p className="text-gray-700 text-lg">🚧 แผนที่กำลังจะมาเร็วๆ นี้! 🚧</p>
          {/* TODO: Embed OpenStreetMap or allow user to request specific map provider */}
        </motion.div>
      </section>
    </motion.div>
  );
};

export default ContactPage;