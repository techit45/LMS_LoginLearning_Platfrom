// Debug script to compare hour calculations
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugHourCalculation() {
  const userId = 'a32c4b64-8b45-4f85-a1b2-9c7d8e0f1a2b' // Replace with actual user ID
  const company = 'login'
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  // Get current month date range
  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
  const lastDay = new Date(currentYear, currentMonth, 0).getDate()
  const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
  
  console.log('🔍 Debugging Hour Calculation Discrepancy')
  console.log('📅 Period:', startDate, 'to', endDate)
  console.log('👤 User ID:', userId)
  console.log('🏢 Company:', company)
  console.log('='=.repeat(60))
  
  // Query 1: Calendar view (WorkHoursManagement style)
  console.log('\n📊 CALENDAR VIEW QUERY (WorkHoursManagement)')
  const { data: calendarEntries, error: calendarError } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date')
    .order('check_in_time')
  
  if (calendarError) {
    console.error('❌ Calendar query error:', calendarError)
    return
  }
  
  const calendarTotal = calendarEntries.reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0)
  console.log(`📈 Total entries found: ${calendarEntries.length}`)
  console.log(`⏱️  Total hours: ${calendarTotal.toFixed(2)}`)
  
  // Show entry details
  console.log('\n📋 Entry Details:')
  calendarEntries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.entry_date} | ${entry.entry_type || 'N/A'} | ${entry.total_hours}h | Status: ${entry.status || 'N/A'} | Company: ${entry.company || 'N/A'}`)
  })
  
  // Query 2: Salary calculation (employeeSalaryService style)
  console.log('\n💰 SALARY CALCULATION QUERY (employeeSalaryService)')
  const { data: salaryEntries, error: salaryError } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('company', company)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .eq('status', 'approved')
    .gt('total_hours', 0)
  
  if (salaryError) {
    console.error('❌ Salary query error:', salaryError)
    return
  }
  
  const salaryTotal = salaryEntries.reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0)
  console.log(`📈 Total entries found: ${salaryEntries.length}`)
  console.log(`⏱️  Total hours: ${salaryTotal.toFixed(2)}`)
  
  // Show entry details
  console.log('\n📋 Entry Details:')
  salaryEntries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.entry_date} | ${entry.entry_type || 'N/A'} | ${entry.total_hours}h | Status: ${entry.status || 'N/A'} | Company: ${entry.company || 'N/A'}`)
  })
  
  // Analysis
  console.log('\n📊 ANALYSIS')
  console.log('='=.repeat(60))
  console.log(`📅 Calendar View Hours: ${calendarTotal.toFixed(2)}`)
  console.log(`💰 Salary Calculation Hours: ${salaryTotal.toFixed(2)}`)
  console.log(`📈 Discrepancy: ${(calendarTotal - salaryTotal).toFixed(2)} hours`)
  
  // Find differences
  const calendarIds = new Set(calendarEntries.map(e => e.id))
  const salaryIds = new Set(salaryEntries.map(e => e.id))
  
  const missingFromSalary = calendarEntries.filter(e => !salaryIds.has(e.id))
  const missingFromCalendar = salaryEntries.filter(e => !calendarIds.has(e.id))
  
  if (missingFromSalary.length > 0) {
    console.log('\n❌ Entries in Calendar but NOT in Salary Calculation:')
    missingFromSalary.forEach(entry => {
      console.log(`- ${entry.entry_date} | ${entry.entry_type || 'N/A'} | ${entry.total_hours}h | Status: ${entry.status || 'N/A'} | Company: ${entry.company || 'N/A'}`)
      console.log(`  Reason: ${!entry.status || entry.status !== 'approved' ? 'Not approved' : ''} ${entry.company !== company ? 'Wrong company' : ''} ${(parseFloat(entry.total_hours) || 0) <= 0 ? 'Zero hours' : ''}`)
    })
  }
  
  if (missingFromCalendar.length > 0) {
    console.log('\n❓ Entries in Salary but NOT in Calendar:')
    missingFromCalendar.forEach(entry => {
      console.log(`- ${entry.entry_date} | ${entry.entry_type || 'N/A'} | ${entry.total_hours}h`)
    })
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS')
  console.log('='=.repeat(60))
  
  if (missingFromSalary.length > 0) {
    const unapprovedCount = missingFromSalary.filter(e => !e.status || e.status !== 'approved').length
    const wrongCompanyCount = missingFromSalary.filter(e => e.company !== company).length
    const zeroHoursCount = missingFromSalary.filter(e => (parseFloat(e.total_hours) || 0) <= 0).length
    
    console.log(`📝 ${unapprovedCount} entries need approval`)
    console.log(`🏢 ${wrongCompanyCount} entries have wrong company`)
    console.log(`⏱️  ${zeroHoursCount} entries have zero hours`)
    
    console.log('\n🔧 Fixes needed:')
    console.log('1. Update entry status to "approved" for valid entries')
    console.log('2. Set correct company for entries')
    console.log('3. Fix zero-hour entries')
    console.log('4. Update WorkHoursManagement to match salary calculation filters')
  }
}

// Run the debug
debugHourCalculation().catch(console.error)