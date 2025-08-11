import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function checkPayrollData() {
  console.log('🔍 Checking payroll_settings data...');
  
  const { data, error, count } = await supabase
    .from('payroll_settings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Total records: ${count}`);
  
  if (data && data.length > 0) {
    console.log('\n📋 Settings found:');
    data.forEach((setting, index) => {
      console.log(`\n${index + 1}. ${setting.name || setting.reference_id}`);
      console.log(`   Type: ${setting.setting_type}`);
      console.log(`   Reference: ${setting.reference_id}`);
      console.log(`   Hourly Rate: ฿${setting.hourly_rate}`);
      console.log(`   Base Salary: ฿${setting.base_salary}`);
      console.log(`   Transport: ฿${setting.transport_allowance}`);
      console.log(`   Meal: ฿${setting.meal_allowance}`);
      console.log(`   Active: ${setting.is_active}`);
    });
  } else {
    console.log('📭 No payroll settings found - please save settings first');
  }
}

checkPayrollData();