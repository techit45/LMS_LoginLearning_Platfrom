import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const DatabaseHealthCheck = ({ isOpen, onClose }) => {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);

  const healthChecks = [
    {
      name: 'Supabase Connection',
      test: async () => {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        // Simple connection test
        const { error } = await supabase.from('courses').select('count').limit(1);
        if (error) throw error;
        return 'Connected successfully';
      }
    },
    {
      name: 'Courses Table Access',
      test: async () => {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, is_active')
          .limit(1);
        
        if (error) throw error;
        return `Found ${data?.length || 0} courses (limited to 1)`;
      }
    },
    {
      name: 'User Authentication',
      test: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user ? `Authenticated as: ${user.email}` : 'Not authenticated';
      }
    },
    {
      name: 'RLS Policies Check',
      test: async () => {
        // Test if we can access courses without authentication
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('is_active', true)
          .limit(1);
        
        if (error) {
          throw new Error(`RLS Error: ${error.message}`);
        }
        return `RLS working, can access ${data?.length || 0} active courses`;
      }
    },
    {
      name: 'Enrollments Table Access',
      test: async () => {
        const { data, error } = await supabase
          .from('enrollments')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        return 'Enrollments table accessible';
      }
    },
    {
      name: 'Storage Access',
      test: async () => {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        
        const courseFilesBucket = data?.find(bucket => bucket.name === 'course-files');
        return courseFilesBucket ? 'Storage buckets accessible' : 'course-files bucket not found';
      }
    }
  ];

  const runHealthCheck = async () => {
    setLoading(true);
    const results = [];

    for (const check of healthChecks) {
      try {
        const result = await check.test();
        results.push({
          name: check.name,
          status: 'success',
          message: result
        });
      } catch (error) {
        results.push({
          name: check.name,
          status: 'error',
          message: error.message
        });
      }
    }

    setChecks(results);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const fixCommonIssues = async () => {
    console.log('Attempting to fix common issues...');
    
    // Try to refresh the session
    try {
      await supabase.auth.refreshSession();
      console.log('Session refreshed');
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }

    // Re-run health checks
    runHealthCheck();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-effect p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Database className="w-6 h-6 mr-2 text-[#667eea]" />
            Database Health Check
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthCheck}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea] mx-auto mb-4"></div>
            <p className="text-slate-400">Running health checks...</p>
          </div>
        )}

        {!loading && checks.length > 0 && (
          <div className="space-y-4">
            {checks.map((check, index) => (
              <motion.div
                key={check.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-4 rounded-lg border-2 transition-colors
                  ${check.status === 'success' ? 'border-green-500/30 bg-green-500/10' :
                    check.status === 'error' ? 'border-red-500/30 bg-red-500/10' :
                    'border-yellow-500/30 bg-yellow-500/10'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(check.status)}
                    <h3 className="font-medium text-white ml-3">{check.name}</h3>
                  </div>
                </div>
                <p className={`
                  text-sm mt-2 ml-8
                  ${check.status === 'success' ? 'text-green-300' :
                    check.status === 'error' ? 'text-red-300' :
                    'text-yellow-300'}
                `}>
                  {check.message}
                </p>
              </motion.div>
            ))}

            {/* Summary */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-medium text-white mb-2">Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {checks.filter(c => c.status === 'success').length}
                  </div>
                  <div className="text-sm text-slate-400">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {checks.filter(c => c.status === 'warning').length}
                  </div>
                  <div className="text-sm text-slate-400">Warnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {checks.filter(c => c.status === 'error').length}
                  </div>
                  <div className="text-sm text-slate-400">Failed</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {checks.some(c => c.status === 'error') && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={fixCommonIssues}
                  className="bg-[#667eea] hover:bg-[#5a6fcf]"
                >
                  Try Auto-Fix
                </Button>
              </div>
            )}

            {/* Troubleshooting Tips */}
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
              <h3 className="font-medium text-white mb-2">Troubleshooting Tips</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Check if your internet connection is stable</li>
                <li>• Verify Supabase project is active and not paused</li>
                <li>• Ensure RLS policies allow public access to courses table</li>
                <li>• Check if any recent schema changes broke compatibility</li>
                <li>• Verify storage buckets are properly configured</li>
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DatabaseHealthCheck;