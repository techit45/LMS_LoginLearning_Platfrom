// ==========================================
// FEATURE UTILITIES
// ฟังก์ชันสำหรับจัดการฟีเจอร์ที่ยังไม่พร้อมใช้งาน
// ==========================================

/**
 * Feature status and information
 */
const FEATURE_INFO = {
  // Dashboard Features
  การบ้าน: {
    description: "ระบบการบ้านออนไลน์ - ส่งงาน ตรวจงาน และให้คะแนนอัตโนมัติ",
    eta: "2-3 สัปดาห์",
    priority: "สูง",
    category: "การเรียนการสอน",
  },
  แบบทดสอบ: {
    description: "ระบบแบบทดสอบออนไลน์ - คำถามหลากหลายรูปแบบ พร้อมผลคะแนนทันที",
    eta: "1-2 สัปดาห์",
    priority: "สูง",
    category: "การเรียนการสอน",
  },
  ใบประกาศนียบัตร: {
    description: "ระบบออกใบประกาศนียบัตรอัตโนมัติเมื่อจบคอร์ส",
    eta: "3-4 สัปดาห์",
    priority: "ปานกลาง",
    category: "รางวัลและการรับรอง",
  },
  การแจ้งเตือน: {
    description: "ระบบแจ้งเตือนผ่าน Email, LINE และ SMS",
    eta: "2-3 สัปดาห์",
    priority: "ปานกลาง",
    category: "การสื่อสาร",
  },
  รายงานความคืบหน้า: {
    description: "ระบบรายงานสถิติการเรียนแบบละเอียด พร้อมกราฟและแนะนำ",
    eta: "4-5 สัปดาห์",
    priority: "ปานกลาง",
    category: "การวิเคราะห์",
  },

  // Profile Features
  คอร์สเรียนของฉัน: {
    description:
      "ระบบจัดการคอร์สส่วนตัว - แสดงคอร์สที่ลงทะเบียน ความคืบหน้า และใบประกาศนียบัตร",
    eta: "2-3 สัปดาห์",
    priority: "สูง",
    category: "การจัดการส่วนตัว",
  },
  ผลงานของฉัน: {
    description: "ระบบจัดการผลงานส่วนตัว - เก็บโครงงาน การบ้าน และผลงานทั้งหมด",
    eta: "3-4 สัปดาห์",
    priority: "ปานกลาง",
    category: "การจัดการผลงาน",
  },

  // Course Features
  ห้องเรียนออนไลน์: {
    description:
      "ระบบห้องเรียนออนไลน์ - Video Call, Screen Share และ Interactive Whiteboard",
    eta: "6-8 สัปดาห์",
    priority: "สูง",
    category: "การเรียนการสอน",
  },
  การสนทนากลุ่ม: {
    description: "ระบบแชทและฟอรัมสำหรับนักเรียนและอาจารย์",
    eta: "4-5 สัปดาห์",
    priority: "ปานกลาง",
    category: "การสื่อสาร",
  },
  ไลบรารีเนื้อหา: {
    description: "คลังเนื้อหาการเรียน - เอกสาร วิดีโอ และแบบฝึกหัด",
    eta: "5-6 สัปดาห์",
    priority: "ปานกลาง",
    category: "เนื้อหาการเรียน",
  },
};

/**
 * Get feature information
 */
export const getFeatureInfo = (featureName) => {
  return (
    FEATURE_INFO[featureName] || {
      description: "ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา",
      eta: "เร็วๆ นี้",
      priority: "ปานกลาง",
      category: "ทั่วไป",
    }
  );
};

/**
 * Generate enhanced feature feedback message
 */
export const generateFeatureFeedback = (featureName, options = {}) => {
  const info = getFeatureInfo(featureName);
  const {
    showETA = true,
    showPriority = false,
    showCategory = false,
    includeContact = true,
    customMessage = null,
  } = options;

  let description = customMessage || info.description;

  // Add ETA if requested
  if (showETA && info.eta) {
    description += `\n\n⏰ คาดว่าจะเปิดใช้งานภายใน ${info.eta}`;
  }

  // Add priority if requested
  if (showPriority && info.priority) {
    const priorityEmoji =
      info.priority === "สูง"
        ? "🔥"
        : info.priority === "ปานกลาง"
        ? "⭐"
        : "📋";
    description += `\n${priorityEmoji} ความสำคัญ: ${info.priority}`;
  }

  // Add category if requested
  if (showCategory && info.category) {
    description += `\n📂 หมวดหมู่: ${info.category}`;
  }

  // Add contact information if requested
  if (includeContact) {
    description += `\n\n💬 ติดต่อเราได้ที่หน้า "ติดต่อเรา" หากต้องการข้อมูลเพิ่มเติม`;
  }

  return {
    title: `🚧 ฟีเจอร์ "${featureName}" ยังไม่พร้อมใช้งาน`,
    description,
    duration: Math.max(4000, description.length * 50), // Dynamic duration based on content length
  };
};

/**
 * Handle feature click with enhanced feedback
 */
export const handleFeatureClick = (featureName, toast, options = {}) => {
  const feedback = generateFeatureFeedback(featureName, options);

  toast({
    title: feedback.title,
    description: feedback.description,
    duration: feedback.duration,
  });

  // Log for analytics (could be sent to analytics service)
  console.log(`Feature requested: ${featureName}`, {
    timestamp: new Date().toISOString(),
    feature: featureName,
    info: getFeatureInfo(featureName),
  });
};

/**
 * Get all features by category
 */
export const getFeaturesByCategory = () => {
  const categories = {};

  Object.entries(FEATURE_INFO).forEach(([featureName, info]) => {
    const category = info.category || "ทั่วไป";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({
      name: featureName,
      ...info,
    });
  });

  return categories;
};

/**
 * Get features by priority
 */
export const getFeaturesByPriority = (priority = "สูง") => {
  return Object.entries(FEATURE_INFO)
    .filter(([_, info]) => info.priority === priority)
    .map(([featureName, info]) => ({
      name: featureName,
      ...info,
    }));
};

/**
 * Get upcoming features (sorted by ETA)
 */
export const getUpcomingFeatures = () => {
  const etaOrder = {
    "1-2 สัปดาห์": 1,
    "2-3 สัปดาห์": 2,
    "3-4 สัปดาห์": 3,
    "4-5 สัปดาห์": 4,
    "5-6 สัปดาห์": 5,
    "6-8 สัปดาห์": 6,
    "เร็วๆ นี้": 7,
  };

  return Object.entries(FEATURE_INFO)
    .map(([featureName, info]) => ({
      name: featureName,
      ...info,
    }))
    .sort((a, b) => (etaOrder[a.eta] || 999) - (etaOrder[b.eta] || 999));
};

/**
 * Check if feature is available
 */
export const isFeatureAvailable = (featureName) => {
  // For now, all features in FEATURE_INFO are considered unavailable
  // This function can be extended to check against a dynamic feature flag system
  return !FEATURE_INFO.hasOwnProperty(featureName);
};

/**
 * Get encouraging messages for unavailable features
 */
export const getEncouragingMessage = () => {
  const messages = [
    "แต่ไม่ต้องกังวล! เรากำลังทำงานหนักเพื่อนำเสนอฟีเจอร์ที่ดีที่สุดให้คุณ",
    "ขณะนี้เรากำลังพัฒนาฟีเจอร์นี้ให้มีประสิทธิภาพสูงสุด",
    "เรากำลังเตรียมฟีเจอร์นี้ให้พร้อมใช้งานในเร็วๆ นี้",
    "ทีมพัฒนากำลังทำงานเพื่อให้ฟีเจอร์นี้สมบูรณ์แบบ",
    "เรากำลังปรับปรุงฟีเจอร์นี้ให้ตอบโจทย์ความต้องการของคุณ",
    "ฟีเจอร์นี้กำลังผ่านการทดสอบเพื่อให้มั่นใจในคุณภาพ",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

export default {
  getFeatureInfo,
  generateFeatureFeedback,
  handleFeatureClick,
  getFeaturesByCategory,
  getFeaturesByPriority,
  getUpcomingFeatures,
  isFeatureAvailable,
  getEncouragingMessage,
};
