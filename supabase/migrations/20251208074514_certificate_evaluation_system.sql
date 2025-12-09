-- =====================================================
-- CERTIFICATE & EVALUATION SYSTEM MIGRATION
-- #0#0@!4%A%0C#02(5"1#
-- Created: 2025-12-08
-- =====================================================

-- ==========================================
-- EVALUATION SYSTEM TABLES
-- ==========================================

-- A-#L!#0@!4
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

-- 32!CA#0@!4
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

-- 3-21@#5" (Submissions)
CREATE TABLE IF NOT EXISTS evaluation_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    UNIQUE(evaluation_id, student_id)
);

-- 3-AH%0I-
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

-- @!@%C@-#L
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

-- 3-C@-#L
CREATE TABLE IF NOT EXISTS certificate_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    additional_info JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued')),
    certificate_url TEXT,
    certificate_number TEXT UNIQUE,
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

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_submissions_updated_at
    BEFORE UPDATE ON certificate_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_submissions ENABLE ROW LEVEL SECURITY;

-- Evaluations: Anyone can view active, admins manage all
CREATE POLICY "Anyone can view active evaluations"
ON evaluations FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage evaluations"
ON evaluations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- Evaluation Questions: Anyone can view from active evaluations, admins manage
CREATE POLICY "Anyone can view active evaluation questions"
ON evaluation_questions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM evaluations
        WHERE id = evaluation_questions.evaluation_id AND status = 'active'
    )
);

CREATE POLICY "Admins can manage evaluation questions"
ON evaluation_questions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- Evaluation Submissions: Students own data, admins see all
CREATE POLICY "Students can view own submissions"
ON evaluation_submissions FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions"
ON evaluation_submissions FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
ON evaluation_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- Evaluation Responses: Students own data, admins see all
CREATE POLICY "Students can view own responses"
ON evaluation_responses FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM evaluation_submissions
        WHERE id = evaluation_responses.submission_id AND student_id = auth.uid()
    )
);

CREATE POLICY "Students can create responses"
ON evaluation_responses FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM evaluation_submissions
        WHERE id = evaluation_responses.submission_id AND student_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all responses"
ON evaluation_responses FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- Certificate Templates: Anyone can view active, admins manage
CREATE POLICY "Anyone can view active templates"
ON certificate_templates FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON certificate_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- Certificate Submissions: Students own data, admins manage
CREATE POLICY "Students can view own certificate submissions"
ON certificate_submissions FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create certificate requests"
ON certificate_submissions FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can view all certificate submissions"
ON certificate_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

CREATE POLICY "Admins can update certificate submissions"
ON certificate_submissions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Generate unique certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    cert_number TEXT;
    exists_flag BOOLEAN;
BEGIN
    LOOP
        cert_number := 'CERT-' ||
                      EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::TEXT || '-' ||
                      UPPER(substring(md5(random()::text) from 1 for 6));

        SELECT EXISTS(
            SELECT 1 FROM certificate_submissions WHERE certificate_number = cert_number
        ) INTO exists_flag;

        EXIT WHEN NOT exists_flag;
    END LOOP;

    RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Get evaluation statistics
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
-- SAMPLE DATA (for development/testing)
-- ==========================================

-- Sample Evaluation
DO $$
DECLARE
    eval_id UUID;
BEGIN
    INSERT INTO evaluations (title, description, type, status)
    VALUES (
        'A#0@!4'2!6-C',
        '#0@!4'2!6-C+%1@#5"-#L*',
        'satisfaction',
        'active'
    )
    RETURNING id INTO eval_id;

    -- Sample questions
    INSERT INTO evaluation_questions (
        evaluation_id, question_text, question_type, options, display_order
    ) VALUES
    (eval_id, '86-C1-#L*5I!2I-"@5"C?', 'rating',
     '{"min": 1, "max": 5, "labels": ["I-"5H*8", "!25H*8"]}'::jsonb, 1),
    (eval_id, '80A03-#L*5IC+I@7H-+#7-D!H?', 'multiple_choice',
     '{"choices": [{"id": "1", "text": "AH-"}, {"id": "2", "text": "-20"}, {"id": "3", "text": "D!HAHC"}, {"id": "4", "text": "D!H"}]}'::jsonb, 2),
    (eval_id, 'I-@*-A0@4H!@4!', 'text', '{}'::jsonb, 3);
END $$;

-- Sample Certificate Template
INSERT INTO certificate_templates (name, description, layout_config, is_active)
VALUES (
    '@!@%C@-#L!2#2',
    '@!@%C@-#L*3+#1-#L*1H'D',
    '{
        "studentName": {"x": 400, "y": 300, "fontSize": 32, "color": "#000000", "fontFamily": "Sarabun", "align": "center"},
        "courseName": {"x": 400, "y": 350, "fontSize": 24, "color": "#333333", "fontFamily": "Sarabun", "align": "center"},
        "completionDate": {"x": 400, "y": 400, "fontSize": 18, "color": "#666666", "fontFamily": "Sarabun", "align": "center"},
        "certificateNumber": {"x": 100, "y": 50, "fontSize": 14, "color": "#999999", "fontFamily": "Sarabun", "align": "left"}
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;
