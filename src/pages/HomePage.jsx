import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Award,
  Star,
  Clock,
  Target,
  TrendingUp,
  Lightbulb,
  Cpu,
  Cog,
  CircuitBoard,
  Rocket,
  Building2,
  FlaskConical,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getFeaturedCourses } from "@/lib/courseService";
import { getFeaturedProjects } from "@/lib/projectService";
import { getEmergencyData } from "@/lib/quickFix";
import SEOHead from "@/components/SEOHead";
import CourseSlider from "@/components/CourseSlider";
import ProjectSlider from "@/components/ProjectSlider";
import TestimonialSlider from "@/components/TestimonialSlider";

const testimonials = [
  {
    id: 1,
    name: "น้องเอิร์ธ",
    avatar: "/images/profile.png",
    rating: 5,
    text: "คอร์สนี้สุดยอดมากครับ! ผมได้เรียนรู้เกี่ยวกับการเขียนโปรแกรมหุ่นยนต์ตั้งแต่พื้นฐานจนสร้างโปรเจกต์ของตัวเองได้เลย พี่ๆ ใจดีและสอนสนุกมากครับ",
    course: "วิศวกรรมหุ่นยนต์เบื้องต้น",
  },
  {
    id: 2,
    name: "น้องมายด์",
    avatar: "/images/profile.png",
    rating: 5,
    text: "ตอนแรกไม่คิดว่าจะชอบวิศวะโยธา แต่พอได้ลองทำโปรเจกต์สร้างสะพานจำลองแล้วสนุกกว่าที่คิดไว้เยอะเลยค่ะ ได้ความรู้ไปใช้ในห้องเรียนด้วย",
    course: "โครงสร้างพื้นฐานสำหรับวิศวกรน้อย",
  },
  {
    id: 3,
    name: "น้องเจมส์",
    avatar: "/images/profile.png",
    rating: 4,
    text: "เนื้อหาเข้มข้นดีครับ ได้เรียนรู้การใช้เครื่องมือจริงๆ ที่พี่วิศวกรเค้าใช้กัน ตอนนี้ผมรู้แล้วว่าอยากเรียนต่อวิศวะคอมฯ ครับ",
    course: "เจาะลึก IoT",
  },
  {
    id: 4,
    name: "น้องฟ้า",
    avatar: "/images/profile.png",
    rating: 5,
    text: "เป็นคอร์สที่เปิดโลกมากค่ะ ไม่เคยคิดว่าวิศวกรรมเคมีจะเกี่ยวกับเรื่องใกล้ตัวขนาดนี้ ได้ทดลองทำจริงทุกขั้นตอนเลย",
    course: "มหัศจรรย์วิศวกรรมเคมี",
  },
];

const HomePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [hoveredField, setHoveredField] = useState(null);

  // Engineering Fields Data
  const engineeringFields = [
    {
      id: 'computer',
      name: 'คอมพิวเตอร์',
      icon: Cpu,
      color: 'from-blue-600 to-cyan-600',
      description: 'AI, Machine Learning, Software Development'
    },
    {
      id: 'mechanical',
      name: 'เครื่องกล',
      icon: Cog,
      color: 'from-blue-700 to-indigo-700',
      description: 'หุ่นยนต์, การออกแบบ, Manufacturing'
    },
    {
      id: 'electrical',
      name: 'ไฟฟ้า',
      icon: CircuitBoard,
      color: 'from-blue-800 to-purple-700',
      description: 'Electronics, Power Systems, IoT'
    },
    {
      id: 'civil',
      name: 'โยธา',
      icon: Building2,
      color: 'from-indigo-600 to-blue-800',
      description: 'สถาปัตยกรรม, โครงสร้าง, การก่อสร้าง'
    },
    {
      id: 'chemical',
      name: 'เคมี',
      icon: FlaskConical,
      color: 'from-cyan-600 to-blue-700',
      description: 'Process Engineering, Materials, Environment'
    },
    {
      id: 'aerospace',
      name: 'การบิน', 
      icon: Rocket,
      color: 'from-blue-500 to-indigo-600',
      description: 'อากาศยาน, Spacecraft, Aerodynamics'
    }
  ];

  // Helper function to format text with line breaks
  const formatTextWithLineBreaks = (text) => {
    if (!text) return "";
    return text.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  useEffect(() => {
    const loadFeaturedCourses = async () => {
      try {
        const { data, error } = await getFeaturedCourses();
        if (error) {
          console.error("Error loading featured courses:", error);
          toast({
            title: "ไม่สามารถโหลดคอร์สแนะนำได้",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setFeaturedCourses(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadFeaturedProjects = async () => {
      try {
        // Use shorter timeout for better UX (5 seconds instead of 8)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Projects loading timeout")), 5000);
        });

        const { data, error } = await Promise.race([
          getFeaturedProjects(),
          timeoutPromise,
        ]);

        if (error) {
          // Only log timeout errors, not regular database errors
          if (error.message === "Projects loading timeout") {
            console.log("⏱️ Projects loading timeout - using fallback data");
          }
          // Use emergency data instead of showing error
          const emergencyData = getEmergencyData();
          setFeaturedProjects(emergencyData.projects);
        } else {
          setFeaturedProjects(data || []);
        }
      } catch (error) {
        // Only log meaningful errors, not expected timeouts
        if (error.message !== "Projects loading timeout") {
          console.warn("Projects fallback:", error.message);
        }
        // Use emergency data on any error
        const emergencyData = getEmergencyData();
        setFeaturedProjects(emergencyData.projects);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadFeaturedCourses();
    loadFeaturedProjects();
  }, [toast]);

  const handleFeatureClick = (featureName = "ฟีเจอร์นี้") => {
    const encouragingMessages = [
      "แต่ไม่ต้องกังวล! เรากำลังทำงานหนักเพื่อนำเสนอฟีเจอร์ที่ดีที่สุดให้คุณ",
      "ขณะนี้เรากำลังพัฒนาฟีเจอร์นี้ให้มีประสิทธิภาพสูงสุด",
      "เรากำลังเตรียมฟีเจอร์นี้ให้พร้อมใช้งานในเร็วๆ นี้",
      "ทีมพัฒนากำลังทำงานเพื่อให้ฟีเจอร์นี้สมบูรณ์แบบ",
    ];

    const randomMessage =
      encouragingMessages[
        Math.floor(Math.random() * encouragingMessages.length)
      ];

    toast({
      title: `🚧 ${featureName}ยังไม่พร้อมใช้งาน`,
      description: `${randomMessage} 🚀\n\nคุณสามารถติดต่อเราได้ที่หน้า "ติดต่อเรา" หากต้องการข้อมูลเพิ่มเติม`,
      duration: 5000,
    });
  };

  const stats = [
    { icon: Users, value: "100+", label: "นักเรียน" },
    { icon: BookOpen, value: "10+", label: "คอร์สเรียน" },
    { icon: Award, value: "90%", label: "อัตราสำเร็จ" },
    { icon: Star, value: "4.8", label: "คะแนนเฉลี่ย" },
  ];

  return (
    <div className="relative overflow-hidden">
      <SEOHead
        title="Login Learning - เรียนวิศวกรรมออนไลน์สำหรับน้องๆ"
        description="สำรวจโลกวิศวกรรมผ่านคอร์สออนไลน์ที่ออกแบบมาเพื่อน้องๆ มัธยม พร้อมโปรเจกต์จริงและพี่เลี้ยงผู้เชี่ยวชาญ"
        useProfileImage={true}
        url="/"
        type="website"
      />

      {/* Simple Gradient Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
        
        {/* Simple Circuit Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='0' cy='0' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>

      <div className="pt-24 relative z-10">{/* Adjusted padding top to account for fixed navbar */}
        {/* Hero Section */}
        <section className="pt-8 pb-16 px-6 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                {/* Logo */}
                <div className="flex items-center space-x-6 mb-12">
                  <div className="w-24 h-24 bg-white rounded-3xl p-3 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
                    <img 
                      src="./Logo.png" 
                      alt="Login Learning Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Login Learning</h2>
                    <p className="text-blue-200 text-lg">Engineering Education Platform</p>
                  </div>
                </div>

                <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-white">
                  เสริมทักษะ
                  <span className="block bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                    วิศวกรรม
                  </span>
                  <span className="text-4xl lg:text-5xl block mt-4 text-blue-200 font-semibold">
                    ค้นหาตัวตนที่แท้จริง
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-3xl">
                  Login Learning ช่วยน้องมัธยมค้นพบศักยภาพและความชอบด้านวิศวกรรม
                  เพื่อการตัดสินใจเลือกเส้นทางอนาคตอย่างมั่นใจ
                </p>
                
                {/* Additional Info Cards */}
                <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">15,000+</p>
                        <p className="text-blue-200 text-sm">นักเรียน</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">4.9/5</p>
                        <p className="text-blue-200 text-sm">คะแนน</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xl px-10 py-8 shadow-2xl hover:shadow-cyan-500/30 transform hover:scale-105 transition-all duration-300 rounded-2xl"
                  >
                    <Link to={user ? "/dashboard" : "/signup"}>
                      <Rocket className="w-6 h-6 mr-3" />
                      {user ? "ไปที่แดชบอร์ด" : "เริ่มเรียนฟรี"}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-300 hover:text-white text-xl px-10 py-8 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-cyan-400/25"
                  >
                    <Link to="/courses">
                      ดูคอร์สทั้งหมด
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column - 3D Isometric Engineering Fields */}
              <div className="relative">
                {/* Enhanced Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* Floating Geometric Shapes */}
                  <div className="absolute top-20 left-10 w-24 h-24 border border-white/10 rounded-2xl transform rotate-12" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
                  <div className="absolute top-40 right-20 w-16 h-16 border border-cyan-400/20 rounded-full" style={{ animation: 'float 6s ease-in-out infinite 2s' }}></div>
                  <div className="absolute bottom-32 left-20 w-20 h-20 border border-blue-400/15 rounded-lg transform -rotate-12" style={{ animation: 'float 10s ease-in-out infinite 1s' }}></div>
                  <div className="absolute bottom-20 right-10 w-12 h-12 border border-white/20 rounded-full" style={{ animation: 'float 7s ease-in-out infinite 3s' }}></div>
                  
                  {/* Animated Grid Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M30,0 L30,60 M0,30 L60,30'/%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '60px 60px',
                      animation: 'float 15s ease-in-out infinite'
                    }} />
                  </div>
                  
                  {/* Tech Particles */}
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={`tech-particle-${i}`}
                      className="absolute w-1 h-1 bg-cyan-400/40 rounded-full"
                      style={{
                        left: `${10 + (i * 8)}%`,
                        top: `${20 + (i % 4) * 20}%`,
                        animation: `float 5s ease-in-out infinite ${i * 0.5}s`
                      }}
                    />
                  ))}
                </div>
                
                {/* 3D Isometric Container */}
                <div className="relative h-[600px] lg:h-[700px] z-10 mx-auto max-w-2xl perspective-1000" style={{ perspective: '1200px' }}>
                  {/* SIMPLE CENTER LOGO - GUARANTEED TO SHOW */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 9999 }}>
                    {/* Simple but Beautiful Center Logo */}
                    <div className="w-40 h-40 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-3xl flex flex-col items-center justify-center shadow-2xl border-4 border-white/30" style={{
                      animation: 'float 4s ease-in-out infinite, logo-glow 3s ease-in-out infinite'
                    }}>
                      {/* Logo Image */}
                      <div className="w-20 h-20 mb-2 flex items-center justify-center">
                        <img 
                          src="/Logo.png" 
                          alt="Login Learning Logo" 
                          className="w-full h-full object-contain"
                          style={{
                            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8)) drop-shadow(0 0 20px rgba(6, 182, 212, 0.6))'
                          }}
                          onError={(e) => {
                            // Fallback to emoji if image fails
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="text-6xl text-white hidden" style={{
                          filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))'
                        }}>
                          🎓
                        </div>
                      </div>
                      
                      {/* Logo Text */}
                      <div className="text-center text-white">
                        <div className="text-xl font-black tracking-wider mb-1" style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                        }}>
                          LOGIN
                        </div>
                        <div className="text-sm font-bold opacity-90" style={{
                          textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                        }}>
                          LEARNING
                        </div>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" style={{
                        animation: 'bounce 2s infinite'
                      }}></div>
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full animate-ping" style={{
                        animation: 'ping 2s infinite'
                      }}></div>
                    </div>
                    
                    {/* Label Below */}
                    <div className="text-center mt-6 text-white font-bold text-lg" style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}>
                      🏛️ Learning Hub ⚡
                    </div>
                  </div>

                  {/* 3D Floating Engineering Field Cards */}
                  {engineeringFields.map((field, index) => {
                    // Calculate 3D isometric positions around the center - Expanded
                    const positions = [
                      { x: 50, y: 15, z: 0 },    // Top center
                      { x: 80, y: 30, z: -10 },  // Top right  
                      { x: 80, y: 70, z: -20 },  // Bottom right
                      { x: 50, y: 85, z: -10 },  // Bottom center
                      { x: 20, y: 70, z: -20 },  // Bottom left
                      { x: 20, y: 30, z: -10 }   // Top left
                    ];
                    
                    const position = positions[index] || positions[0];
                    const dropDelay = index * 0.5;
                    
                    return (
                      <div
                        key={field.id}
                        className={`absolute w-32 h-32 rounded-2xl bg-gradient-to-br ${field.color} flex flex-col items-center justify-center shadow-2xl cursor-pointer group transition-all duration-500`}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: `translate(-50%, -50%) rotateX(10deg) rotateY(-10deg) translateZ(${position.z}px)`,
                          transformStyle: 'preserve-3d',
                          animation: `drop-in 1s ease-out ${dropDelay}s both, float-3d 4s ease-in-out infinite ${dropDelay}s`,
                          filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.3))',
                          zIndex: hoveredField === field.id ? 98000 : 50 + index
                        }}
                        onMouseEnter={() => setHoveredField(field.id)}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        {/* 3D Card Face - Enhanced */}
                        <div className="w-full h-full bg-gradient-to-br from-white/25 to-transparent rounded-2xl absolute inset-0" style={{
                          transform: 'translateZ(2px)',
                          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
                        }}></div>
                        
                        <field.icon className="w-12 h-12 text-white group-hover:scale-125 transition-transform mb-2 relative z-10" style={{
                          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
                        }} />
                        <span className="text-white text-sm font-bold opacity-90 group-hover:opacity-100 transition-opacity text-center relative z-10" style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                        }}>
                          {field.name}
                        </span>
                      
                        {/* 3D Isometric Tooltip */}
                        {hoveredField === field.id && (
                          <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 tooltip-container" style={{
                            transform: 'translate(-50%, 0) rotateX(5deg) rotateY(-5deg)',
                            transformStyle: 'preserve-3d',
                            zIndex: 99999
                          }}>
                            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/30 min-w-64" style={{
                              filter: 'drop-shadow(8px 8px 16px rgba(0,0,0,0.3))'
                            }}>
                              <div className="text-center">
                                <h4 className="font-bold text-gray-900 mb-2 text-lg">วิศวกรรม{field.name}</h4>
                                <p className="text-gray-700 leading-relaxed text-sm">{field.description}</p>
                                
                                {/* 3D Mini Icons */}
                                <div className="mt-3 flex justify-center space-x-3">
                                  {['คอร์ส', 'โปรเจกต์', 'อาชีพ'].map((branch, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${field.color} flex items-center justify-center mb-1 shadow-lg`} style={{
                                        transform: `rotateX(10deg) rotateY(-10deg)`,
                                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                                      }}>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                      </div>
                                      <span className="text-xs text-gray-600 font-medium">{branch}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 3D Arrow */}
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-l border-t border-white/30" style={{
                                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
                              }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  
                  {/* Enhanced 3D Connection Beams */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-70">
                    {engineeringFields.map((field, index) => {
                      const positions = [
                        { x: 50, y: 15 }, { x: 80, y: 30 }, { x: 80, y: 70 },
                        { x: 50, y: 85 }, { x: 20, y: 70 }, { x: 20, y: 30 }
                      ];
                      const pos = positions[index] || positions[0];
                      
                      return (
                        <g key={`beam-${field.id}`}>
                          {/* 3D Connection Beam */}
                          <line
                            x1="50%"
                            y1="50%"
                            x2={`${pos.x}%`}
                            y2={`${pos.y}%`}
                            stroke="url(#beam-gradient)"
                            strokeWidth="3"
                            filter="url(#glow)"
                            opacity={hoveredField === field.id ? 1 : 0.3}
                            style={{
                              transition: 'opacity 0.3s ease',
                              filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))'
                            }}
                          />
                          
                          {/* Energy Orb - Larger */}
                          <circle
                            cx={`${pos.x}%`}
                            cy={`${pos.y}%`}
                            r="5"
                            fill="rgba(6, 182, 212, 0.9)"
                            className="animate-pulse"
                            style={{
                              filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))'
                            }}
                          />
                        </g>
                      );
                    })}
                    
                    {/* Enhanced Gradient Definitions */}
                    <defs>
                      <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(6, 182, 212, 0.9)" />
                        <stop offset="50%" stopColor="rgba(59, 130, 246, 0.7)" />
                        <stop offset="100%" stopColor="rgba(6, 182, 212, 0.3)" />
                      </linearGradient>
                      
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Interactive Stats Section */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                สถิติที่น่าประทับใจ
              </h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                ตัวเลขที่พิสูจน์คุณภาพการศึกษาวิศวกรรมของเรา
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500 border border-white/20 cursor-pointer transform hover:scale-110 hover:-translate-y-2"
                  style={{
                    animation: `float 4s ease-in-out infinite ${index * 0.5}s`
                  }}
                >
                  {/* Glowing Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                  
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500">
                      <stat.icon className="w-10 h-10 text-white group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    
                    <h3 className="text-4xl lg:text-5xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                      {stat.value}
                    </h3>
                    
                    <p className="text-blue-200 font-medium group-hover:text-white transition-colors duration-300">
                      {stat.label}
                    </p>
                    
                    {/* Interactive particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${10 + i * 20}%`,
                            animation: `float 2s ease-in-out infinite ${i * 0.5}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Interactive Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-32 h-32 border border-white/10 rounded-full"
                  style={{
                    left: `${10 + i * 20}%`,
                    top: `${20 + (i % 2) * 40}%`,
                    animation: `float 6s ease-in-out infinite ${i * 1}s`
                  }}
                />
              ))}
            </div>
          </div>
        </section>
        {/* Featured Engineering Courses */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                คอร์สเรียนแนะนำ
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                คัดสรรคอร์สคุณภาพเพื่อจุดประกายความสนใจด้านวิศวกรรมในตัวคุณ
              </p>
            </div>

            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดคอร์สแนะนำ...</p>
              </div>
            ) : featuredCourses.length > 0 ? (
              <CourseSlider courses={featuredCourses} autoplay={true} />
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 max-w-md mx-auto border border-blue-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    ยังไม่มีคอร์สแนะนำ
                  </h3>
                  <p className="text-gray-600 mb-6">
                    ผู้ดูแลระบบยังไม่ได้เลือกคอร์สแนะนำ
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
                  >
                    <Link to="/courses">ดูคอร์สทั้งหมด</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center mt-12">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 text-lg px-8 py-4 backdrop-blur-sm"
              >
                <Link to="/courses">
                  ดูคอร์สทั้งหมด
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        {/* Featured Projects Section */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                โครงงานติดดาว
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                ผลงานโดดเด่นจากน้องๆ นักเรียนที่สร้างสรรค์โครงงานสุดเจ๋ง
                พร้อมแรงบันดาลใจสำหรับคุณ
              </p>
            </div>

            {projectsLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดโครงงานติดดาว...</p>
              </div>
            ) : featuredProjects.length > 0 ? (
              <ProjectSlider projects={featuredProjects} autoplay={true} />
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-12 max-w-md mx-auto border border-indigo-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    ยังไม่มีโครงงานติดดาว
                  </h3>
                  <p className="text-gray-600 mb-6">
                    โครงงานเด่นจากน้องๆ จะแสดงที่นี่
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
                  >
                    <Link to="/projects">ดูโครงงานทั้งหมด</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center mt-12">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 text-lg px-8 py-4 backdrop-blur-sm"
              >
                <Link to="/projects">
                  ดูโครงงานทั้งหมด
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        {/* Interactive Features Section */}
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mb-6 shadow-lg">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                ทำไมต้องเลือก Login Learning?
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                เราให้มากกว่าการเรียนรู้ เราสร้างวิศวกรรุ่นใหม่ที่พร้อมสำหรับอนาคต
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "เรียนรู้จากโปรเจกต์จริง",
                  description: "ฝึกฝนกับโครงงานที่ใช้งานได้จริงในอุตสาหกรรมและมหาวิทยาลัย",
                  gradient: "from-red-500 to-pink-500",
                  delay: "0s"
                },
                {
                  icon: Users,
                  title: "พี่เลี้ยงผู้เชี่ยวชาญ",
                  description: "เรียนกับพี่วิศวกรและผู้มีประสบการณ์ตรง คอยให้คำแนะนำใกล้ชิด",
                  gradient: "from-green-500 to-emerald-500",
                  delay: "0.5s"
                },
                {
                  icon: TrendingUp,
                  title: "ค้นพบตัวเองและวางแผน",
                  description: "ช่วยน้องๆ ค้นหาความถนัดและวางแผนเส้นทางสู่วิศวะฯ อย่างชัดเจน",
                  gradient: "from-purple-500 to-indigo-500",
                  delay: "1s"
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/15 transition-all duration-700 cursor-pointer border border-white/20 transform hover:scale-105 hover:-translate-y-4"
                  onClick={handleFeatureClick}
                  style={{
                    animation: `float 5s ease-in-out infinite ${feature.delay}`
                  }}
                >
                  {/* Interactive Background Glow */}
                  <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-30 transition-all duration-700 blur-xl`}></div>
                  
                  <div className="relative">
                    {/* Icon with Special Effects */}
                    <div className="relative mb-8">
                      <div className={`w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:rotate-12`}>
                        <feature.icon className="w-12 h-12 text-white group-hover:scale-125 transition-transform duration-300" />
                      </div>
                      
                      {/* Orbiting Elements */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`absolute w-3 h-3 bg-gradient-to-r ${feature.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            style={{
                              left: '50%',
                              top: '50%',
                              transformOrigin: '0 0',
                              transform: `rotate(${i * 120}deg) translateX(50px)`,
                              animation: `spin 3s linear infinite ${i * 0.3}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-blue-100 leading-relaxed group-hover:text-white transition-colors duration-300">
                      {feature.description}
                    </p>
                    
                    {/* Interactive Click Indicator */}
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="inline-flex items-center text-cyan-300 text-sm font-medium">
                        <span>คลิกเพื่อเรียนรู้เพิ่มเติม</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Interactive Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 left-20 w-64 h-64 border border-white/5 rounded-full" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/5 rounded-full" style={{ animation: 'float 10s ease-in-out infinite 2s' }}></div>
              <div className="absolute top-1/2 left-10 w-32 h-32 border border-white/5 rounded-full" style={{ animation: 'float 6s ease-in-out infinite 1s' }}></div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-20 px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mb-8 shadow-lg">
                <Rocket className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                พร้อมค้นหาเส้นทางวิศวะฯ ของคุณแล้วหรือยัง?
              </h2>
              
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                เข้าร่วมกับเพื่อนๆ อีกกว่า <span className="font-bold text-cyan-300">15,000 คน</span> ที่ Login Learning
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-6 shadow-lg"
                >
                  <Link to={user ? "/dashboard" : "/signup"}>
                    <Rocket className="w-5 h-5 mr-2" />
                    {user ? "ไปที่แดชบอร์ด" : "เริ่มเรียนฟรีวันนี้"}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg px-8 py-6 backdrop-blur-sm"
                >
                  <Link to="/contact">
                    <Users className="w-5 h-5 mr-2" />
                    ปรึกษาพี่ๆ ผู้เชี่ยวชาญ
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
