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
    'string.min': 'ชื่อต้องมีอย่างน้อย 3 ตัว���ักษร',
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
  project_url: Joi.string().trim().uri().required().messages({
    'string.empty': 'กรุณากรอกลิงก์โครงงาน',
    'string.uri': 'รูปแบบลิงก์ไม่ถูกต้���ง',
    'any.required': 'กรุณากรอกลิงก์โครงงาน'
  })
});
