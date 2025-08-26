// This file contains the fixed queries for time tracking service
// Replace the problematic queries in timeTrackingService.js with these

// For getTimeEntriesForReview function (around line 640):
export const getTimeEntriesForReview = async (company = null, status = 'pending') => {
  try {
    // First get time entries
    let query = supabase
      .from('time_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('check_in_time', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: entries, error } = await query;
    if (error) throw error;

    // Then get user profiles separately
    if (entries && entries.length > 0) {
      const userIds = [...new Set(entries.map(entry => entry.user_id))];
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, role')
        .in('user_id', userIds);

      if (usersError) {
        } else if (users) {
        // Map users to entries
        const userMap = users.reduce((map, user) => {
          map[user.user_id] = user;
          return map;
        }, {});

        entries.forEach(entry => {
          entry.user = userMap[entry.user_id] || null;
        });
      }
    }

    return { data: entries || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching time entries for review') };
  }
};

// For getLeaveRequestsForReview function (around line 672):
export const getLeaveRequestsForReview = async (company = null, status = 'pending') => {
  try {
    // First get leave requests
    let query = supabase
      .from('leave_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;
    if (error) throw error;

    // Then get user profiles separately
    if (requests && requests.length > 0) {
      const userIds = [...new Set(requests.map(req => req.user_id).filter(id => id))];
      const reviewerIds = [...new Set(requests.map(req => req.reviewed_by).filter(id => id))];
      const allUserIds = [...new Set([...userIds, ...reviewerIds])];
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, role, department')
        .in('user_id', allUserIds);

      if (usersError) {
        } else if (users) {
        // Map users to requests
        const userMap = users.reduce((map, user) => {
          map[user.user_id] = user;
          return map;
        }, {});

        requests.forEach(request => {
          request.user = userMap[request.user_id] || null;
          request.reviewer = request.reviewed_by ? userMap[request.reviewed_by] : null;
        });
      }
    }

    return { data: requests || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching leave requests for review') };
  }
};

// For getUserTimeEntries function (around line 213):
export const getUserTimeEntries = async (userId, startDate = null, endDate = null) => {
  try {
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('check_in_time', { ascending: false });

    if (startDate) {
      query = query.gte('entry_date', startDate);
    }

    if (endDate) {
      query = query.lte('entry_date', endDate);
    }

    const { data: entries, error } = await query;
    if (error) throw error;

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('user_id', userId)
      .single();

    if (!userError && userProfile && entries) {
      entries.forEach(entry => {
        entry.user = userProfile;
      });
    }

    return { data: entries || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching user time entries') };
  }
};

// For getUserLeaveRequests function (around line 373):
export const getUserLeaveRequests = async (userId) => {
  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    // Get user profiles for the requests
    if (requests && requests.length > 0) {
      const reviewerIds = [...new Set(requests.map(req => req.reviewed_by).filter(id => id))];
      
      if (reviewerIds.length > 0) {
        const { data: reviewers, error: reviewersError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', reviewerIds);

        if (!reviewersError && reviewers) {
          const reviewerMap = reviewers.reduce((map, reviewer) => {
            map[reviewer.user_id] = reviewer;
            return map;
          }, {});

          requests.forEach(request => {
            request.reviewer = request.reviewed_by ? reviewerMap[request.reviewed_by] : null;
          });
        }
      }
    }

    return { data: requests || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching user leave requests') };
  }
};