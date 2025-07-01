-- ==========================================
-- PAYMENT SYSTEM DATABASE SCHEMA
-- Add payment support to existing LMS
-- ==========================================

-- 1. PAYMENT METHODS TABLE
-- Define supported payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL UNIQUE, -- 'promptpay', 'credit_card', 'bank_transfer'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb, -- Method-specific configuration
    fees_percentage DECIMAL(5,2) DEFAULT 0,
    fees_fixed DECIMAL(10,2) DEFAULT 0,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2),
    supported_currencies TEXT[] DEFAULT ARRAY['THB'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PAYMENTS TABLE
-- Track all payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Order information
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('course_enrollment', 'kit_purchase', 'subscription')),
    order_id UUID, -- References enrollments.id or kit_orders.id
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    fees DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refund'
    )),
    
    -- External payment provider details
    provider_name VARCHAR(50), -- 'omise', 'promptpay', 'manual'
    provider_transaction_id VARCHAR(255),
    provider_reference VARCHAR(255),
    provider_response JSONB DEFAULT '{}'::jsonb,
    
    -- QR Code for PromptPay
    qr_code_data TEXT,
    qr_code_url TEXT,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT
);

-- 3. PAYMENT LOGS TABLE
-- Track payment status changes and webhook events
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'status_change', 'webhook', 'manual_update'
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Update existing tables to support payments

-- Add payment status to enrollments
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'free' 
CHECK (payment_status IN ('free', 'pending', 'paid', 'failed', 'refunded'));

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- Add payment status to kit_orders (if not exists)
ALTER TABLE kit_orders 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- 5. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_type, order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider_name, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);

-- 6. RLS POLICIES
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Payment methods - anyone can view active methods
CREATE POLICY "Anyone can view active payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role = 'admin'
        )
    );

-- Payments - users can view own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true); -- Allow system updates for webhooks

CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role = 'admin'
        )
    );

-- Payment logs - only admins can view
CREATE POLICY "Admins can view payment logs" ON payment_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role = 'admin'
        )
    );

CREATE POLICY "System can create payment logs" ON payment_logs
    FOR INSERT WITH CHECK (true);

-- 7. FUNCTIONS AND TRIGGERS

-- Function to log payment status changes
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payment_logs (
            payment_id, 
            event_type, 
            old_status, 
            new_status, 
            message,
            metadata
        ) VALUES (
            NEW.id,
            'status_change',
            OLD.status,
            NEW.status,
            'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
            jsonb_build_object(
                'updated_at', NEW.updated_at,
                'provider_transaction_id', NEW.provider_transaction_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment status changes
CREATE TRIGGER trigger_log_payment_status_change
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_status_change();

-- Function to auto-update enrollment status when payment is completed
CREATE OR REPLACE FUNCTION update_enrollment_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment is completed and it's for a course enrollment
    IF NEW.status = 'completed' AND NEW.order_type = 'course_enrollment' THEN
        UPDATE enrollments 
        SET 
            payment_status = 'paid',
            payment_id = NEW.id,
            status = 'active'
        WHERE id = NEW.order_id;
    END IF;
    
    -- If payment failed
    IF NEW.status = 'failed' AND NEW.order_type = 'course_enrollment' THEN
        UPDATE enrollments 
        SET payment_status = 'failed'
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for enrollment updates
CREATE TRIGGER trigger_update_enrollment_on_payment
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_on_payment();

-- 8. INSERT DEFAULT PAYMENT METHODS
INSERT INTO payment_methods (method_name, display_name, description, config) VALUES
('promptpay', 'PromptPay', 'ชำระผ่าน QR Code PromptPay', jsonb_build_object(
    'promptpay_id', '0000000000000',
    'qr_expire_minutes', 15
)),
('credit_card', 'Credit/Debit Card', 'ชำระด้วยบัตรเครดิต/เดบิต', jsonb_build_object(
    'provider', 'omise',
    'public_key', '',
    'secret_key', ''
)),
('bank_transfer', 'Bank Transfer', 'โอนเงินผ่านธนาคาร', jsonb_build_object(
    'bank_name', 'ธนาคารกสิกรไทย',
    'account_number', '000-0-00000-0',
    'account_name', 'Login Learning Co., Ltd.'
))
ON CONFLICT (method_name) DO NOTHING;

-- Success message
SELECT 
    'Payment system schema created successfully!' as message,
    (SELECT COUNT(*) FROM payment_methods) as payment_methods_count,
    'Ready for payment service implementation' as next_step;