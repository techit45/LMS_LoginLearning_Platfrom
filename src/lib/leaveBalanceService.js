// Leave Balance Management Service
// จัดการระบบสมดุลวันลา ความสมบูรณ์ 100%

import { supabase } from './supabaseClient';

/**
 * ดึงข้อมูลสมดุลวันลาของผู้ใช้
 */
export const getLeaveBalances = async (userId, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        user_profiles!inner(full_name, role)
      `)
      .eq('user_id', userId)
      .eq('year', currentYear)
      .eq('is_active', true)
      .order('leave_type');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * ดึงข้อมูลสมดุลวันลาของทีมงาน (สำหรับ admin/manager)
 */
export const getTeamLeaveBalances = async (company = 'login', year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        user_profiles!inner(full_name, role, email)
      `)
      .eq('company', company)
      .eq('year', currentYear)
      .eq('is_active', true)
      .order('user_profiles.full_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * อัปเดตสมดุลวันลาเมื่อมีการอนุมัติคำขอลา
 */
export const updateLeaveBalance = async (userId, company, leaveType, daysUsed, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .rpc('update_leave_balance', {
        p_user_id: userId,
        p_company: company,
        p_leave_type: leaveType,
        p_days_used: daysUsed,
        p_year: currentYear
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * ตั้งค่าสมดุลวันลาเริ่มต้นสำหรับพนักงานใหม่
 */
export const initializeEmployeeLeaveBalance = async (userId, company, role = 'instructor') => {
  try {
    const currentYear = new Date().getFullYear();
    
    // กำหนดจำนวนวันลาตามตำแหน่ง
    const leaveEntitlements = {
      vacation: role === 'admin' ? 12 : role === 'instructor' ? 8 : 6,
      sick: 30,
      personal: role === 'admin' ? 5 : 3,
      emergency: 3,
      maternity: 98,
      paternity: 15
    };

    const leaveBalances = Object.entries(leaveEntitlements).map(([leaveType, totalDays]) => ({
      user_id: userId,
      company: company,
      leave_type: leaveType,
      year: currentYear,
      total_days: totalDays,
      used_days: 0,
      remaining_days: totalDays,
      carryover_days: 0
    }));

    const { data, error } = await supabase
      .from('leave_balances')
      .upsert(leaveBalances, { 
        onConflict: 'user_id,company,leave_type,year',
        ignoreDuplicates: false 
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * ตรวจสอบว่ามีวันลาเพียงพอหรือไม่
 */
export const checkLeaveAvailability = async (userId, company, leaveType, requestedDays, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select('remaining_days, total_days, used_days')
      .eq('user_id', userId)
      .eq('company', company)
      .eq('leave_type', leaveType)
      .eq('year', currentYear)
      .single();

    if (error) throw error;

    const isAvailable = data && data.remaining_days >= requestedDays;
    
    return { 
      data: {
        available: isAvailable,
        remainingDays: data?.remaining_days || 0,
        totalDays: data?.total_days || 0,
        usedDays: data?.used_days || 0,
        requestedDays: requestedDays
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * คำนวณและอัปเดตการโอนวันลาจากปีที่แล้ว
 */
export const processYearlyCarryover = async (userId, company, fromYear, toYear) => {
  try {
    // ดึงข้อมูลวันลาที่เหลือจากปีที่แล้ว
    const { data: previousYear, error: prevError } = await supabase
      .from('leave_balances')
      .select('leave_type, remaining_days, max_carryover')
      .eq('user_id', userId)
      .eq('company', company)
      .eq('year', fromYear)
      .eq('is_active', true);

    if (prevError) throw prevError;

    const carryoverUpdates = [];
    
    for (const balance of previousYear) {
      // คำนวณจำนวนวันที่สามารถโอนได้
      const maxCarryover = balance.max_carryover || 0;
      const carryoverDays = Math.min(balance.remaining_days, maxCarryover);
      
      if (carryoverDays > 0) {
        carryoverUpdates.push({
          user_id: userId,
          company: company,
          leave_type: balance.leave_type,
          year: toYear,
          carryover_days: carryoverDays
        });
      }
    }

    if (carryoverUpdates.length > 0) {
      // อัปเดตข้อมูลการโอนวันลา
      for (const update of carryoverUpdates) {
        const { error: updateError } = await supabase
          .from('leave_balances')
          .update({
            carryover_days: update.carryover_days,
            remaining_days: supabase.raw(`total_days + ${update.carryover_days} - used_days`),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', update.user_id)
          .eq('company', update.company)
          .eq('leave_type', update.leave_type)
          .eq('year', update.year);

        if (updateError) throw updateError;
      }
    }

    return { data: carryoverUpdates, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * สร้างรายงานการใช้วันลาประจำเดือน
 */
export const generateMonthlyLeaveReport = async (company, year, month) => {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // ดึงข้อมูลการลาในเดือนที่กำหนด
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user_profiles!inner(full_name, role)
      `)
      .eq('company', company)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('status', 'approved')
      .order('start_date');

    if (leaveError) throw leaveError;

    // ดึงข้อมูลสมดุลวันลาปัจจุบัน
    const { data: balances, error: balanceError } = await supabase
      .from('leave_balances')
      .select(`
        *,
        user_profiles!inner(full_name, role)
      `)
      .eq('company', company)
      .eq('year', year);

    if (balanceError) throw balanceError;

    // รวบรวมข้อมูลรายงาน
    const report = {
      period: { year, month, startDate, endDate },
      summary: {
        totalRequests: leaveRequests.length,
        totalDaysUsed: leaveRequests.reduce((sum, req) => sum + req.total_days, 0),
        byLeaveType: {}
      },
      requests: leaveRequests,
      balances: balances,
      employees: []
    };

    // สรุปตามประเภทการลา
    leaveRequests.forEach(req => {
      if (!report.summary.byLeaveType[req.leave_type]) {
        report.summary.byLeaveType[req.leave_type] = { count: 0, days: 0 };
      }
      report.summary.byLeaveType[req.leave_type].count++;
      report.summary.byLeaveType[req.leave_type].days += req.total_days;
    });

    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * ตั้งค่าวันหมดอายุของวันลา
 */
export const setLeaveExpiration = async (userId, company, leaveType, expiryDate, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .update({
        expires_at: expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('company', company)
      .eq('leave_type', leaveType)
      .eq('year', currentYear);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * ตรวจสอบและจัดการวันลาที่หมดอายุ
 */
export const processExpiredLeaves = async (company) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // หาวันลาที่หมดอายุ
    const { data: expiredLeaves, error: expiredError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('company', company)
      .lte('expires_at', today)
      .eq('is_active', true);

    if (expiredError) throw expiredError;

    const expiredUpdates = [];
    
    // อัปเดตวันลาที่หมดอายุ
    for (const leave of expiredLeaves) {
      if (leave.remaining_days > 0) {
        expiredUpdates.push({
          id: leave.id,
          user_id: leave.user_id,
          leave_type: leave.leave_type,
          expired_days: leave.remaining_days
        });

        // รีเซ็ตวันลาที่เหลือเป็น 0
        await supabase
          .from('leave_balances')
          .update({
            remaining_days: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', leave.id);
      }
    }

    return { data: expiredUpdates, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export default {
  getLeaveBalances,
  getTeamLeaveBalances,
  updateLeaveBalance,
  initializeEmployeeLeaveBalance,
  checkLeaveAvailability,
  processYearlyCarryover,
  generateMonthlyLeaveReport,
  setLeaveExpiration,
  processExpiredLeaves
};