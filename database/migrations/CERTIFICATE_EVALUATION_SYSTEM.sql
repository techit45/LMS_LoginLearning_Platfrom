-- =====================================================
-- CERTIFICATE & EVALUATION SYSTEM MIGRATION
-- ระบบประเมินผลและใบประกาศนียบัตร
-- =====================================================
-- 📝 Run this in Supabase SQL Editor
-- 🎯 Purpose: Add evaluation and certificate management system
-- ⚠️  Run AFTER main schema is created

BEGIN;

-- ==========================================
-- EVALUATION SYSTEM TABLES
-- ==========================================

-- แบบฟอร์มประเมิน
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pre_test', 'post_test', 'satisfaction', 'knowledge')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- คำถามในแบบประเมิน
CREATE TABLE IF NOT EXISTS evaluation_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'rating', 'text', 'yes_no', 'checkbox')),
    options JSONB DEFAULT '{}'::jsonb,
    is_required BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- คำตอบจากนักเรียน (Submissions)
CREATE TABLE IF NOT EXISTS evaluation_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    UNIQUE(evaluation_id, student_id)
);

-- คำตอบแต่ละข้อ
CREATE TABLE IF NOT EXISTS evaluation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES evaluation_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES evaluation_questions(id) ON DELETE CASCADE,
    response_value TEXT,
    response_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CERTIFICATE SYSTEM TABLES
-- ==========================================

-- เทมเพลตใบเซอร์
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    background_url TEXT,
    layout_config JSONB DEFAULT '{}'::jsonb,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    company_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- คำขอใบเซอร์
CREATE TABLE IF NOT EXISTS certificate_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,

    -- ข้อมูลนักเรียน
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    additional_info JSONB DEFAULT '{}'::jsonb,

    -- สถานะ
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued')),

    -- ไฟล์ที่สร้าง
    certificate_url TEXT,
    certificate_number TEXT UNIQUE,

    -- Approval
    reviewed_by UUID REFERENCES user_profiles(user_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Evaluation Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_course_id ON evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(type);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluation_questions_evaluation_id ON evaluation_questions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_questions_display_order ON evaluation_questions(display_order);

CREATE INDEX IF NOT EXISTS idx_evaluation_submissions_evaluation_id ON evaluation_submissions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_submissions_student_id ON evaluation_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_submissions_submitted_at ON evaluation_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluation_responses_submission_id ON evaluation_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_responses_question_id ON evaluation_responses(question_id);

-- Certificate Indexes
CREATE INDEX IF NOT EXISTS idx_certificate_templates_course_id ON certificate_templates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_is_active ON certificate_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_certificate_submissions_student_id ON certificate_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_certificate_submissions_course_id ON certificate_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_certificate_submissions_status ON certificate_submissions(status);
CREATE INDEX IF NOT EXISTS idx_certificate_submissions_certificate_number ON certificate_submissions(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificate_submissions_submitted_at ON certificate_submissions(submitted_at DESC);

-- ==========================================
-- AUTO-UPDATE TRIGGERS
-- ==========================================

-- Evaluations
CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Certificate Templates
CREATE TRIGGER update_certificate_templates_updated_at
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Certificate Submissions
CREATE TRIGGER update_certificate_submissions_updated_at
    BEFORE UPDATE ON certificate_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_submissions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- EVALUATIONS RLS POLICIES
-- ==========================================

-- Anyone can view active evaluations
CREATE POLICY "Anyone can view active evaluations"
ON evaluations FOR SELECT
USING (status = 'active');

-- Admins and instructors can manage all evaluations
CREATE POLICY "Admins can manage evaluations"
ON evaluations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- EVALUATION QUESTIONS RLS POLICIES
-- ==========================================

-- Anyone can view questions from active evaluations
CREATE POLICY "Anyone can view active evaluation questions"
ON evaluation_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM evaluations
        WHERE id = evaluation_questions.evaluation_id
        AND status = 'active'
    )
);

-- Admins and instructors can manage questions
CREATE POLICY "Admins can manage evaluation questions"
ON evaluation_questions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- EVALUATION SUBMISSIONS RLS POLICIES
-- ==========================================

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON evaluation_submissions FOR SELECT
USING (student_id = auth.uid());

-- Students can create submissions
CREATE POLICY "Students can create submissions"
ON evaluation_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON evaluation_submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- EVALUATION RESPONSES RLS POLICIES
-- ==========================================

-- Students can view their own responses
CREATE POLICY "Students can view own responses"
ON evaluation_responses FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM evaluation_submissions
        WHERE id = evaluation_responses.submission_id
        AND student_id = auth.uid()
    )
);

-- Students can create responses
CREATE POLICY "Students can create responses"
ON evaluation_responses FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM evaluation_submissions
        WHERE id = evaluation_responses.submission_id
        AND student_id = auth.uid()
    )
);

-- Admins can view all responses
CREATE POLICY "Admins can view all responses"
ON evaluation_responses FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- CERTIFICATE TEMPLATES RLS POLICIES
-- ==========================================

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates"
ON certificate_templates FOR SELECT
USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
ON certificate_templates FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- CERTIFICATE SUBMISSIONS RLS POLICIES
-- ==========================================

-- Students can view their own certificate submissions
CREATE POLICY "Students can view own certificate submissions"
ON certificate_submissions FOR SELECT
USING (student_id = auth.uid());

-- Students can create certificate requests
CREATE POLICY "Students can create certificate requests"
ON certificate_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Admins can view all certificate submissions
CREATE POLICY "Admins can view all certificate submissions"
ON certificate_submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- Admins can update certificate submissions
CREATE POLICY "Admins can update certificate submissions"
ON certificate_submissions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    cert_number TEXT;
    exists_flag BOOLEAN;
BEGIN
    LOOP
        -- Generate format: CERT-YYYY-XXXXXX (CERT-2025-A1B2C3)
        cert_number := 'CERT-' ||
                      EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::TEXT || '-' ||
                      UPPER(substring(md5(random()::text) from 1 for 6));

        -- Check if this number already exists
        SELECT EXISTS(
            SELECT 1 FROM certificate_submissions
            WHERE certificate_number = cert_number
        ) INTO exists_flag;

        -- Exit loop if number is unique
        EXIT WHEN NOT exists_flag;
    END LOOP;

    RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get evaluation statistics
CREATE OR REPLACE FUNCTION get_evaluation_stats(eval_id UUID)
RETURNS TABLE (
    total_submissions BIGINT,
    average_rating NUMERIC,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT es.id)::BIGINT as total_submissions,
        AVG(CASE
            WHEN eq.question_type = 'rating'
            THEN er.response_value::NUMERIC
            ELSE NULL
        END) as average_rating,
        (COUNT(DISTINCT es.id)::NUMERIC /
            NULLIF((SELECT enrolled_count FROM courses c
                    JOIN evaluations e ON e.course_id = c.id
                    WHERE e.id = eval_id), 0) * 100
        ) as completion_rate
    FROM evaluation_submissions es
    LEFT JOIN evaluation_responses er ON er.submission_id = es.id
    LEFT JOIN evaluation_questions eq ON eq.id = er.question_id
    WHERE es.evaluation_id = eval_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SAMPLE DATA (Optional - for testing)
-- ==========================================

-- Sample Evaluation
DO $$
DECLARE
    eval_id UUID;
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
BEGIN
    -- Insert sample evaluation
    INSERT INTO evaluations (title, description, type, status)
    VALUES (
        'แบบประเมินความพึงพอใจ',
        'ประเมินความพึงพอใจหลังเรียนจบคอร์ส',
        'satisfaction',
        'active'
    )
    RETURNING id INTO eval_id;

    -- Insert sample questions
    INSERT INTO evaluation_questions (
        evaluation_id,
        question_text,
        question_type,
        options,
        display_order
    )
    VALUES
    (
        eval_id,
        'คุณพึงพอใจกับคอร์สนี้มากน้อยเพียงใด?',
        'rating',
        '{"min": 1, "max": 5, "labels": ["น้อยที่สุด", "มากที่สุด"]}'::jsonb,
        1
    ),
    (
        eval_id,
        'คุณจะแนะนำคอร์สนี้ให้เพื่อนหรือไม่?',
        'multiple_choice',
        '{
            "choices": [
                {"id": "1", "text": "แน่นอน"},
                {"id": "2", "text": "อาจจะ"},
                {"id": "3", "text": "ไม่แน่ใจ"},
                {"id": "4", "text": "ไม่"}
            ]
        }'::jsonb,
        2
    ),
    (
        eval_id,
        'ข้อเสนอแนะเพิ่มเติม',
        'text',
        '{}'::jsonb,
        3
    );

    RAISE NOTICE 'Sample evaluation created with ID: %', eval_id;
END $$;

-- Sample Certificate Template
INSERT INTO certificate_templates (
    name,
    description,
    layout_config,
    is_active
)
VALUES (
    'เทมเพลตใบเซอร์มาตรฐาน',
    'เทมเพลตใบเซอร์สำหรับคอร์สทั่วไป',
    '{
        "studentName": {"x": 400, "y": 300, "fontSize": 32, "color": "#000000", "fontFamily": "Sarabun", "align": "center"},
        "courseName": {"x": 400, "y": 350, "fontSize": 24, "color": "#333333", "fontFamily": "Sarabun", "align": "center"},
        "completionDate": {"x": 400, "y": 400, "fontSize": 18, "color": "#666666", "fontFamily": "Sarabun", "align": "center"},
        "certificateNumber": {"x": 100, "y": 50, "fontSize": 14, "color": "#999999", "fontFamily": "Sarabun", "align": "left"}
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Certificate & Evaluation System created successfully!' as status;

-- Show created tables
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'evaluations',
    'evaluation_questions',
    'evaluation_submissions',
    'evaluation_responses',
    'certificate_templates',
    'certificate_submissions'
)
ORDER BY tablename;

-- Show sample data
SELECT
    'Evaluations' as table_name,
    COUNT(*)::TEXT as record_count
FROM evaluations
UNION ALL
SELECT
    'Evaluation Questions',
    COUNT(*)::TEXT
FROM evaluation_questions
UNION ALL
SELECT
    'Certificate Templates',
    COUNT(*)::TEXT
FROM certificate_templates;
