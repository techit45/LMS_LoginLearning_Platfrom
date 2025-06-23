-- ==========================================
-- LEARNING KITS E-COMMERCE SYSTEM
-- ระบบขายชุดการเรียนรู้สำหรับคอร์สเรียน
-- ==========================================

-- 1. LEARNING KITS TABLE
-- ตารางหลักสำหรับชุดการเรียนรู้
CREATE TABLE IF NOT EXISTS learning_kits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- ข้อมูลพื้นฐาน
    kit_name VARCHAR(255) NOT NULL,
    kit_description TEXT,
    kit_type VARCHAR(50) CHECK (kit_type IN ('hardware', 'software', 'mixed', 'materials')),
    
    -- ข้อมูลราคา
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    original_price DECIMAL(10,2), -- ราคาเดิม (สำหรับส่วนลด)
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- ข้อมูลสินค้า
    sku VARCHAR(100) UNIQUE, -- รหัสสินค้า
    weight_grams INTEGER DEFAULT 0,
    dimensions_cm VARCHAR(50), -- เช่น "20x15x5"
    
    -- สถานะและการจัดการ
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_digital BOOLEAN DEFAULT false, -- สินค้าดิจิทัล (เช่น ซอฟต์แวร์)
    requires_shipping BOOLEAN DEFAULT true,
    
    -- ข้อมูลการจัดส่ง
    shipping_methods JSONB DEFAULT '[]'::jsonb, -- วิธีการจัดส่งที่รองรับ
    estimated_delivery_days INTEGER DEFAULT 7,
    
    -- ข้อมูลการแสดงผล
    featured_image_url TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb, -- รูปภาพเพิ่มเติม
    video_url TEXT, -- วิดีโอแนะนำสินค้า
    
    -- ข้อมูลเพิ่มเติม
    specifications JSONB DEFAULT '{}'::jsonb, -- ข้อมูลสเปค
    included_items JSONB DEFAULT '[]'::jsonb, -- รายการสิ่งที่อยู่ในชุด
    requirements TEXT, -- ข้อกำหนดหรือข้อแนะนำ
    warranty_months INTEGER DEFAULT 12,
    
    -- การจัดอันดับ
    display_order INTEGER DEFAULT 0,
    popularity_score INTEGER DEFAULT 0,
    
    -- วันที่
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. KIT CATEGORIES TABLE
-- หมวดหมู่ของชุดการเรียนรู้
CREATE TABLE IF NOT EXISTS kit_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50), -- ชื่อไอคอน
    color_hex VARCHAR(7), -- สีประจำหมวดหมู่
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KIT CATEGORY MAPPINGS
-- เชื่อมโยงชุดการเรียนรู้กับหมวดหมู่
CREATE TABLE IF NOT EXISTS learning_kit_categories (
    kit_id UUID REFERENCES learning_kits(id) ON DELETE CASCADE,
    category_id UUID REFERENCES kit_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (kit_id, category_id)
);

-- 4. KIT REVIEWS TABLE
-- รีวิวและคะแนนของชุดการเรียนรู้
CREATE TABLE IF NOT EXISTS kit_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kit_id UUID REFERENCES learning_kits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_content TEXT,
    
    -- ข้อมูลเพิ่มเติม
    pros TEXT[], -- ข้อดี
    cons TEXT[], -- ข้อเสีย
    recommended BOOLEAN DEFAULT true,
    verified_purchase BOOLEAN DEFAULT false,
    
    -- การโต้ตอบ
    helpful_count INTEGER DEFAULT 0,
    reply_content TEXT, -- การตอบกลับจากผู้ขาย
    reply_at TIMESTAMPTZ,
    
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(kit_id, user_id) -- หนึ่งคนรีวิวได้ครั้งเดียวต่อสินค้า
);

-- 5. KIT ORDERS TABLE
-- ใบสั่งซื้อชุดการเรียนรู้
CREATE TABLE IF NOT EXISTS kit_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ข้อมูลการสั่งซื้อ
    order_number VARCHAR(50) UNIQUE NOT NULL, -- เลขที่ใบสั่งซื้อ
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (
        order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    ),
    
    -- ข้อมูลราคา
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- ข้อมูลการจัดส่ง
    shipping_address JSONB NOT NULL, -- ที่อยู่จัดส่ง
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    estimated_delivery TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- ข้อมูลการชำระเงิน
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial_refund')
    ),
    paid_at TIMESTAMPTZ,
    
    -- หมายเหตุ
    customer_notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. KIT ORDER ITEMS TABLE
-- รายการสินค้าในใบสั่งซื้อ
CREATE TABLE IF NOT EXISTS kit_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES kit_orders(id) ON DELETE CASCADE,
    kit_id UUID REFERENCES learning_kits(id) ON DELETE RESTRICT,
    
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- ข้อมูล snapshot ณ เวลาที่สั่งซื้อ
    kit_name VARCHAR(255) NOT NULL,
    kit_sku VARCHAR(100),
    kit_image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. KIT WISHLIST TABLE
-- รายการสิ่งที่อยากได้ของผู้ใช้
CREATE TABLE IF NOT EXISTS kit_wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kit_id UUID REFERENCES learning_kits(id) ON DELETE CASCADE,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    UNIQUE(user_id, kit_id)
);

-- 8. KIT DISCOUNTS TABLE
-- ส่วนลดและโปรโมชั่น
CREATE TABLE IF NOT EXISTS kit_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    code VARCHAR(50) UNIQUE, -- รหัสส่วนลด
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- ประเภทส่วนลด
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    
    -- เงื่อนไข
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER, -- จำนวนครั้งที่ใช้ได้
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    
    -- กลุ่มเป้าหมาย
    applicable_kit_ids JSONB DEFAULT '[]'::jsonb,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    applicable_courses JSONB DEFAULT '[]'::jsonb,
    
    -- ช่วงเวลา
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 9. KIT INVENTORY LOGS
-- บันทึกการเปลี่ยนแปลงสต๊อก
CREATE TABLE IF NOT EXISTS kit_inventory_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kit_id UUID REFERENCES learning_kits(id) ON DELETE CASCADE,
    
    change_type VARCHAR(20) CHECK (change_type IN ('restock', 'sale', 'adjustment', 'damage', 'return')),
    quantity_change INTEGER NOT NULL, -- +/- จำนวน
    quantity_after INTEGER NOT NULL,
    
    reason TEXT,
    reference_order_id UUID REFERENCES kit_orders(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Learning kits indexes
CREATE INDEX IF NOT EXISTS idx_learning_kits_course_id ON learning_kits(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_kits_available ON learning_kits(is_available, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_learning_kits_price ON learning_kits(price);
CREATE INDEX IF NOT EXISTS idx_learning_kits_popularity ON learning_kits(popularity_score DESC);

-- Kit reviews indexes
CREATE INDEX IF NOT EXISTS idx_kit_reviews_kit_id ON kit_reviews(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_reviews_rating ON kit_reviews(kit_id, rating DESC);

-- Kit orders indexes
CREATE INDEX IF NOT EXISTS idx_kit_orders_user_id ON kit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_kit_orders_status ON kit_orders(order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kit_orders_date ON kit_orders(created_at DESC);

-- Kit order items indexes
CREATE INDEX IF NOT EXISTS idx_kit_order_items_order_id ON kit_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_kit_order_items_kit_id ON kit_order_items(kit_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_kit_wishlist_user_id ON kit_wishlist(user_id);

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert sample kit categories
INSERT INTO kit_categories (name, description, icon_name, color_hex, display_order) VALUES
('Arduino & Microcontrollers', 'ชุดบอร์ดและอุปกรณ์ควบคุม', 'Microchip', '#FF6B35', 1),
('Sensors & Components', 'เซ็นเซอร์และอุปกรณ์อิเล็กทรอนิกส์', 'Gauge', '#F7931E', 2),
('Tools & Equipment', 'เครื่องมือและอุปกรณ์การทำงาน', 'Wrench', '#FFD23F', 3),
('3D Printing', 'อุปกรณ์และวัสดุพิมพ์ 3 มิติ', 'Box', '#06FFA5', 4),
('Software Licenses', 'ลิขสิทธิ์ซอฟต์แวร์', 'Download', '#118AB2', 5),
('Books & Materials', 'หนังสือและเอกสารการเรียน', 'BookOpen', '#073B4C', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert sample learning kits (เชื่อมกับคอร์ส Arduino)
INSERT INTO learning_kits (
    course_id, kit_name, kit_description, kit_type, price, original_price,
    sku, weight_grams, stock_quantity, featured_image_url,
    included_items, specifications, requirements
) 
SELECT 
    c.id,
    'Arduino Automation Starter Kit',
    'ชุดเริ่มต้นสำหรับการเรียนรู้ Arduino Automation พร้อมบอร์ด Arduino UNO และอุปกรณ์ครบชุด',
    'hardware',
    2890.00,
    3500.00,
    'ARD-AUTO-001',
    850,
    25,
    '/api/placeholder/400/300',
    '[
        "Arduino UNO R3 Board",
        "Breadboard 400 points",
        "LED Set (5 colors x 3 pcs)",
        "Resistors Kit (220Ω, 1kΩ, 10kΩ)",
        "Push Buttons (5 pcs)",
        "Jumper Wires (M-M, M-F, F-F)",
        "Servo Motor SG90",
        "Ultrasonic Sensor HC-SR04",
        "Temperature Sensor DS18B20",
        "Relay Module 5V",
        "USB Cable",
        "Manual & Code Examples"
    ]'::jsonb,
    '{
        "board": "Arduino UNO R3",
        "voltage": "5V",
        "components": "12 items",
        "difficulty": "beginner",
        "projects": "8 example projects"
    }'::jsonb,
    'ไม่จำเป็นต้องมีพื้นฐานการเขียนโปรแกรม แต่ควรมีความสนใจในด้านอิเล็กทรอนิกส์'
FROM courses c 
WHERE c.title LIKE '%Arduino%' 
LIMIT 1
ON CONFLICT (sku) DO NOTHING;

-- ==========================================
-- VIEWS FOR ANALYTICS
-- ==========================================

-- สถิติการขายชุดการเรียนรู้
CREATE OR REPLACE VIEW kit_sales_stats AS
SELECT 
    lk.id,
    lk.kit_name,
    lk.price,
    COUNT(DISTINCT ko.id) as total_orders,
    SUM(koi.quantity) as total_units_sold,
    SUM(koi.total_price) as total_revenue,
    AVG(kr.rating) as average_rating,
    COUNT(DISTINCT kr.id) as review_count
FROM learning_kits lk
LEFT JOIN kit_order_items koi ON lk.id = koi.kit_id
LEFT JOIN kit_orders ko ON koi.order_id = ko.id AND ko.order_status = 'delivered'
LEFT JOIN kit_reviews kr ON lk.id = kr.kit_id AND kr.is_approved = true
GROUP BY lk.id, lk.kit_name, lk.price;

-- สถิติการขายตามคอร์ส
CREATE OR REPLACE VIEW course_kit_performance AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(DISTINCT lk.id) as available_kits,
    COUNT(DISTINCT ko.id) as total_kit_orders,
    SUM(ko.total_amount) as total_kit_revenue,
    AVG(ko.total_amount) as average_order_value
FROM courses c
LEFT JOIN learning_kits lk ON c.id = lk.course_id AND lk.is_available = true
LEFT JOIN kit_order_items koi ON lk.id = koi.kit_id
LEFT JOIN kit_orders ko ON koi.order_id = ko.id AND ko.order_status = 'delivered'
GROUP BY c.id, c.title;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- ✅ ระบบขายชุดการเรียนรู้ถูกสร้างเรียบร้อยแล้ว!
-- 
-- ฟีเจอร์ที่รวมอยู่:
-- 🛍️ จัดการสินค้า (Learning Kits) 
-- 📂 หมวดหมู่สินค้า
-- ⭐ รีวิวและคะแนน
-- 🛒 ระบบสั่งซื้อและการชำระเงิน
-- 📦 การจัดส่งและติดตาม
-- ❤️ รายการที่ถูกใจ (Wishlist)
-- 🎟️ ส่วนลดและโปรโมชั่น
-- 📊 การจัดการสต๊อกสินค้า
-- 📈 รายงานและสถิติ
--
-- พร้อมสำหรับการพัฒนาในอนาคต! 🚀