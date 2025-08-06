import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const TimeTrackingDebug = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    timeEntries: [],
    leaveRequests: [],
    userProfiles: [],
    error: null
  });

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    try {
      // Load time entries
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .limit(10);

      // Load leave requests
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .limit(10);

      // Load user profiles
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, role')
        .limit(10);

      setData({
        timeEntries: timeEntries || [],
        leaveRequests: leaveRequests || [],
        userProfiles: userProfiles || [],
        error: timeError || leaveError || userError
      });
    } catch (err) {
      setData(prev => ({ ...prev, error: err.message }));
    }
  };

  const createSampleTimeEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          company: 'login',
          entry_date: new Date().toISOString().split('T')[0],
          check_in_time: new Date().toISOString(),
          status: 'pending',
          check_in_location: {
            latitude: 13.7563,
            longitude: 100.5018
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating sample time entry:', error);
        alert(`Error: ${error.message}`);
      } else {
        console.log('Created sample time entry:', data);
        alert('Sample time entry created successfully!');
        loadDebugData();
      }
    } catch (err) {
      console.error('Error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const createMultiStatusTimeEntries = async () => {
    if (!user) return;
    
    try {
      const entries = [
        {
          user_id: user.id,
          company: 'login',
          entry_date: '2025-08-05',
          check_in_time: '2025-08-05T08:00:00',
          check_out_time: '2025-08-05T17:00:00',
          total_hours: 8.0,
          regular_hours: 8.0,
          overtime_hours: 0.0,
          entry_type: 'teaching',
          status: 'pending',
          work_description: 'Teaching React fundamentals'
        },
        {
          user_id: user.id,
          company: 'login',
          entry_date: '2025-08-04',
          check_in_time: '2025-08-04T09:00:00',
          check_out_time: '2025-08-04T18:30:00',
          total_hours: 8.5,
          regular_hours: 8.0,
          overtime_hours: 0.5,
          entry_type: 'meeting',
          status: 'approved',
          work_description: 'Team meeting and project planning',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        },
        {
          user_id: user.id,
          company: 'login',
          entry_date: '2025-08-03',
          check_in_time: '2025-08-03T08:30:00',
          check_out_time: '2025-08-03T17:30:00',
          total_hours: 8.0,
          regular_hours: 8.0,
          overtime_hours: 0.0,
          entry_type: 'prep',
          status: 'pending',
          work_description: 'Preparing course materials'
        }
      ];

      const { data, error } = await supabase
        .from('time_entries')
        .insert(entries);

      if (error) throw error;
      
      alert('Multi-status time entries created successfully!');
      loadDebugData();
    } catch (error) {
      console.error('Error creating entries:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const createSampleLeaveRequests = async () => {
    if (!user) return;
    
    try {
      const requests = [
        {
          user_id: user.id,
          company: 'login',
          leave_type: 'vacation',
          start_date: '2025-08-10',
          end_date: '2025-08-12',
          total_days: 3,
          reason: 'Family vacation trip',
          status: 'pending'
        },
        {
          user_id: user.id,
          company: 'login',
          leave_type: 'sick',
          start_date: '2025-08-06',
          end_date: '2025-08-06',
          total_days: 1,
          reason: 'Medical appointment',
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        },
        {
          user_id: user.id,
          company: 'login',
          leave_type: 'personal',
          start_date: '2025-08-15',
          end_date: '2025-08-16',
          total_days: 2,
          reason: 'Personal business',
          status: 'pending'
        }
      ];

      const { data, error } = await supabase
        .from('leave_requests')
        .insert(requests);

      if (error) throw error;
      
      alert('Sample leave requests created successfully!');
      loadDebugData();
    } catch (error) {
      console.error('Error creating leave requests:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Time Tracking Debug Panel</h2>
        
        <div className="mb-4 space-x-2">
          <button
            onClick={createSampleTimeEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Sample Time Entry
          </button>
          <button
            onClick={createMultiStatusTimeEntries}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Multi-Status Entries
          </button>
          <button
            onClick={createSampleLeaveRequests}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create Sample Leave Requests
          </button>
        </div>

        {data.error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
            Error: {data.error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Time Entries ({data.timeEntries.length}):</h3>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data.timeEntries, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Leave Requests ({data.leaveRequests.length}):</h3>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data.leaveRequests, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">User Profiles ({data.userProfiles.length}):</h3>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data.userProfiles, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingDebug;