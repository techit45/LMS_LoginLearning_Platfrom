// Quick Fix for Student Loading Issues
import { supabase } from "./supabaseClient";

/**
 * ตรวจสอบการเชื่อมต่อ Supabase และปัญหาการโหลด
 */
export const diagnoseStudentLoadingIssues = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    issues: [],
    recommendations: [],
  };

  console.log("🔍 Diagnosing Student Loading Issues...");

  try {
    // Test 1: Supabase Connection
    console.log("Testing Supabase connection...");
    const startTime = Date.now();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      const connectionTime = Date.now() - startTime;

      results.tests.push({
        name: "Supabase Connection",
        status: authError ? "failed" : "passed",
        time: `${connectionTime}ms`,
        details: authError || "Connection successful",
      });

      if (connectionTime > 3000) {
        results.issues.push("Slow Supabase connection detected");
        results.recommendations.push(
          "Check network connection or Supabase status"
        );
      }
    } catch (error) {
      results.tests.push({
        name: "Supabase Connection",
        status: "failed",
        details: error.message,
      });
      results.issues.push("Cannot connect to Supabase");
    }

    // Test 2: Featured Courses Query
    console.log("Testing featured courses query...");
    const coursesStartTime = Date.now();

    try {
      // Simple query without complex joins
      const { data: courses, error: coursesError } = await Promise.race([
        supabase
          .from("courses")
          .select("id, title, description, is_active, is_featured")
          .eq("is_active", true)
          .limit(3),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 3000)
        ),
      ]);

      const coursesTime = Date.now() - coursesStartTime;

      results.tests.push({
        name: "Featured Courses Query",
        status: coursesError ? "failed" : "passed",
        time: `${coursesTime}ms`,
        count: courses?.length || 0,
        details: coursesError || "Query successful",
      });

      if (coursesTime > 2000) {
        results.issues.push("Slow courses query detected");
        results.recommendations.push(
          "Consider using simpler queries or caching"
        );
      }
    } catch (error) {
      results.tests.push({
        name: "Featured Courses Query",
        status: "failed",
        details: error.message,
      });
      results.issues.push("Cannot load courses data");
    }

    // Test 3: Featured Projects Query
    console.log("Testing featured projects query...");
    const projectsStartTime = Date.now();

    try {
      const { data: projects, error: projectsError } = await Promise.race([
        supabase
          .from("projects")
          .select("id, title, description, is_approved, is_featured")
          .eq("is_approved", true)
          .limit(3),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 3000)
        ),
      ]);

      const projectsTime = Date.now() - projectsStartTime;

      results.tests.push({
        name: "Featured Projects Query",
        status: projectsError ? "failed" : "passed",
        time: `${projectsTime}ms`,
        count: projects?.length || 0,
        details: projectsError || "Query successful",
      });

      if (projectsTime > 2000) {
        results.issues.push("Slow projects query detected");
        results.recommendations.push(
          "Consider using simpler queries or caching"
        );
      }
    } catch (error) {
      results.tests.push({
        name: "Featured Projects Query",
        status: "failed",
        details: error.message,
      });
      results.issues.push("Cannot load projects data");
    }

    // Test 4: RLS Policies
    console.log("Testing RLS policies...");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Test user can read their own profile
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        results.tests.push({
          name: "User Profile Access",
          status: profileError ? "failed" : "passed",
          hasProfile: !!profile,
          role: profile?.role || "unknown",
          details: profileError || "Profile access successful",
        });

        if (!profile) {
          results.issues.push("User profile not found");
          results.recommendations.push(
            "Create user profile or check RLS policies"
          );
        }
      }
    } catch (error) {
      results.tests.push({
        name: "User Profile Access",
        status: "failed",
        details: error.message,
      });
    }
  } catch (error) {
    results.issues.push(`Unexpected error: ${error.message}`);
  }

  // Summary and recommendations
  const failedTests = results.tests.filter((t) => t.status === "failed").length;

  if (failedTests > 0) {
    results.recommendations.push(
      "Check Supabase configuration and RLS policies"
    );
    results.recommendations.push(
      "Verify environment variables are set correctly"
    );
  }

  if (results.issues.length > 0) {
    results.recommendations.push("Use fallback data to prevent blank screens");
    results.recommendations.push(
      "Implement proper error handling and loading states"
    );
  }

  console.log("🎯 Diagnosis Complete:", results);
  return results;
};

/**
 * เรียกข้อมูลแบบเร่งด่วนด้วย fallback data
 */
export const getEmergencyData = () => {
  console.log("🚑 Loading emergency fallback data...");

  return {
    courses: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "React เบื้องต้น - สร้างเว็บแอปพลิเคชัน",
        description:
          "เรียนรู้ React ตั้งแต่พื้นฐานจนสามารถสร้างเว็บแอปพลิเคชันได้ รวมถึง Hooks, State Management และ Component Design",
        short_description: "เรียนรู้ React ตั้งแต่พื้นฐาน",
        category: "การเขียนโปรแกรม",
        level: "beginner",
        price: 0,
        duration_hours: 12,
        thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        instructor_name: "อาจารย์สมชาย วิศวกร",
        instructor_id: "instructor-1",
        enrollment_count: 127,
        rating: 4.8,
        is_active: true,
        is_featured: true,
        created_at: "2024-01-15T08:00:00Z",
        updated_at: "2024-02-01T10:30:00Z",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "วิศวกรรมเคมี - กระบวนการอุตสาหกรรม",
        description:
          "ศึกษาพื้นฐานวิศวกรรมเคมี การออกแบบกระบวนการ การควบคุมคุณภาพ และการประยุกต์ใช้ในอุตสาหกรรม",
        short_description: "พื้นฐานวิศวกรรมเคมีและกระบวนการอุตสาหกรรม",
        category: "วิศวกรรม",
        level: "intermediate",
        price: 1500,
        duration_hours: 18,
        thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        instructor_name: "ดร.สุดา เคมีวิทย์",
        instructor_id: "instructor-2",
        enrollment_count: 89,
        rating: 4.6,
        is_active: true,
        is_featured: true,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-25T14:15:00Z",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        title: "IoT และการประยุกต์ในชีวิตประจำวัน",
        description:
          "เรียนรู้ Internet of Things ตั้งแต่พื้นฐาน การเชื่อมต่ออุปกรณ์ การใช้งาน Arduino, ESP32 และการสร้างระบบ Smart Home",
        short_description: "Internet of Things พื้นฐานและการประยุกต์",
        category: "เทคโนโลยี",
        level: "intermediate",
        price: 2000,
        duration_hours: 24,
        thumbnail_url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400",
        instructor_name: "อาจารย์วิชัย ไอโอที",
        instructor_id: "instructor-3",
        enrollment_count: 156,
        rating: 4.9,
        is_active: true,
        is_featured: true,
        created_at: "2024-01-20T10:00:00Z",
        updated_at: "2024-02-05T16:45:00Z",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        title: "Python สำหรับวิทยาศาสตร์ข้อมูล",
        description:
          "เรียนรู้การใช้ Python ในการวิเคราะห์ข้อมูล Machine Learning และ Data Visualization ด้วย Pandas, NumPy และ Matplotlib",
        short_description: "Python สำหรับ Data Science และ Machine Learning",
        category: "การเขียนโปรแกรม",
        level: "intermediate",
        price: 2500,
        duration_hours: 20,
        thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        instructor_name: "ดร.อนุชา ข้อมูลวิทย์",
        instructor_id: "instructor-4",
        enrollment_count: 203,
        rating: 4.7,
        is_active: true,
        is_featured: false,
        created_at: "2024-01-05T11:00:00Z",
        updated_at: "2024-01-30T13:20:00Z",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        title: "การออกแบบ 3D ด้วย Fusion 360",
        description:
          "เรียนรู้การออกแบบชิ้นงาน 3D การจำลองการทำงาน และการเตรียมไฟล์สำหรับการพิมพ์ 3D และการผลิต",
        short_description: "การออกแบบ 3D และการจำลองการทำงาน",
        category: "การออกแบบ",
        level: "beginner",
        price: 1800,
        duration_hours: 16,
        thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        instructor_name: "อาจารย์ประยุทธ ออกแบบ",
        instructor_id: "instructor-5",
        enrollment_count: 94,
        rating: 4.5,
        is_active: true,
        is_featured: false,
        created_at: "2024-01-12T08:30:00Z",
        updated_at: "2024-01-28T15:10:00Z",
      },
    ],
    projects: [
      {
        id: "emergency-project-1",
        title: "ระบบรดน้ำอัตโนมัติด้วย IoT",
        description:
          "โครงงาน IoT ระบบรดน้ำต้นไม้อัตโนมัติที่สามารถควบคุมผ่านแอปพลิเคชันมือถือ พร้อมระบบตรวจสอบความชื้นในดินและการแจ้งเตือน",
        short_description: "ระบบรดน้ำอัตโนมัติควบคุมผ่านมือถือ",
        category: "IoT",
        technology: ["Arduino", "ESP32", "React Native"],
        difficulty_level: "intermediate",
        thumbnail_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"],
        demo_url: "https://example.com/demo1",
        github_url: "https://github.com/example/auto-watering",
        creator_id: "student-1",
        creator_name: "นายสมชาย ใจดี",
        view_count: 342,
        like_count: 67,
        tags: ["IoT", "Arduino", "Smart Garden", "Automation"],
        is_featured: true,
        is_approved: true,
        created_at: "2024-01-18T14:20:00Z",
        updated_at: "2024-02-02T09:15:00Z",
      },
      {
        id: "emergency-project-2",
        title: "AI จำแนกขยะด้วย Computer Vision",
        description:
          "ระบบ AI สำหรับจำแนกประเภทขยะโดยใช้ Computer Vision และ Machine Learning เพื่อช่วยในการคัดแยกขยะอัตโนมัติ",
        short_description: "ระบบ AI จำแนกขยะอัตโนมัติ",
        category: "AI/ML",
        technology: ["Python", "TensorFlow", "OpenCV"],
        difficulty_level: "advanced",
        thumbnail_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
        images: ["https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400"],
        demo_url: "https://example.com/demo2",
        github_url: "https://github.com/example/ai-waste-classifier",
        creator_id: "student-2",
        creator_name: "นางสาวสุดา เก่งมาก",
        view_count: 578,
        like_count: 123,
        tags: ["AI", "Machine Learning", "Computer Vision", "Environment"],
        is_featured: true,
        is_approved: true,
        created_at: "2024-01-22T16:45:00Z",
        updated_at: "2024-02-06T11:30:00Z",
      },
      {
        id: "emergency-project-3",
        title: "ฟาร์มไฮโดรโปนิกอัจฉริยะ",
        description:
          "ระบบควบคุมฟาร์มไฮโดรโปนิกอัตโนมัติ ตรวจสอบค่า pH, EC, อุณหภูมิ และแสง พร้อมระบบแจ้งเตือนและควบคุมผ่านเว็บแอปพลิเคชัน",
        short_description: "ฟาร์มไฮโดรโปนิกควบคุมอัตโนมัติ",
        category: "Agriculture Tech",
        technology: ["Arduino", "Sensors", "React", "Node.js"],
        difficulty_level: "intermediate",
        thumbnail_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"],
        demo_url: "https://example.com/demo3",
        github_url: "https://github.com/example/smart-hydroponic",
        creator_id: "student-3",
        creator_name: "นายวิชัย ปลูกผัก",
        view_count: 445,
        like_count: 89,
        tags: ["Hydroponics", "IoT", "Agriculture", "Automation"],
        is_featured: true,
        is_approved: true,
        created_at: "2024-01-25T13:10:00Z",
        updated_at: "2024-02-08T14:25:00Z",
      },
      {
        id: "emergency-project-4",
        title: "แอปพลิเคชันจัดการการเรียน",
        description:
          "แอปพลิเคชันมือถือสำหรับจัดการตารางเรียน การบ้าน และการติดตามผลการเรียน พร้อมระบบแจ้งเตือนและสถิติการเรียน",
        short_description: "แอปจัดการการเรียนสำหรับนักเรียน",
        category: "Mobile App",
        technology: ["React Native", "Firebase", "Node.js"],
        difficulty_level: "intermediate",
        thumbnail_url: "https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=400",
        images: ["https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=400"],
        demo_url: "https://example.com/demo4",
        github_url: "https://github.com/example/student-management-app",
        creator_id: "student-4",
        creator_name: "นางสาวอรุณี เรียนดี",
        view_count: 267,
        like_count: 54,
        tags: ["Mobile App", "Education", "React Native", "Firebase"],
        is_featured: false,
        is_approved: true,
        created_at: "2024-01-28T10:30:00Z",
        updated_at: "2024-02-10T16:40:00Z",
      },
      {
        id: "emergency-project-5",
        title: "ระบบตรวจสอบคุณภาพอากาศ",
        description:
          "เครื่องตรวจสอบคุณภาพอากาศแบบพกพา วัดค่า PM2.5, CO2, อุณหภูมิ และความชื้น พร้อมแสดงผลบนหน้าจอและส่งข้อมูลไปยังแอปพลิเคชัน",
        short_description: "เครื่องตรวจสอบคุณภาพอากาศพกพา",
        category: "Environmental Tech",
        technology: ["Arduino", "Sensors", "Mobile App"],
        difficulty_level: "intermediate",
        thumbnail_url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400",
        images: ["https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400"],
        demo_url: "https://example.com/demo5",
        github_url: "https://github.com/example/air-quality-monitor",
        creator_id: "student-5",
        creator_name: "นายเอกชัย สิ่งแวดล้อม",
        view_count: 389,
        like_count: 76,
        tags: ["Environment", "Air Quality", "IoT", "Health"],
        is_featured: false,
        is_approved: true,
        created_at: "2024-02-01T09:15:00Z",
        updated_at: "2024-02-12T12:50:00Z",
      },
    ],
    // Additional emergency data
    stats: {
      totalCourses: 5,
      totalProjects: 5,
      totalStudents: 1250,
      totalInstructors: 15,
      averageRating: 4.7,
      completionRate: 87,
    },
    testimonials: [
      {
        id: "testimonial-1",
        name: "นายสมชาย ใจดี",
        role: "นักเรียน ม.6",
        message:
          "คอร์สเรียนที่นี่ช่วยให้ผมเข้าใจเทคโนโลยีมากขึ้น และสามารถสร้างโครงงานได้จริง",
        rating: 5,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      },
      {
        id: "testimonial-2",
        name: "นางสาวสุดา เก่งมาก",
        role: "นักเรียน ม.5",
        message: "ครูสอนดีมาก อธิบายง่าย ทำให้เข้าใจการเขียนโปรแกรมได้เร็ว",
        rating: 5,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      },
    ],
    categories: [
      { name: "การเขียนโปรแกรม", count: 2, icon: "code" },
      { name: "วิศวกรรม", count: 1, icon: "cog" },
      { name: "เทคโนโลยี", count: 1, icon: "cpu" },
      { name: "การออกแบบ", count: 1, icon: "palette" },
    ],
  };
};

export default { diagnoseStudentLoadingIssues, getEmergencyData };
