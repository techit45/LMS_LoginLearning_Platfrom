// Custom validation schemas (replacing Joi for browser compatibility)

const createValidationError = (message, path) => ({
  error: { details: [{ message, path }] }
});

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

const validateStrongPassword = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  return password && password.length >= 8 && strongPasswordRegex.test(password);
};

const validateUrl = (url) => {
  if (!url || url === '') return true; // Allow empty
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const loginSchema = {
  validate: (data) => {
    const errors = [];

    if (!data.email) {
      errors.push({ message: 'กรุณากรอกอีเมล', path: ['email'] });
    } else if (!validateEmail(data.email)) {
      errors.push({ message: 'รูปแบบอีเมลไม่ถูกต้อง', path: ['email'] });
    }

    if (!data.password) {
      errors.push({ message: 'กรุณากรอกรหัสผ่าน', path: ['password'] });
    } else if (!validatePassword(data.password)) {
      errors.push({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', path: ['password'] });
    }

    if (errors.length > 0) {
      return { error: { details: errors } };
    }

    return { value: data };
  }
};

export const signupSchema = {
  validate: (data) => {
    const errors = [];

    if (!data.fullName || data.fullName.trim().length < 3) {
      errors.push({ message: 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร', path: ['fullName'] });
    }

    if (!data.email) {
      errors.push({ message: 'กรุณากรอกอีเมล', path: ['email'] });
    } else if (!validateEmail(data.email)) {
      errors.push({ message: 'รูปแบบอีเมลไม่ถูกต้อง', path: ['email'] });
    }

    if (!data.password) {
      errors.push({ message: 'กรุณากรอกรหัสผ่าน', path: ['password'] });
    } else if (!validateStrongPassword(data.password)) {
      errors.push({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์เล็ก, พิมพ์ใหญ่, และตัวเลข', path: ['password'] });
    }

    if (errors.length > 0) {
      return { error: { details: errors } };
    }

    return { value: data };
  }
};

export const courseSchema = {
  validate: (data) => {
    const errors = [];

    if (!data.title || data.title.trim().length < 5) {
      errors.push({ message: 'ชื่อคอร์สต้องมีอย่างน้อย 5 ตัวอักษร', path: ['title'] });
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.push({ message: 'คำอธิบายต้องมีอย่างน้อย 20 ตัวอักษร', path: ['description'] });
    }

    if (!data.category) {
      errors.push({ message: 'กรุณาเลือกหมวดหมู่', path: ['category'] });
    }

    if (data.duration_hours && (isNaN(data.duration_hours) || data.duration_hours < 1)) {
      errors.push({ message: 'ระยะเวลาต้องเป็นตัวเลขมากกว่า 0', path: ['duration_hours'] });
    }

    if (data.max_students && (isNaN(data.max_students) || data.max_students < 1)) {
      errors.push({ message: 'จำนวนนักเรียนต้องเป็นตัวเลขมากกว่า 0', path: ['max_students'] });
    }

    if (data.thumbnail_url && !validateUrl(data.thumbnail_url)) {
      errors.push({ message: 'URL รูปภาพไม่ถูกต้อง', path: ['thumbnail_url'] });
    }

    if (data.instructor_email && !validateEmail(data.instructor_email)) {
      errors.push({ message: 'รูปแบบอีเมลผู้สอนไม่ถูกต้อง', path: ['instructor_email'] });
    }

    if (errors.length > 0) {
      return { error: { details: errors } };
    }

    // Set defaults
    const value = {
      ...data,
      level: data.level || 'beginner',
      price: data.price || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      is_featured: data.is_featured !== undefined ? data.is_featured : false
    };

    return { value };
  }
};

export const projectSchema = {
  validate: (data) => {
    const errors = [];

    if (!data.title || data.title.trim().length < 5) {
      errors.push({ message: 'ชื่อโครงงานต้องมีอย่างน้อย 5 ตัวอักษร', path: ['title'] });
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.push({ message: 'คำอธิบายต้องมีอย่างน้อย 20 ตัวอักษร', path: ['description'] });
    }

    if (!data.category) {
      errors.push({ message: 'กรุณาเลือกหมวดหมู่', path: ['category'] });
    }

    if (data.demo_url && !validateUrl(data.demo_url)) {
      errors.push({ message: 'รูปแบบลิงก์โครงงานไม่ถูกต้อง', path: ['demo_url'] });
    }

    if (data.github_url && !validateUrl(data.github_url)) {
      errors.push({ message: 'รูปแบบลิงก์ GitHub ไม่ถูกต้อง', path: ['github_url'] });
    }

    if (errors.length > 0) {
      return { error: { details: errors } };
    }

    // Set defaults
    const value = {
      ...data,
      difficulty_level: data.difficulty_level || 'beginner',
      technologies: data.technologies || [],
      tags: data.tags || [],
      is_featured: data.is_featured !== undefined ? data.is_featured : false
    };

    return { value };
  }
};

// Password reset schema
export const resetPasswordSchema = {
  validate: (data) => {
    const errors = [];

    if (!data.password) {
      errors.push({ message: 'กรุณากรอกรหัสผ่านใหม่', path: ['password'] });
    } else if (!validateStrongPassword(data.password)) {
      errors.push({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์เล็ก, พิมพ์ใหญ่, และตัวเลข', path: ['password'] });
    }

    if (!data.confirmPassword) {
      errors.push({ message: 'กรุณายืนยันรหัสผ่าน', path: ['confirmPassword'] });
    } else if (data.password !== data.confirmPassword) {
      errors.push({ message: 'รหัสผ่านไม่ตรงกัน', path: ['confirmPassword'] });
    }

    if (errors.length > 0) {
      return { error: { details: errors } };
    }

    return { value: data };
  }
};

// Forgot password schema
export const forgotPasswordSchema = {
  validate: (data) => {
    const errors = [];

    if (!data.email) {
      errors.push({ message: 'กรุณากรอกอีเมล', path: ['email'] });
    } else if (!validateEmail(data.email)) {
      errors.push({ message: 'รูปแบบอีเมลไม่ถูกต้อง', path: ['email'] });
    }

    if (errors.length > 0) {
      return { error: { details: errors } };
    }

    return { value: data };
  }
};