import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';

export const useAdminStats = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_teachers: 0,
    total_courses: 0,
    total_students: 0,
    last_updated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboardStats();
      
      // Format the response data
      const formattedStats = {
        total_users: response.total_users || 0,
        total_teachers: response.total_teachers || 0,
        total_courses: response.total_courses || 0,
        total_students: response.total_students || 0,
        last_updated: response.last_updated || new Date().toISOString(),
      };
      
      setStats(formattedStats);
      
      // Format last updated time for display
      if (response.last_updated) {
        const date = new Date(response.last_updated);
        setLastUpdated(date.toLocaleString());
      }
      
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard statistics');
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Optional: Refresh stats every 30 seconds
    const intervalId = setInterval(fetchStats, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchStats]);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refetch,
  };
};