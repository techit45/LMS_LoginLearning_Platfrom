# 🔧 รัน SQL นี้ใน Supabase SQL Editor

## ขั้นตอนการรัน:

1. **เข้า Supabase Dashboard**
2. **ไปที่ SQL Editor** 
3. **คัดลอกโค้ดด้านล่างนี้แล้วรัน**

```sql
-- SQL Function for Bulk Update Content Order
-- This function allows atomic updating of multiple content items' order_index

CREATE OR REPLACE FUNCTION bulk_update_content_order(content_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    update_item jsonb;
BEGIN
    -- Validate input
    IF content_updates IS NULL OR jsonb_array_length(content_updates) = 0 THEN
        RAISE EXCEPTION 'No content updates provided';
    END IF;

    -- Loop through each update item
    FOR update_item IN SELECT * FROM jsonb_array_elements(content_updates)
    LOOP
        -- Validate required fields
        IF NOT (update_item ? 'content_id' AND update_item ? 'new_order') THEN
            RAISE EXCEPTION 'Invalid update item: missing content_id or new_order';
        END IF;

        -- Update the content order
        UPDATE course_content 
        SET 
            order_index = (update_item->>'new_order')::integer,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (update_item->>'content_id')::uuid;

        -- Check if the update affected any rows
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Content with ID % not found', update_item->>'content_id';
        END IF;
    END LOOP;

    -- Log successful completion
    RAISE NOTICE 'Successfully updated % content items', jsonb_array_length(content_updates);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION bulk_update_content_order(jsonb) TO authenticated;

-- Test the function (optional - can be removed in production)
DO $$
BEGIN
    RAISE NOTICE 'bulk_update_content_order function created successfully';
END $$;
```

## ✅ หลังจากรันแล้ว:

1. **ควรเห็นข้อความ**: `bulk_update_content_order function created successfully`
2. **ไปทดสอบระบบลากวาง** ในหน้า Admin Course Content
3. **ระบบจะใช้ bulk update** แทน fallback method

## 🔧 หากไม่สามารถรันได้:

ระบบจะใช้ **fallback method** อัตโนมัติ ซึ่งก็ทำงานได้ แต่อาจช้ากว่าเล็กน้อย

**หมายเหตุ:** รัน SQL นี้ครั้งเดียวเท่านั้น