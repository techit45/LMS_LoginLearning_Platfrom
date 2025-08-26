-- Create the missing bulk_update_content_order function
-- This function is used for reordering course content via drag and drop

CREATE OR REPLACE FUNCTION public.bulk_update_content_order(content_updates JSONB)
RETURNS TEXT AS $$
DECLARE
    update_item JSONB;
    updated_count INTEGER := 0;
BEGIN
    -- Iterate through each update item in the JSON array
    FOR update_item IN SELECT * FROM jsonb_array_elements(content_updates)
    LOOP
        -- Update the order_index for each content item
        UPDATE course_content 
        SET 
            order_index = (update_item->>'order_index')::INTEGER,
            updated_at = NOW()
        WHERE id = (update_item->>'id')::UUID;
        
        -- Count successful updates
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        -- Log the update
        RAISE NOTICE 'Updated content ID: %, new order: %', 
                     update_item->>'id', 
                     update_item->>'order_index';
    END LOOP;

    RETURN format('Successfully updated %s content items', updated_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.bulk_update_content_order(JSONB) TO authenticated;

-- Test the function
SELECT public.bulk_update_content_order('[
    {"id": "00000000-0000-0000-0000-000000000000", "order_index": 1}
]'::JSONB);

COMMENT ON FUNCTION public.bulk_update_content_order(JSONB) IS 'Bulk update order_index for course content items via drag and drop operations';