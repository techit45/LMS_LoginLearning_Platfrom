import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Users as UsersIcon,
} from "lucide-react";

const Footer = () => {
  const companyInfo = {
    name: "Login Learning",
    description:
      "แพลตฟอร์มเสริมทักษะและค้นหาตัวตนของน้องมัธยม ต้น-ปลาย เพื่อตัดสินใจเข้าเรียนต่อในระดับมัธยมปลาย/มหาวิทยาลัย",
    address: "917 จรัญสนิทวงศ์ 75 บางพลัด บางพลัด",
    contacts: [
      { name: "พี่ก้อง", phone: "090-969-9578" },
      { name: "พี่เก็ก", phone: "083-436-0294" },
    ],
    lineGroup: "https://line.me/ti/g/TbTTLXEkRS",
    email: "Iretutor01@gmail.com",
  };

  const branches = [
    { name: "สาขาลาดกระบัง", address: "ถนนฉลองกรุง ลาดกระบัง, กรุงเทพฯ 10520" },
    {
      name: "สาขาบางพลัด",
      address: "400 ซ.จรัญสนิทวงศ์ 75 แขวงบางพลัด, กรุงเทพฯ 10700",
    },
    { name: "สาขาศรีราชา", address: "165/31 อำเภอศรีราชา ชลบุรี 20110" },
    { name: "สาขาระยอง", address: "84/48 อำเภอเมืองระยอง ระยอง 21000" },
  ];

  return (
    <footer className="py-12 px-6 border-t border-slate-200 bg-slate-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-700 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-800" />
              </div>
              <span className="text-2xl font-bold text-black">
                {companyInfo.name}
              </span>
            </Link>
            <p className="text-black opacity-80 leading-relaxed mb-4">
              {companyInfo.description}
            </p>
            <div className="flex items-start space-x-2 text-black mb-2">
              <MapPin className="w-5 h-5 mt-1 text-blue-600 shrink-0" />
              <span>{companyInfo.address}</span>
            </div>
            <div className="flex items-center space-x-2 text-black mb-2">
              <Mail className="w-5 h-5 text-blue-600 shrink-0" />
              <a
                href={`mailto:${companyInfo.email}`}
                className="hover:text-blue-700 transition-colors"
              >
                {companyInfo.email}
              </a>
            </div>
            {companyInfo.contacts.map((contact) => (
              <div
                key={contact.name}
                className="flex items-center space-x-2 text-black mb-1"
              >
                <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  {contact.name}: {contact.phone}
                </span>
              </div>
            ))}
            <div className="flex items-center space-x-2 text-black mt-2">
              <UsersIcon className="w-5 h-5 text-blue-600 shrink-0" />
              <a
                href={companyInfo.lineGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-700 transition-colors"
              >
                Line Group
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-black font-semibold mb-4 text-lg">
              สาขาที่เปิดบริการ
            </h3>
            <ul className="space-y-3">
              {branches.map((branch) => (
                <li key={branch.name}>
                  <p className="font-medium text-black">{branch.name}</p>
                  <p className="text-black text-sm">{branch.address}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-black font-semibold mb-4 text-lg">ลิงก์ด่วน</h3>
            <ul className="space-y-2 text-black">
              <li>
                <Link
                  to="/courses"
                  className="hover:text-blue-700 transition-colors"
                >
                  คอร์สเรียนทั้งหมด
                </Link>
              </li>
              <li>
                <Link
                  to="/admissions"
                  className="hover:text-blue-700 transition-colors"
                >
                  ข้อมูลการรับเข้ามหาวิทยาลัย
                </Link>
              </li>
              <li>
                <Link
                  to="/about#services"
                  className="hover:text-blue-700 transition-colors"
                >
                  บริการและกิจกรรม
                </Link>
              </li>
              <li>
                <Link
                  to="/about#projects"
                  className="hover:text-blue-700 transition-colors"
                >
                  ตัวอย่างโครงงาน
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-blue-700 transition-colors"
                >
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-black font-semibold mb-4 text-lg">ติดตามเรา</h3>
            <ul className="space-y-2 text-black">
              <li>
                <a
                  href="https://www.facebook.com/loginlearning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700 transition-colors"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/loginlearning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700 transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/channel/loginlearning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700 transition-colors"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href={companyInfo.lineGroup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700 transition-colors"
                >
                  Line Official
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-300 mt-8 pt-8 text-center">
          <p className="text-black">
            © {new Date().getFullYear()} {companyInfo.name}.
            สงวนลิขสิทธิ์ทั้งหมด.
          </p>
          <p className="text-xs text-black mt-1">
            ข้อมูลในเว็บไซต์นี้เป็นข้อมูลเบื้องต้นและอาจมีการเปลี่ยนแปลง
            โปรดตรวจสอบข้อมูลล่าสุดจากประกาศอย่างเป็นทางการ
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
