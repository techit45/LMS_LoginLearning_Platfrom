import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.empty': 'กรุณากรอกอีเมล',
    'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'any.required': 'กรุณากรอกอีเมล'
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'กรุณากรอกรหัสผ่าน',
    'string.min': 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    'any.required': 'กรุณากรอกรหัสผ่าน'
  })
});

export const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(3).required().messages({
    'string.empty': 'กรุณากรอกชื่อ-นามสกุล',
    'string.min': 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อ-นามสกุล'
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.empty': 'กรุณากรอกอีเมล',
    'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'any.required': 'กรุณากรอกอีเมล'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'กรุณากรอกรหัสผ่าน',
      'string.min': 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      'string.pattern.base': 'รหัสผ่านต้องมีตัวพิมพ์เล็ก, พิมพ์ใหญ่, และตัวเลข',
      'any.required': 'กรุณากรอกรหัสผ่าน'
    })
});

export const courseSchema = Joi.object({
  title: Joi.string().trim().min(5).required().messages({
    'string.empty': 'กรุณากรอกชื่อคอร์ส',
    'string.min': 'ชื่อคอร์สต้องมีอย่างน้อย 5 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อคอร์ส'
  }),
  description: Joi.string().trim().min(20).required().messages({
    'string.empty': 'กรุณากรอกคำอธิบายคอร์ส',
    'string.min': 'คำอธิบายต้องมีอย่างน้อย 20 ตัวอักษร',
    'any.required': 'กรุณากรอกคำอธิบายคอร์ส'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'กรุณาเลือกหมวดหมู่',
    'any.required': 'กรุณาเลือกหมวดหมู่'
  }),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner').messages({
    'any.only': 'ระดับความยากต้องเป็น beginner, intermediate, หรือ advanced'
  }),
  duration_hours: Joi.number().integer().min(1).required().messages({
    'number.base': 'ระยะเวลาต้องเป็นตัวเลข',
    'number.integer': 'ระยะเวลาต้องเป็นจำนวนเต็ม',
    'number.min': 'ระยะเวลาต้องมากกว่า 0 ชั่วโมง',
    'any.required': 'กรุณากรอกระยะเวลาของคอร์ส'
  }),
  price: Joi.number().min(0).default(0).messages({
    'number.base': 'ราคาต้องเป็นตัวเลข',
    'number.min': 'ราคาต้องไม่น้อยกว่า 0'
  }),
  max_students: Joi.number().integer().min(1).required().messages({
    'number.base': 'จำนวนนักเรียนต้องเป็นตัวเลข',
    'number.integer': 'จำนวนนักเรียนต้องเป็นจำนวนเต็ม',
    'number.min': 'จำนวนนักเรียนต้องมากกว่า 0',
    'any.required': 'กรุณากรอกจำนวนนักเรียนสูงสุด'
  }),
  is_active: Joi.boolean().default(true),
  is_featured: Joi.boolean().default(false),
  thumbnail_url: Joi.string().uri({ allowRelative: true }).allow('', null).messages({
    'string.uri': 'URL รูปภาพไม่ถูกต้อง'
  }),
  instructor_name: Joi.string().allow('', null),
  instructor_email: Joi.string().email({ tlds: { allow: false } }).allow('', null).messages({
    'string.email': 'รูปแบบอีเมลผู้สอนไม่ถูกต้อง'
  })
});

export const projectSchema = Joi.object({
  title: Joi.string().trim().min(5).required().messages({
    'string.empty': 'กรุณากรอกชื่อโครงงาน',
    'string.min': 'ชื่อโครงงานต้องมีอย่างน้อย 5 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อโครงงาน'
  }),
  description: Joi.string().trim().min(20).required().messages({
    'string.empty': 'กรุณากรอกคำอธิบายโครงงาน',
    'string.min': 'คำอธิบายต้องมีอย่างน้อย 20 ตัวอักษร',
    'any.required': 'กรุณากรอกคำอธิบายโครงงาน'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'กรุณาเลือกหมวดหมู่',
    'any.required': 'กรุณาเลือกหมวดหมู่'
  }),
  short_description: Joi.string().allow('', null),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
  demo_url: Joi.string().trim().uri({ allowRelative: true }).allow('', null).messages({
    'string.uri': 'รูปแบบลิงก์โครงงานไม่ถูกต้อง'
  }),
  github_url: Joi.string().trim().uri({ allowRelative: true }).allow('', null).messages({
    'string.uri': 'รูปแบบลิงก์ GitHub ไม่ถูกต้อง'
  }),
  thumbnail_url: Joi.string().allow('', null),
  technologies: Joi.array().items(Joi.string()).default([]),
  tags: Joi.array().items(Joi.string()).default([]),
  is_featured: Joi.boolean().default(false)
});