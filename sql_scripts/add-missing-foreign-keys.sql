-- เพิ่ม Foreign Key Constraints ที่ขาดหายไป
-- Add missing Foreign Key Constraints

-- 1. เพิ่ม foreign key สำหรับ time_entries.user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_entries_user_id_fkey' 
        AND table_name = 'time_entries'
    ) THEN
        ALTER TABLE time_entries 
        ADD CONSTRAINT time_entries_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
        
        RAISE NOTICE 'Added foreign key constraint: time_entries_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint time_entries_user_id_fkey already exists';
    END IF;
END $$;

-- 2. เพิ่ม foreign key สำหรับ leave_requests.user_id (ถ้าตารางมีอยู่)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'leave_requests_user_id_fkey' 
            AND table_name = 'leave_requests'
        ) THEN
            ALTER TABLE leave_requests 
            ADD CONSTRAINT leave_requests_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
            
            RAISE NOTICE 'Added foreign key constraint: leave_requests_user_id_fkey';
        ELSE
            RAISE NOTICE 'Foreign key constraint leave_requests_user_id_fkey already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Table leave_requests does not exist - skipping foreign key creation';
    END IF;
END $$;

-- 3. สร้างตาราง leave_requests ถ้ายังไม่มี
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company VARCHAR(50) DEFAULT 'login',
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_id UUID,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT leave_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id),
    CONSTRAINT leave_requests_reviewer_id_fkey 
        FOREIGN KEY (reviewer_id) REFERENCES user_profiles(user_id),
    CONSTRAINT leave_requests_valid_dates 
        CHECK (end_date >= start_date),
    CONSTRAINT leave_requests_positive_days 
        CHECK (total_days > 0)
);

-- 4. เพิ่ม indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON time_entries(company);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_date ON time_entries(entry_date);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- 5. เพิ่ม RLS policies สำหรับ leave_requests
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own leave requests
CREATE POLICY "Users can view own leave requests" ON leave_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own leave requests
CREATE POLICY "Users can create own leave requests" ON leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending leave requests
CREATE POLICY "Users can update own pending leave requests" ON leave_requests
    FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

-- Policy: Admins can view all leave requests
CREATE POLICY "Admins can view all leave requests" ON leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all leave requests
CREATE POLICY "Admins can update all leave requests" ON leave_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can delete leave requests
CREATE POLICY "Admins can delete leave requests" ON leave_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. ตรวจสอบผลลัพธ์
SELECT 'Foreign key constraints created successfully' as result;

-- แสดง foreign key constraints ที่เพิ่มแล้ว
SELECT 
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('time_entries', 'leave_requests')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;