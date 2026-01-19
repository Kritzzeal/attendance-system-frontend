import API from './api';

export const adminService = {
  // Dashboard statistics - Updated to match your backend endpoint
  getDashboardStats: () => API.get('/admin/stats'),
  
  // Get system logs
  getSystemLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return API.get(`/admin/logs${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get all users
  getAllUsers: () => API.get('/admin/users'),
  
  // Get all teachers
  getAllTeachers: () => API.get('/admin/teachers'),
  
  // Get all courses
  getAllCourses: () => API.get('/admin/courses'),
  
  // Get all students
  getAllStudents: () => API.get('/admin/students'),
  
  // Update user role
  updateUserRole: (userId, role) => API.put(`/admin/users/${userId}/role`, { role }),
  
  // System settings
  getSettings: () => API.get('/admin/settings'),
  updateSettings: (settings) => API.put('/admin/settings', settings),
  
  // Backup database
  backupDatabase: () => API.get('/admin/backup', {
    responseType: 'blob',
  }),
  
  // Restore database
  restoreDatabase: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/admin/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};