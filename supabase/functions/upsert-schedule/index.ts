// =============================================================================
// Supabase Edge Function: upsertSchedule
// =============================================================================
// Real-time collaborative teaching schedule management with conflict detection
// Handles optimistic locking and time slot conflict resolution

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Types for TypeScript support
interface UpsertScheduleRequest {
  id?: string
  week_start_date: string
  day_of_week: number
  time_slot_index: number
  duration: number
  course_id?: string
  instructor_id?: string
  room?: string
  color?: string
  notes?: string
  company: string
  version?: number
}

interface ConflictDetails {
  type: 'instructor' | 'room' | 'time_slot'
  conflicting_schedule: any
  message: string
}

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  conflict_details?: ConflictDetails
}

// Helper function to check time slot conflicts
async function checkTimeSlotConflicts(
  supabase: any,
  scheduleData: UpsertScheduleRequest,
  excludeId?: string
): Promise<ConflictDetails | null> {
  const {
    week_start_date,
    day_of_week,
    time_slot_index,
    duration,
    instructor_id,
    room,
    company
  } = scheduleData

  // Check for overlapping time slots
  for (let i = 0; i < duration; i++) {
    const checkSlot = time_slot_index + i
    
    // Ensure we don't exceed available time slots (0-12)
    if (checkSlot > 12) {
      return {
        type: 'time_slot',
        conflicting_schedule: null,
        message: `Time slot would exceed available hours (max 13 slots, requested: ${checkSlot + 1})`
      }
    }

    // Check for existing schedules that overlap with this time slot
    let query = supabase
      .from('teaching_schedules')
      .select(`
        id, time_slot_index, duration, instructor_id, room, color,
        teaching_courses!course_id(name, code),
        user_profiles!instructor_id(full_name, email)
      `)
      .eq('week_start_date', week_start_date)
      .eq('day_of_week', day_of_week)
      .eq('company', company)

    // Exclude current record if updating
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingSchedules, error } = await query

    if (error) {
      console.error('Error checking conflicts:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Check each existing schedule for overlaps
    for (const existing of existingSchedules || []) {
      const existingStart = existing.time_slot_index
      const existingEnd = existingStart + (existing.duration - 1)
      
      // Check if current slot overlaps with existing schedule
      if (checkSlot >= existingStart && checkSlot <= existingEnd) {
        // Determine conflict type
        if (instructor_id && existing.instructor_id === instructor_id) {
          return {
            type: 'instructor',
            conflicting_schedule: existing,
            message: `Instructor "${existing.user_profiles?.full_name}" already has a class at this time (${existing.teaching_courses?.name})`
          }
        }
        
        if (room && existing.room === room) {
          return {
            type: 'room',
            conflicting_schedule: existing,
            message: `Room "${room}" is already occupied at this time (${existing.teaching_courses?.name})`
          }
        }

        // General time slot conflict
        return {
          type: 'time_slot',
          conflicting_schedule: existing,
          message: `Time slot is already occupied (${existing.teaching_courses?.name})`
        }
      }
    }
  }

  return null // No conflicts found
}

// Helper function to validate input data
function validateScheduleData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.week_start_date) errors.push('week_start_date is required')
  if (typeof data.day_of_week !== 'number' || data.day_of_week < 0 || data.day_of_week > 6) {
    errors.push('day_of_week must be between 0 (Monday) and 6 (Sunday)')
  }
  if (typeof data.time_slot_index !== 'number' || data.time_slot_index < 0 || data.time_slot_index > 12) {
    errors.push('time_slot_index must be between 0 and 12')
  }
  if (typeof data.duration !== 'number' || data.duration < 1 || data.duration > 6) {
    errors.push('duration must be between 1 and 6 hours')
  }
  if (!data.company) errors.push('company is required')

  // Validate date format
  if (data.week_start_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.week_start_date)) {
    errors.push('week_start_date must be in YYYY-MM-DD format')
  }

  // Validate UUIDs if provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (data.id && !uuidRegex.test(data.id)) {
    errors.push('Invalid UUID format for id')
  }
  if (data.course_id && !uuidRegex.test(data.course_id)) {
    errors.push('Invalid UUID format for course_id')
  }
  if (data.instructor_id && !uuidRegex.test(data.instructor_id)) {
    errors.push('Invalid UUID format for instructor_id')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to check optimistic locking
async function checkOptimisticLocking(
  supabase: any,
  id: string,
  expectedVersion?: number
): Promise<{ isValid: boolean; currentVersion?: number; error?: string }> {
  if (!expectedVersion) {
    return { isValid: true } // Skip version check for new records
  }

  const { data: existing, error } = await supabase
    .from('teaching_schedules')
    .select('version')
    .eq('id', id)
    .single()

  if (error) {
    return { isValid: false, error: `Could not verify record version: ${error.message}` }
  }

  if (existing.version !== expectedVersion) {
    return {
      isValid: false,
      currentVersion: existing.version,
      error: `Record has been modified by another user. Expected version ${expectedVersion}, but current version is ${existing.version}`
    }
  }

  return { isValid: true, currentVersion: existing.version }
}

// Main Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: UpsertScheduleRequest = await req.json()

    // Validate input data
    const validation = validateScheduleData(requestData)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data', 
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check optimistic locking for updates
    if (requestData.id && requestData.version) {
      const lockCheck = await checkOptimisticLocking(
        supabase,
        requestData.id,
        requestData.version
      )

      if (!lockCheck.isValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: lockCheck.error,
            current_version: lockCheck.currentVersion
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Check for time slot conflicts
    const conflict = await checkTimeSlotConflicts(
      supabase,
      requestData,
      requestData.id
    )

    if (conflict) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Schedule conflict detected',
          conflict_details: conflict
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare data for upsert
    const scheduleData = {
      week_start_date: requestData.week_start_date,
      day_of_week: requestData.day_of_week,
      time_slot_index: requestData.time_slot_index,
      duration: requestData.duration,
      course_id: requestData.course_id || null,
      instructor_id: requestData.instructor_id || null,
      room: requestData.room || 'TBD',
      color: requestData.color || 'bg-blue-500',
      notes: requestData.notes || null,
      company: requestData.company,
      updated_by: user.id
    }

    let result

    if (requestData.id) {
      // Update existing schedule
      const { data, error } = await supabase
        .from('teaching_schedules')
        .update(scheduleData)
        .eq('id', requestData.id)
        .select(`
          *,
          teaching_courses!course_id(name, code),
          user_profiles!instructor_id(full_name, email)
        `)
        .single()

      if (error) {
        throw new Error(`Update failed: ${error.message}`)
      }

      result = data
    } else {
      // Insert new schedule
      const insertData = {
        ...scheduleData,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('teaching_schedules')
        .insert(insertData)
        .select(`
          *,
          teaching_courses!course_id(name, code),
          user_profiles!instructor_id(full_name, email)
        `)
        .single()

      if (error) {
        throw new Error(`Insert failed: ${error.message}`)
      }

      result = data
    }

    // Return success response
    const response: ApiResponse = {
      success: true,
      data: result
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('upsertSchedule error:', error)

    const errorResponse: ApiResponse = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
=============================================================================
USAGE EXAMPLE:

POST /functions/v1/upsert-schedule
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "id": "optional-uuid-for-updates",
  "week_start_date": "2025-08-11",
  "day_of_week": 0,
  "time_slot_index": 2,
  "duration": 2,
  "course_id": "course-uuid",
  "instructor_id": "instructor-uuid",
  "room": "A101",
  "color": "bg-blue-500",
  "notes": "Special session",
  "company": "login",
  "version": 1
}

RESPONSE SUCCESS (200):
{
  "success": true,
  "data": {
    "id": "schedule-uuid",
    "week_start_date": "2025-08-11",
    "day_of_week": 0,
    "time_slot_index": 2,
    "duration": 2,
    "version": 2,
    "teaching_courses": { "name": "React Fundamentals", "code": "CS101" },
    "user_profiles": { "full_name": "อาจารย์สมชาย", "email": "somchai@login.com" }
  }
}

RESPONSE CONFLICT (409):
{
  "success": false,
  "error": "Schedule conflict detected",
  "conflict_details": {
    "type": "instructor",
    "conflicting_schedule": { ... },
    "message": "Instructor \"อาจารย์สมชาย\" already has a class at this time"
  }
}

RESPONSE VERSION CONFLICT (409):
{
  "success": false,
  "error": "Record has been modified by another user. Expected version 1, but current version is 3",
  "current_version": 3
}
=============================================================================
*/