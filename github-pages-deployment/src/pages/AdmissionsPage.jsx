import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { School, Book, Edit3, TrendingUp, Target, Users, DollarSign, FileText, Globe, ExternalLink, ChevronDown, ChevronUp, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdmissionsPage = () => {
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (facultyIndex, uniIndex) => {
    const key = `${facultyIndex}-${uniIndex}`;
    setExpandedCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const admissionData = [
    {
      faculty: "คณะวิศวกรรมศาสตร์ (หลักสูตรไทย)",
      icon: School,
      subtitle: "ข้อมูลเบื้องต้นรอบ Portfolio (โปรดตรวจสอบประกาศล่าสุดจากมหาวิทยาลัย)",
      universities: [
        {
          name: "จุฬาลงกรณ์มหาวิทยาลัย",
          shortName: "จุฬาฯ",
          logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Logo_of_Chulalongkorn_University.svg/1200px-Logo_of_Chulalongkorn_University.svg.png",
          fallbackLogo: "https://placehold.co/60x60/005A9C/FFFFFF?text=CU&font=bold",
          gpax: "≥ 3.00-3.50",
          exams: "TPAT3, TGAT",
          intake: "~600-700 คน",
          fee: "~21,000 บาท/เทอม",
          website: "https://www.eng.chula.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ จุฬาฯ",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.50, Portfolio ผลงานเด่น, TPAT3",
            "วิศวกรรมไฟฟ้า: GPAX ≥ 3.25, Portfolio, TPAT3"
          ],
          portfolioRounds: "~327 คน",
          quotaRounds: "~38 คน",
          admissionRounds: "~240 คน"
        },
        {
          name: "มหาวิทยาลัยเกษตรศาสตร์",
          shortName: "เกษตรฯ",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png",
          fallbackLogo: "https://placehold.co/60x60/D4A017/FFFFFF?text=KU&font=bold",
          gpax: "≥ 2.75-3.25",
          exams: "TPAT3, TGAT",
          intake: "~1400+ คน",
          fee: "~17,000 บาท/เทอม",
          website: "https://www.eng.ku.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ เกษตรฯ",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.25, Portfolio",
            "วิศวกรรมการบินและอวกาศ: GPAX ≥ 3.00, Portfolio"
          ],
          portfolioRounds: "~791 คน",
          quotaRounds: "~181 คน",
          admissionRounds: "~390 คน"
        },
        {
          name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
          shortName: "มจธ.",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/7/76/Seal_of_King_Mongkut%27s_University_of_Technology_Thonburi.svg/1200px-Seal_of_King_Mongkut%27s_University_of_Technology_Thonburi.svg.png",
          fallbackLogo: "https://placehold.co/60x60/F28500/FFFFFF?text=KMUTT&font=bold",
          gpax: "≥ 2.75-3.00",
          exams: "TGAT, TPAT3 (บางโครงการ)",
          intake: "~900+ คน",
          fee: "~25,000 บาท/เทอม",
          website: "https://eng.kmutt.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ มจธ.",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.00, Portfolio"
          ],
          portfolioRounds: "~725 คน",
          quotaRounds: "~170 คน",
          admissionRounds: "~63 คน"
        },
        {
          name: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
          shortName: "สจล.",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/e/e4/Seal_of_King_Mongkut%27s_Institute_of_Technology_Ladkrabang.svg/1200px-Seal_of_King_Mongkut%27s_Institute_of_Technology_Ladkrabang.svg.png",
          fallbackLogo: "https://placehold.co/60x60/E36414/FFFFFF?text=KMITL&font=bold",
          gpax: "≥ 2.75",
          exams: "TPAT3, TGAT",
          intake: "~600+ คน",
          fee: "~20,000 บาท/เทอม",
          website: "https://www.reg.kmitl.ac.th/index/faculty_engineer.php",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ สจล.",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.00, Portfolio"
          ],
          portfolioRounds: "~200 คน",
          quotaRounds: "~54 คน",
          admissionRounds: "~403 คน"
        },
        {
          name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
          shortName: "มจพ.",
          logo: "https://www.eng.kmutnb.ac.th/wp-content/uploads/2019/08/LOGO-KMUTNB--300x300.png",
          fallbackLogo: "https://placehold.co/60x60/C00000/FFFFFF?text=KMUTNB&font=bold",
          gpax: "≥ 2.75",
          exams: "TGAT/TPAT (บางโครงการ)",
          intake: "~600+ คน",
          fee: "~18,000 บาท/เทอม",
          website: "https://www.eng.kmutnb.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ มจพ.",
          recommendedMajors: [
            "วิศวกรรมการผลิต: GPAX ≥ 2.75, Portfolio"
          ],
          portfolioRounds: "~371 คน",
          quotaRounds: "~124 คน",
          admissionRounds: "~40 คน"
        },
        {
          name: "มหาวิทยาลัยเชียงใหม่",
          shortName: "มช.",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/d/db/Chiang_Mai_University.svg/1200px-Chiang_Mai_University.svg.png",
          fallbackLogo: "https://placehold.co/60x60/7B1FA2/FFFFFF?text=CMU&font=bold",
          gpax: "≥ 2.75-3.00",
          exams: "TGAT, TPAT3",
          intake: "~1100+ คน",
          fee: "~20,000 บาท/เทอม",
          website: "https://www.eng.cmu.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ มช.",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.00, Portfolio"
          ],
          portfolioRounds: "~352 คน",
          quotaRounds: "~225 คน",
          admissionRounds: "~350 คน"
        },
        {
          name: "มหาวิทยาลัยขอนแก่น",
          shortName: "มข.",
          logo: "https://www.kku.ac.th/wp-content/uploads/2022/01/1.-official-logo-2022-26.png",
          fallbackLogo: "https://placehold.co/60x60/D32F2F/FFFFFF?text=KKU&font=bold",
          gpax: "≥ 2.75",
          exams: "TGAT/TPAT (บางโครงการ)",
          intake: "~600+ คน",
          fee: "~18,000 บาท/เทอม",
          website: "https://eng.kku.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ มข.",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.00, Portfolio"
          ],
          portfolioRounds: "~326 คน",
          quotaRounds: "~152 คน",
          admissionRounds: "~118 คน"
        },
        {
          name: "มหาวิทยาลัยสงขลานครินทร์",
          shortName: "มอ.",
          logo: "https://huso.psu.ac.th/th/wp-content/uploads/2023/04/PSU_Logo_text_Eng_Color_2.png",
          fallbackLogo: "https://placehold.co/60x60/0277BD/FFFFFF?text=PSU&font=bold",
          gpax: "≥ 2.75",
          exams: "TGAT/TPAT (บางโครงการ)",
          intake: "~1000+ คน",
          fee: "~22,000 บาท/เทอม",
          website: "https://www.eng.psu.ac.th/",
          websiteText: "เว็บไซต์คณะวิศวกรรมศาสตร์ มอ.",
          recommendedMajors: [
            "วิศวกรรมคอมพิวเตอร์: GPAX ≥ 3.00, Portfolio"
          ],
          portfolioRounds: "~594 คน",
          quotaRounds: "~210 คน",
          admissionRounds: "~100 คน"
        }
      ]
    },
    {
      faculty: "คณะวิศวกรรมศาสตร์ (หลักสูตรนานาชาติ)",
      icon: Globe,
      subtitle: "ข้อมูลเบื้องต้นรอบ Portfolio (โปรดตรวจสอบประกาศล่าสุดจากมหาวิทยาลัย)",
      universities: [
        {
          name: "จุฬาลงกรณ์มหาวิทยาลัย",
          shortName: "ISE Chula",
          subtitle: "ISE (International School of Engineering)",
          logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Logo_of_Chulalongkorn_University.svg/1200px-Logo_of_Chulalongkorn_University.svg.png",
          fallbackLogo: "https://placehold.co/60x60/005A9C/FFFFFF?text=CU&font=bold",
          requirements: "IELTS: ≥ 6.0, TOEFL iBT: ≥ 80, SAT Math: ≥ 620",
          intake: "~180-200 คน (รวมทุกสาขา)",
          fee: "~84,000 บาท/เทอม",
          website: "https://www.google.com/search?client=safari&rls=en&q=ISE+Chula&ie=UTF-8&oe=UTF-8",
          websiteText: "เว็บไซต์ ISE Chula",
          recommendedMajors: [
            "Aerospace Engineering: GPAX ≥ 3.5, Strong Math/Physics, IELTS ≥ 6.5, SAT Math ≥ 650",
            "Robotics and AI: GPAX ≥ 3.5, Strong Math/Programming, IELTS ≥ 6.5, SAT Math ≥ 650"
          ]
        },
        {
          name: "มหาวิทยาลัยเกษตรศาสตร์",
          shortName: "IUP Kasetsart",
          subtitle: "IUP (International Undergraduate Program)",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png",
          fallbackLogo: "https://placehold.co/60x60/D4A017/FFFFFF?text=KU&font=bold",
          gpax: "≥ 2.75",
          requirements: "IELTS: ≥ 5.5, TOEFL iBT: ≥ 61",
          intake: "~100-150 คน (รวมทุกสาขา)",
          fee: "~70,000 บาท/เทอม",
          website: "https://iup.eng.ku.ac.th",
          websiteText: "เว็บไซต์ IUP Kasetsart",
          recommendedMajors: [
            "Software and Knowledge Engineering: GPAX ≥ 3.00, IELTS ≥ 5.5, Portfolio (เน้น Project ด้าน Software)",
            "Electrical Engineering: GPAX ≥ 2.75, IELTS ≥ 5.5, Portfolio (เน้นความสนใจด้านไฟฟ้า)"
          ]
        },
        {
          name: "มหาวิทยาลัยมหิดล",
          shortName: "Mahidol Eng",
          subtitle: "Faculty of Engineering (International Programs)",
          logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Mahidol_U.png",
          fallbackLogo: "https://placehold.co/60x60/1565C0/FFFFFF?text=MU&font=bold",
          gpax: "≥ 3.00",
          requirements: "IELTS: ≥ 6.0, TOEFL iBT: ≥ 64",
          intake: "~80-120 คน (รวมทุกสาขา)",
          fee: "~90,000 บาท/เทอม",
          website: "https://www.eg.mahidol.ac.th",
          websiteText: "เว็บไซต์ EG Mahidol Inter",
          recommendedMajors: [
            "Biomedical Engineering: GPAX ≥ 3.25, IELTS ≥ 6.0, Portfolio (เน้นชีววิทยา, เคมี)",
            "Computer Engineering: GPAX ≥ 3.00, IELTS ≥ 6.0, Portfolio (เน้น Programming, Math)"
          ]
        },
        {
          name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
          shortName: "SIIE KMUTT",
          subtitle: "SIIE (School of International and Interdisciplinary Engineering)",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/7/76/Seal_of_King_Mongkut%27s_University_of_Technology_Thonburi.svg/1200px-Seal_of_King_Mongkut%27s_University_of_Technology_Thonburi.svg.png",
          fallbackLogo: "https://placehold.co/60x60/F28500/FFFFFF?text=KMUTT&font=bold",
          gpax: "≥ 3.00",
          requirements: "IELTS ≥ 5.5 / TOEFL",
          intake: "~150-200 คน",
          fee: "~80,000 บาท/เทอม",
          website: "https://www.eng.kmitl.ac.th/siie-international-programs/",
          websiteText: "เว็บไซต์ SIIE KMUTT",
          recommendedMajors: [
            "Computer Engineering (Inter): GPAX ≥ 3.00, IELTS ≥ 5.5, Portfolio"
          ]
        },
        {
          name: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
          shortName: "Inter KMITL",
          subtitle: "School of Engineering (International Programs)",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/e/e4/Seal_of_King_Mongkut%27s_Institute_of_Technology_Ladkrabang.svg/1200px-Seal_of_King_Mongkut%27s_Institute_of_Technology_Ladkrabang.svg.png",
          fallbackLogo: "https://placehold.co/60x60/E36414/FFFFFF?text=KMITL&font=bold",
          gpax: "≥ 3.00",
          requirements: "IELTS ≥ 5.5 / TOEFL",
          intake: "~100-150 คน",
          fee: "~75,000 บาท/เทอม",
          website: "https://oia.kmitl.ac.th/oia/international-programs/",
          websiteText: "เว็บไซต์ Inter KMITL",
          recommendedMajors: [
            "Robotics & AI Engineering (Inter): GPAX ≥ 3.00, IELTS ≥ 5.5, Portfolio"
          ]
        }
      ]
    },
    {
      faculty: "คณะวิทยาศาสตร์ (สาขาคอมพิวเตอร์และที่เกี่ยวข้อง)",
      icon: Book,
      subtitle: "ข้อมูลเบื้องต้นรอบ Portfolio (โปรดตรวจสอบประกาศล่าสุดจากมหาวิทยาลัย)",
      universities: [
        {
          name: "จุฬาลงกรณ์มหาวิทยาลัย",
          shortName: "จุฬาฯ วิทยาศาสตร์",
          subtitle: "คณะวิทยาศาสตร์ สาขาวิทยาการคอมพิวเตอร์",
          logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Logo_of_Chulalongkorn_University.svg/1200px-Logo_of_Chulalongkorn_University.svg.png",
          fallbackLogo: "https://placehold.co/60x60/005A9C/FFFFFF?text=CU&font=bold",
          gpax: "≥ 3.25-3.5 (ตามโครงการ)",
          intake: "~20-30 คน",
          fee: "~21,000 บาท/เทอม",
          website: "https://www.chula.ac.th/academic/faculty-of-science/",
          websiteText: "เว็บไซต์คณะวิทยาศาสตร์ จุฬาฯ",
          recommendedMajors: [
            "AI & Machine Learning: GPAX ≥ 3.5, Portfolio (โครงงาน AI/ML), รางวัล สอวน. คอมฯ",
            "Software Development: GPAX ≥ 3.25, Portfolio (ผลงาน Application/Web)"
          ]
        },
        {
          name: "มหาวิทยาลัยเกษตรศาสตร์",
          shortName: "เกษตรฯ วิทยาศาสตร์",
          subtitle: "คณะวิทยาศาสตร์ สาขาวิทยาการคอมพิวเตอร์",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png",
          fallbackLogo: "https://placehold.co/60x60/D4A017/FFFFFF?text=KU&font=bold",
          gpax: "≥ 3.00 (ตามโครงการ)",
          intake: "~30-50 คน",
          fee: "~17,000 บาท/เทอม",
          website: "https://sci.ku.ac.th/web2024/",
          websiteText: "เว็บไซต์คณะวิทยาศาสตร์ เกษตรฯ",
          recommendedMajors: [
            "Data Science: GPAX ≥ 3.00, Portfolio (โครงงานวิเคราะห์ข้อมูล), ความรู้สถิติ/โปรแกรมมิ่ง",
            "Game Development: GPAX ≥ 3.00, Portfolio (ผลงานเกม, Art, Story)"
          ]
        },
        {
          name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
          shortName: "มจธ. วิทยาศาสตร์",
          subtitle: "คณะวิทยาศาสตร์ สาขาวิทยาการคอมพิวเตอร์ (หลักสูตรภาษาอังกฤษ)",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/7/76/Seal_of_King_Mongkut%27s_University_of_Technology_Thonburi.svg/1200px-Seal_of_King_Mongkut%27s_University_of_Technology_Thonburi.svg.png",
          fallbackLogo: "https://placehold.co/60x60/F28500/FFFFFF?text=KMUTT&font=bold",
          gpax: "≥ 3.00",
          requirements: "IELTS ≥ 5.5 / TOEFL iBT ≥ 61",
          intake: "~50 คน",
          fee: "~40,000 บาท/เทอม",
          website: "https://www.kmutt.ac.th/education/curriculum/faculty-of-science/",
          websiteText: "เว็บไซต์คณะวิทยาศาสตร์ มจธ.",
          recommendedMajors: [
            "Computer Science (English Program): เน้นความรู้พื้นฐานและประยุกต์ด้านวิทยาการคอมพิวเตอร์",
            "AI & Data Analytics: พัฒนาทักษะการเขียนโปรแกรม การวิเคราะห์ข้อมูล และ AI"
          ]
        }
      ]
    },
    {
      faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร (ICT)",
      icon: Edit3,
      subtitle: "ข้อมูลเบื้องต้นรอบ Portfolio (โปรดตรวจสอบประกาศล่าสุดจากมหาวิทยาลัย)",
      universities: [
        {
          name: "มหาวิทยาลัยมหิดล",
          shortName: "ICT Mahidol",
          subtitle: "คณะ ICT (หลักสูตรนานาชาติ)",
          logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Mahidol_U.png",
          fallbackLogo: "https://placehold.co/60x60/1565C0/FFFFFF?text=MU&font=bold",
          gpax: "≥ 3.00",
          requirements: "IELTS ≥ 6.0 / TOEFL iBT ≥ 64",
          intake: "~150-200 คน",
          fee: "~60,000 บาท/เทอม",
          website: "https://www.ict.mahidol.ac.th",
          websiteText: "เว็บไซต์ ICT Mahidol",
          recommendedMajors: [
            "Cybersecurity: GPAX ≥ 3.00, IELTS ≥ 6.0, Portfolio (ความสนใจด้านความปลอดภัย)",
            "Data Science (Track): GPAX ≥ 3.25, IELTS ≥ 6.0, Portfolio (โครงงาน Data)"
          ]
        },
        {
          name: "จุฬาลงกรณ์มหาวิทยาลัย",
          shortName: "CEDT Chula",
          subtitle: "วิศวกรรมคอมพิวเตอร์และเทคโนโลยีดิจิทัล (CEDT - Inter)",
          logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Logo_of_Chulalongkorn_University.svg/1200px-Logo_of_Chulalongkorn_University.svg.png",
          fallbackLogo: "https://placehold.co/60x60/005A9C/FFFFFF?text=CU&font=bold",
          gpax: "≥ 3.50",
          requirements: "IELTS ≥ 6.5 / TOEFL iBT ≥ 80, SAT Math ≥ 700",
          intake: "~40-50 คน",
          fee: "~110,000 บาท/เทอม",
          website: "https://www.cp.eng.chula.ac.th/cedt",
          websiteText: "เว็บไซต์ CEDT Chula",
          recommendedMajors: [
            "Digital Technology & Innovation: GPAX ≥ 3.5, IELTS ≥ 6.5, SAT Math ≥ 700, Portfolio (เน้นนวัตกรรม)"
          ]
        },
        {
          name: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
          shortName: "IT KMITL",
          subtitle: "คณะเทคโนโลยีสารสนเทศ (IT KMITL)",
          logo: "https://upload.wikimedia.org/wikipedia/th/thumb/e/e4/Seal_of_King_Mongkut%27s_Institute_of_Technology_Ladkrabang.svg/1200px-Seal_of_King_Mongkut%27s_Institute_of_Technology_Ladkrabang.svg.png",
          fallbackLogo: "https://placehold.co/60x60/E36414/FFFFFF?text=KMITL&font=bold",
          gpax: "≥ 2.75-3.00 (ตามสาขา)",
          intake: "~100-200 คน",
          fee: "~35,000 บาท/เทอม",
          website: "https://www.it.kmitl.ac.th/th/program/",
          websiteText: "เว็บไซต์ IT KMITL",
          recommendedMajors: [
            "เทคโนโลยีสารสนเทศ (IT): GPAX ≥ 2.75, Portfolio",
            "วิทยาการข้อมูล (Data Science): GPAX ≥ 3.00, Portfolio"
          ]
        }
      ]
    }
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

  const cardColors = [
    "from-blue-500 to-indigo-500",
    "from-green-500 to-teal-500",
    "from-purple-500 to-violet-500",
    "from-orange-500 to-red-500",
  ];

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="pt-24 pb-16 px-6">
      <Helmet>
        <title>ข้อมูลการรับเข้ามหาวิทยาลัย - Login Learning</title>
        <meta name="description" content="ข้อมูลการรับเข้าคณะวิศวกรรมศาสตร์และสาขาที่เกี่ยวข้องในมหาวิทยาลัยชั้นนำ สำหรับรอบ Portfolio (ข้อมูลเบื้องต้น)" />
      </Helmet>

      <section className="pt-8 mb-12">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            ข้อมูลการรับเข้า <span className="gradient-text">มหาวิทยาลัย</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            ภาพรวมเกณฑ์การรับสมัครคณะวิศวกรรมศาสตร์และสาขาใกล้เคียงในมหาวิทยาลัยชั้นนำ (ข้อมูลสำหรับรอบ Portfolio และอาจมีการเปลี่ยนแปลง)
          </p>
        </motion.div>

        {admissionData.map((facultyData, facultyIndex) => (
          <motion.div 
            key={facultyIndex}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: facultyIndex * 0.1 + 0.3 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className={`flex items-center mb-6 p-6 rounded-xl bg-gradient-to-r ${cardColors[facultyIndex % cardColors.length]} shadow-lg`}>
              <facultyData.icon className="w-10 h-10 text-white mr-4" />
              <div>
                <h2 className="text-3xl font-bold text-white">{facultyData.faculty}</h2>
                <p className="text-white/90 text-sm mt-1">{facultyData.subtitle}</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facultyData.universities.map((uni, uniIndex) => {
                const cardKey = `${facultyIndex}-${uniIndex}`;
                const isExpanded = expandedCards[cardKey];
                
                return (
                  <motion.div 
                    key={uniIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: uniIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                  >
                    {/* University Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-200">
                      <div className="flex items-center mb-3">
                        <img  
                          className="w-12 h-12 mr-4 rounded-full object-contain bg-white p-1 shadow-sm border-2 border-white" 
                          alt={`โลโก้ ${uni.name}`} 
                          src={uni.logo}
                          onError={(e) => {
                            e.target.src = uni.fallbackLogo;
                          }}
                        />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{uni.shortName}</h3>
                          {uni.subtitle && (
                            <p className="text-blue-600 text-sm font-medium">{uni.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* University Details */}
                    <div className="p-6">
                      <div className="space-y-3 text-sm text-gray-700 mb-4">
                        {uni.gpax && (
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-3 text-blue-500" />
                            <span><strong>GPAX:</strong> {uni.gpax}</span>
                          </div>
                        )}
                        {uni.exams && (
                          <div className="flex items-center">
                            <Edit3 className="w-4 h-4 mr-3 text-green-500" />
                            <span><strong>คะแนนสอบ:</strong> {uni.exams}</span>
                          </div>
                        )}
                        {uni.requirements && (
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-3 text-yellow-500" />
                            <span><strong>คุณสมบัติ:</strong> {uni.requirements}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-3 text-purple-500" />
                          <span><strong>จำนวนรับ:</strong> {uni.intake}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-3 text-red-500" />
                          <span><strong>ค่าเทอม:</strong> {uni.fee}</span>
                        </div>
                      </div>

                      {/* Expandable Recommended Majors */}
                      {uni.recommendedMajors && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleCard(facultyIndex, uniIndex)}
                            className="flex items-center justify-between w-full p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <Award className="w-4 h-4 mr-2 text-indigo-600" />
                              <span className="text-sm font-medium text-indigo-800">สาขายอดฮิตและข้อมูลเพิ่มเติม</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-indigo-600" />
                            )}
                          </button>
                          
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3 p-4 bg-gray-50 rounded-lg"
                            >
                              <h4 className="font-semibold text-gray-800 mb-2">สาขายอดฮิต:</h4>
                              <ul className="space-y-2 text-xs text-gray-700">
                                {uni.recommendedMajors.map((major, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                    <span>{major}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              {/* Portfolio rounds info */}
                              {uni.portfolioRounds && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <h4 className="font-semibold text-gray-800 mb-2">จำนวนรับรอบ Portfolio:</h4>
                                  <div className="text-xs text-gray-700 space-y-1">
                                    <div className="flex items-center">
                                      <Clock className="w-3 h-3 mr-2 text-blue-500" />
                                      <span>รอบ 1 Portfolio: {uni.portfolioRounds}</span>
                                    </div>
                                    {uni.quotaRounds && (
                                      <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-2 text-green-500" />
                                        <span>รอบ 2 Quota: {uni.quotaRounds}</span>
                                      </div>
                                    )}
                                    {uni.admissionRounds && (
                                      <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-2 text-orange-500" />
                                        <span>รอบ 3 Admission: {uni.admissionRounds}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* University Website Button */}
                      {uni.website && (
                        <Button 
                          onClick={() => window.open(uni.website, '_blank', 'noopener,noreferrer')}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {uni.websiteText}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 + admissionData.length * 0.1 }}
          className="mt-12 text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">ข้อควรทราบสำคัญ</h3>
          <p className="text-gray-700 text-sm leading-relaxed max-w-4xl mx-auto">
            ข้อมูลจำนวนรับและเกณฑ์การคัดเลือกอาจมีการเปลี่ยนแปลงในแต่ละปีการศึกษา 
            ควรตรวจสอบข้อมูลล่าสุดจากประกาศอย่างเป็นทางการของ <strong>TCAS</strong> หรือ<strong>มหาวิทยาลัยโดยตรง</strong>เสมอ
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Portfolio</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">GPAX</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">สัมภาษณ์</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">คะแนนสอบ</span>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default AdmissionsPage;