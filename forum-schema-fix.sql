-- แก้ไข RLS policies ใน forum schema ให้ใช้ instructor_name แทน instructor_id

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Users can view categories for enrolled courses" ON forum_categories;
DROP POLICY IF EXISTS "Instructors can manage categories for their courses" ON forum_categories;
DROP POLICY IF EXISTS "Users can view topics for enrolled courses" ON forum_topics;
DROP POLICY IF EXISTS "Enrolled users can create topics" ON forum_topics;
DROP POLICY IF EXISTS "Authors can update their own topics" ON forum_topics;
DROP POLICY IF EXISTS "Instructors can moderate topics in their courses" ON forum_topics;
DROP POLICY IF EXISTS "Users can view replies for accessible topics" ON forum_replies;
DROP POLICY IF EXISTS "Enrolled users can create replies" ON forum_replies;

-- สร้าง policies ใหม่ที่ไม่ใช้ instructor_id
CREATE POLICY "Users can view categories for enrolled courses" ON forum_categories
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can manage categories for their courses" ON forum_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_role IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Users can view topics for enrolled courses" ON forum_topics
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Enrolled users can create topics" ON forum_topics
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Authors can update their own topics" ON forum_topics
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Instructors can moderate topics" ON forum_topics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_role IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Users can view replies for accessible topics" ON forum_replies
    FOR SELECT USING (
        topic_id IN (
            SELECT id FROM forum_topics WHERE
            course_id IN (
                SELECT course_id FROM enrollments 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Enrolled users can create replies" ON forum_replies
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        topic_id IN (
            SELECT id FROM forum_topics WHERE
            course_id IN (
                SELECT course_id FROM enrollments 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ลบ trigger เก่าและสร้างใหม่
DROP TRIGGER IF EXISTS trigger_create_default_forum_categories ON courses;
DROP FUNCTION IF EXISTS create_default_forum_categories();

-- Function ใหม่ที่ไม่ใช้ instructor_id
CREATE OR REPLACE FUNCTION create_default_forum_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default categories for new course
    INSERT INTO forum_categories (course_id, name, description, display_order) VALUES
    (NEW.id, 'การสนทนาทั่วไป', 'พูดคุยเกี่ยวกับคอร์สและแบ่งปันประสบการณ์', 1),
    (NEW.id, 'คำถามและตอบ', 'ถามคำถามเกี่ยวกับเนื้อหาและรับความช่วยเหลือ', 2),
    (NEW.id, 'การบ้านและแบบฝึกหัด', 'หารือเกี่ยวกับงานที่มอบหมาย', 3),
    (NEW.id, 'ประกาศจากผู้สอน', 'ข้อมูลสำคัญจากผู้สอน', 4);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger ใหม่
CREATE TRIGGER trigger_create_default_forum_categories
    AFTER INSERT ON courses
    FOR EACH ROW
    EXECUTE FUNCTION create_default_forum_categories();

SELECT 'Forum RLS policies updated successfully!' as message;