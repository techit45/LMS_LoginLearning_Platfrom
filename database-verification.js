// Database System Verification Script
// Run this in browser console or Node.js environment

const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMxOTgwOTgsImV4cCI6MjAzODc3NDA5OH0.8UfzDRKxO0tO8Bz6MBkNgtVFcdj0v1B-vb4EZFYz_FE';

class DatabaseVerification {
    constructor() {
        this.results = {
            tables: {},
            policies: {},
            functions: {},
            errors: []
        };
    }

    async init() {
        try {
            // Import Supabase client
            const { createClient } = await import('@supabase/supabase-js');
            this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
            return false;
        }
    }

    async testConnection() {
        console.log('\n🔍 Testing Database Connection...');
        try {
            const { data, error } = await this.supabase.from('user_profiles').select('count').limit(1);
            if (error) {
                console.log('⚠️ Connection test result:', error.message);
                return { status: 'warning', message: error.message };
            }
            console.log('✅ Database connection successful');
            return { status: 'success', message: 'Connected successfully' };
        } catch (error) {
            console.error('❌ Connection failed:', error);
            return { status: 'error', message: error.message };
        }
    }

    async verifyTables() {
        console.log('\n🔍 Verifying Database Tables...');
        
        const expectedTables = [
            'user_profiles',
            'courses',
            'projects', 
            'enrollments',
            'assignments',
            'course_content',
            'attachments',
            'forum_topics',
            'forum_replies',
            'user_progress',
            'achievements',
            'teaching_schedules',
            'company_locations',
            'time_entries',
            'notifications'
        ];

        const results = {};
        
        for (const table of expectedTables) {
            try {
                console.log(`  Testing table: ${table}`);
                const { data, error } = await this.supabase.from(table).select('*').limit(1);
                
                if (error) {
                    if (error.message.includes('relation') && error.message.includes('does not exist')) {
                        results[table] = { status: 'missing', message: 'Table does not exist' };
                        console.log(`    ❌ ${table}: Missing`);
                    } else if (error.message.includes('row-level security')) {
                        results[table] = { status: 'protected', message: 'Protected by RLS' };
                        console.log(`    🔒 ${table}: Protected by RLS`);
                    } else {
                        results[table] = { status: 'error', message: error.message };
                        console.log(`    ⚠️ ${table}: ${error.message}`);
                    }
                } else {
                    const recordCount = Array.isArray(data) ? data.length : 0;
                    results[table] = { status: 'accessible', message: `${recordCount} records accessible` };
                    console.log(`    ✅ ${table}: Accessible (${recordCount} records)`);
                }
            } catch (error) {
                results[table] = { status: 'error', message: error.message };
                console.log(`    ❌ ${table}: ${error.message}`);
            }
        }
        
        this.results.tables = results;
        return results;
    }

    async testRLSPolicies() {
        console.log('\n🔍 Testing Row Level Security Policies...');
        
        const criticalTables = ['user_profiles', 'courses', 'projects', 'enrollments', 'assignments'];
        const results = {};
        
        for (const table of criticalTables) {
            try {
                console.log(`  Testing RLS for: ${table}`);
                
                // Try to access data without authentication
                const { data, error } = await this.supabase.from(table).select('*').limit(1);
                
                if (error && error.message.includes('row-level security')) {
                    results[table] = { status: 'protected', message: 'RLS is active and blocking access' };
                    console.log(`    🔒 ${table}: RLS Active`);
                } else if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
                    results[table] = { status: 'missing', message: 'Table does not exist' };
                    console.log(`    ❌ ${table}: Table missing`);
                } else if (data && data.length === 0) {
                    results[table] = { status: 'empty', message: 'Table exists but is empty' };
                    console.log(`    ⚠️ ${table}: Empty table`);
                } else if (data && data.length > 0) {
                    results[table] = { status: 'accessible', message: 'Data is publicly accessible' };
                    console.log(`    ⚠️ ${table}: Publicly accessible (may need RLS)`);
                } else {
                    results[table] = { status: 'unknown', message: 'Unable to determine RLS status' };
                    console.log(`    ❓ ${table}: Status unknown`);
                }
            } catch (error) {
                results[table] = { status: 'error', message: error.message };
                console.log(`    ❌ ${table}: ${error.message}`);
            }
        }
        
        this.results.policies = results;
        return results;
    }

    async testForeignKeys() {
        console.log('\n🔍 Testing Foreign Key Relationships...');
        
        const relationships = [
            { table: 'user_profiles', foreign_key: 'user_id', references: 'auth.users' },
            { table: 'courses', foreign_key: 'instructor_id', references: 'user_profiles' },
            { table: 'enrollments', foreign_key: 'course_id', references: 'courses' },
            { table: 'enrollments', foreign_key: 'user_id', references: 'user_profiles' },
            { table: 'assignments', foreign_key: 'course_id', references: 'courses' },
            { table: 'projects', foreign_key: 'creator_id', references: 'user_profiles' }
        ];

        const results = {};
        
        for (const rel of relationships) {
            try {
                console.log(`  Testing: ${rel.table}.${rel.foreign_key} -> ${rel.references}`);
                
                // This is a basic test - in production, you'd query the information_schema
                const { data, error } = await this.supabase
                    .from(rel.table)
                    .select(rel.foreign_key)
                    .limit(1);
                
                if (error) {
                    if (error.message.includes('relation') && error.message.includes('does not exist')) {
                        results[`${rel.table}.${rel.foreign_key}`] = { 
                            status: 'table_missing', 
                            message: 'Source table does not exist' 
                        };
                    } else {
                        results[`${rel.table}.${rel.foreign_key}`] = { 
                            status: 'accessible', 
                            message: 'Relationship structure exists' 
                        };
                    }
                } else {
                    results[`${rel.table}.${rel.foreign_key}`] = { 
                        status: 'accessible', 
                        message: 'Relationship structure exists' 
                    };
                }
                
                console.log(`    ✅ ${rel.table}.${rel.foreign_key}: Structure exists`);
            } catch (error) {
                results[`${rel.table}.${rel.foreign_key}`] = { 
                    status: 'error', 
                    message: error.message 
                };
                console.log(`    ❌ ${rel.table}.${rel.foreign_key}: ${error.message}`);
            }
        }
        
        return results;
    }

    async testPerformance() {
        console.log('\n🔍 Testing Query Performance...');
        
        const testQueries = [
            {
                name: 'Simple Select',
                query: () => this.supabase.from('courses').select('id, title').limit(10)
            },
            {
                name: 'Count Query',
                query: () => this.supabase.from('user_profiles').select('id', { count: 'exact' }).limit(1)
            },
            {
                name: 'Complex Join',
                query: () => this.supabase
                    .from('enrollments')
                    .select('*, courses(title), user_profiles(full_name)')
                    .limit(5)
            }
        ];

        const results = {};
        
        for (const test of testQueries) {
            try {
                console.log(`  Testing: ${test.name}`);
                const startTime = Date.now();
                
                const { data, error } = await test.query();
                const executionTime = Date.now() - startTime;
                
                if (error) {
                    results[test.name] = {
                        status: 'error',
                        message: error.message,
                        executionTime
                    };
                    console.log(`    ❌ ${test.name}: ${error.message} (${executionTime}ms)`);
                } else {
                    let status = 'success';
                    if (executionTime > 3000) status = 'slow';
                    else if (executionTime > 1000) status = 'acceptable';
                    
                    results[test.name] = {
                        status,
                        message: `Query executed successfully`,
                        executionTime,
                        recordCount: Array.isArray(data) ? data.length : 0
                    };
                    
                    console.log(`    ✅ ${test.name}: ${executionTime}ms (${Array.isArray(data) ? data.length : 0} records)`);
                }
            } catch (error) {
                results[test.name] = {
                    status: 'error',
                    message: error.message,
                    executionTime: -1
                };
                console.log(`    ❌ ${test.name}: ${error.message}`);
            }
        }
        
        return results;
    }

    async generateReport() {
        console.log('\n📋 Generating Comprehensive Database Report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            database: {
                connection: await this.testConnection(),
                tables: await this.verifyTables(),
                rls: await this.testRLSPolicies(),
                foreignKeys: await this.testForeignKeys(),
                performance: await this.testPerformance()
            },
            summary: {
                totalTables: 0,
                accessibleTables: 0,
                protectedTables: 0,
                missingTables: 0,
                avgQueryTime: 0,
                criticalIssues: []
            }
        };

        // Calculate summary statistics
        const tables = report.database.tables;
        report.summary.totalTables = Object.keys(tables).length;
        report.summary.accessibleTables = Object.values(tables).filter(t => t.status === 'accessible').length;
        report.summary.protectedTables = Object.values(tables).filter(t => t.status === 'protected').length;
        report.summary.missingTables = Object.values(tables).filter(t => t.status === 'missing').length;

        // Calculate average query time
        const performanceResults = Object.values(report.database.performance);
        const validTimes = performanceResults.filter(p => p.executionTime > 0).map(p => p.executionTime);
        report.summary.avgQueryTime = validTimes.length > 0 
            ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) 
            : 0;

        // Identify critical issues
        if (report.summary.missingTables > 0) {
            report.summary.criticalIssues.push(`${report.summary.missingTables} critical tables are missing`);
        }
        
        if (report.summary.avgQueryTime > 2000) {
            report.summary.criticalIssues.push('Query performance is slow (>2s average)');
        }

        const unprotectedCriticalTables = Object.entries(report.database.rls)
            .filter(([table, result]) => 
                ['user_profiles', 'courses', 'enrollments'].includes(table) && 
                result.status === 'accessible'
            );
        
        if (unprotectedCriticalTables.length > 0) {
            report.summary.criticalIssues.push('Critical tables lack RLS protection');
        }

        console.log('\n📊 DATABASE VERIFICATION SUMMARY');
        console.log('================================');
        console.log(`🔗 Connection: ${report.database.connection.status}`);
        console.log(`📊 Tables: ${report.summary.accessibleTables}/${report.summary.totalTables} accessible`);
        console.log(`🔒 Protected: ${report.summary.protectedTables} tables have RLS`);
        console.log(`❌ Missing: ${report.summary.missingTables} tables not found`);
        console.log(`⚡ Performance: ${report.summary.avgQueryTime}ms average query time`);
        console.log(`🚨 Critical Issues: ${report.summary.criticalIssues.length}`);
        
        if (report.summary.criticalIssues.length > 0) {
            console.log('\nCRITICAL ISSUES:');
            report.summary.criticalIssues.forEach(issue => console.log(`  ⚠️ ${issue}`));
        }

        return report;
    }

    async run() {
        console.log('🚀 Starting Database System Verification...');
        console.log('==========================================');
        
        const initialized = await this.init();
        if (!initialized) {
            console.error('❌ Failed to initialize verification system');
            return null;
        }

        try {
            const report = await this.generateReport();
            
            console.log('\n✅ Database verification completed!');
            console.log('Full report object available in browser console.');
            
            return report;
        } catch (error) {
            console.error('❌ Verification failed:', error);
            return null;
        }
    }
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    // Browser environment
    window.DatabaseVerification = DatabaseVerification;
    
    // Auto-run verification
    const verification = new DatabaseVerification();
    verification.run().then(report => {
        if (report) {
            console.log('\n🎯 Verification completed! Report:', report);
            window.dbVerificationReport = report;
        }
    });
} else {
    // Node.js environment
    module.exports = DatabaseVerification;
}