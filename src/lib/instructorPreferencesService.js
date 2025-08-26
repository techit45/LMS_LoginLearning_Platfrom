import { supabase } from './supabaseClient'

/**
 * Instructor Display Preferences Service
 * จัดการการตั้งค่าการแสดงผล instructor ของแต่ละ user
 */

/**
 * โหลด preferences ของ user จาก database
 * @returns {Promise<Object>} Object ที่มี instructor_id เป็น key และ is_visible เป็น value
 */
export const loadInstructorPreferences = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data, error } = await supabase
      .from('instructor_display_preferences')
      .select('instructor_user_id, is_visible')
      .eq('user_id', user.id)

    if (error) {
      return {}
    }

    // สร้าง object สำหรับ lookup ที่เร็ว
    const preferences = {}
    data?.forEach(pref => {
      preferences[pref.instructor_user_id] = pref.is_visible
    })

    console.log('✅ Loaded instructor preferences:', Object.keys(preferences).length, 'preferences')
    return preferences
  } catch (error) {
    return {}
  }
}

/**
 * บันทึกการตั้งค่าการแสดงผล instructor ลง database
 * @param {string} instructorId - ID ของ instructor
 * @param {boolean} isVisible - แสดงผลหรือไม่
 */
export const saveInstructorPreference = async (instructorId, isVisible) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('instructor_display_preferences')
      .upsert({
        user_id: user.id,
        instructor_user_id: instructorId,
        is_visible: isVisible
      }, {
        onConflict: 'user_id,instructor_user_id'
      })

    if (error) {
      throw error
    }

    } catch (error) {
    throw error
  }
}

/**
 * บันทึก preferences หลายตัวพร้อมกัน ลง database
 * @param {Array} preferences - Array ของ {instructorId, isVisible}
 */
export const saveMultipleInstructorPreferences = async (preferences) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const records = preferences.map(({ instructorId, isVisible }) => ({
      user_id: user.id,
      instructor_user_id: instructorId,
      is_visible: isVisible
    }))

    const { error } = await supabase
      .from('instructor_display_preferences')
      .upsert(records, {
        onConflict: 'user_id,instructor_user_id'
      })

    if (error) {
      throw error
    }

    } catch (error) {
    throw error
  }
}

/**
 * ลบ preference จาก database (จะกลับไปใช้ default ที่ is_visible = true)
 * @param {string} instructorId - ID ของ instructor
 */
export const deleteInstructorPreference = async (instructorId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('instructor_display_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('instructor_user_id', instructorId)

    if (error) {
      throw error
    }

    } catch (error) {
    throw error
  }
}