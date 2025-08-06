-- Add registered_location_info column to time_entries table
-- This column will store information about which registered location was used for check-in

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS registered_location_info JSONB;

-- Add comment to document the column
COMMENT ON COLUMN time_entries.registered_location_info IS 'JSON object containing registered location info: {location_id, location_name, distance}';

-- Create index for better performance when querying by registered location
CREATE INDEX IF NOT EXISTS idx_time_entries_registered_location 
ON time_entries USING GIN (registered_location_info);

-- Example of the JSON structure that will be stored:
-- {
--   "location_id": "uuid-of-company-location",
--   "location_name": "สำนักงานใหญ่ Login Learning", 
--   "distance": 45.6
-- }