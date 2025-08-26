// Test Folder Validation Script
// This script tests the folder validation functions

// Mock the courseService functions for testing
const COMPANY_DRIVE_FOLDERS = {
  'login': {
    name: 'LOGIN',
    root: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S',
    courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',  // 📖 คอร์สเรียน
    projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF'  // 🎯 โปรเจค
  },
  'meta': {
    name: 'Meta', 
    root: '1IyP3gtT6K5JRTPOEW1gIVYMHv1mQXVMG',
    courses: '1CI-73CLESxWCVevYaDeSKGikLy2Tccg',
    projects: '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7'
  },
  'med': {
    name: 'Med',
    root: '1rZ5BNCoGsGaA7ZCzf_bEgPIEgAANp-O4', 
    courses: '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ',
    projects: '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK'
  },
  'edtech': {
    name: 'Ed-tech',
    root: '163LK-tcU26Ea3JYmWrzqadkH0-8p3iiW',
    courses: '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C', 
    projects: '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5'
  }
};

const validateDriveFolder = (folderId, company, expectedType = 'courses') => {
  const companyKey = company?.toLowerCase();
  const config = COMPANY_DRIVE_FOLDERS[companyKey];
  
  if (!config) {
    return {
      isValid: false,
      message: `Unknown company: ${company}`
    };
  }
  
  const correctFolderId = config[expectedType];
  const wrongType = expectedType === 'courses' ? 'projects' : 'courses';
  const wrongFolderId = config[wrongType];
  
  if (folderId === wrongFolderId) {
    return {
      isValid: false,
      message: `Wrong folder type: This is the ${wrongType} folder, not ${expectedType} folder`
    };
  }
  
  if (folderId !== correctFolderId) {
    return {
      isValid: false,
      message: `Incorrect folder ID for ${company} ${expectedType}. Expected: ${correctFolderId}`
    };
  }
  
  return {
    isValid: true,
    message: 'Folder ID is correct'
  };
};

// Test cases
console.log('🧪 Testing Folder Validation...\n');

const testCases = [
  // Correct cases
  { folderId: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT', company: 'login', type: 'courses', expected: true },
  { folderId: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF', company: 'login', type: 'projects', expected: true },
  { folderId: '1CI-73CLESxWCVevYaDeSKGikLy2Tccg', company: 'meta', type: 'courses', expected: true },
  
  // Wrong folder type cases
  { folderId: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF', company: 'login', type: 'courses', expected: false },  // Projects folder used for courses
  { folderId: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT', company: 'login', type: 'projects', expected: false }, // Courses folder used for projects
  
  // Unknown company
  { folderId: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT', company: 'unknown', type: 'courses', expected: false },
  
  // Wrong folder ID
  { folderId: 'wrong-folder-id', company: 'login', type: 'courses', expected: false }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = validateDriveFolder(testCase.folderId, testCase.company, testCase.type);
  const passed = result.isValid === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Company: ${testCase.company}`);
  console.log(`  Type: ${testCase.type}`);
  console.log(`  Folder ID: ${testCase.folderId}`);
  console.log(`  Expected: ${testCase.expected ? 'Valid' : 'Invalid'}`);
  console.log(`  Result: ${result.isValid ? 'Valid' : 'Invalid'}`);
  console.log(`  Message: ${result.message}`);
  console.log('');
  
  if (passed) passedTests++;
});

console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Folder validation is working correctly.');
} else {
  console.log('❌ Some tests failed. Please check the validation logic.');
}

// Display current folder structure
console.log('\n📁 Current Folder Structure:');
Object.entries(COMPANY_DRIVE_FOLDERS).forEach(([company, config]) => {
  console.log(`\n[${config.name}]:`);
  console.log(`  Root: ${config.root}`);
  console.log(`  📖 Courses: ${config.courses || 'Not configured'}`);
  console.log(`  🎯 Projects: ${config.projects || 'Not configured'}`);
});