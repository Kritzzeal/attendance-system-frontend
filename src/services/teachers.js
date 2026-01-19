// src/services/teachers.js - UPDATED VERSION
import api from './api';

export const teacherService = {
  // Get all teachers
  getAllTeachers: async () => {
    try {
      const response = await api.get('/teachers');
      console.log('Teachers API response:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      } else if (response.data.teachers) {
        return { success: true, data: response.data.teachers };
      } else if (response.data.data) {
        return { success: true, data: response.data.data };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Get teachers error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load teachers'
      };
    }
  },

  // Get teachers dropdown
  getTeachersDropdown: async (courseCode = null) => {
    try {
      const params = courseCode ? { course_code: courseCode } : {};
      const response = await api.get('/teachers/dropdown', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load teachers dropdown'
      };
    }
  },

  // Create teacher
  createTeacher: async (teacherData) => {
    try {
      const response = await api.post('/teachers/create', teacherData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create teacher'
      };
    }
  },

  // Import teachers from Excel
  importTeachers: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/teachers/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to import teachers'
      };
    }
  },

  // Get teacher assignments
  getAssignments: async (teacherId = null, courseCode = null) => {
    try {
      const params = {};
      if (teacherId) params.teacher_id = teacherId;
      if (courseCode) params.course_code = courseCode;
      
      const response = await api.get('/teachers/assignments', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load assignments'
      };
    }
  },

  // Assign teacher to course
  assignTeacherToCourse: async (assignmentData) => {
    try {
      const response = await api.post('/teachers/assign', assignmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to assign teacher'
      };
    }
  },

  // Remove assignment
  removeAssignment: async (assignmentId) => {
    try {
      const response = await api.delete(`/teachers/assign/${assignmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to remove assignment'
      };
    }
  },

  // Get my courses (for teachers)
  getMyCourses: async () => {
    try {
      // First, we need to get the teacher ID from the current user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const teacherId = user.id || user.teacher_id;
      
      if (!teacherId) {
        return { success: false, error: 'Teacher ID not found' };
      }
      
      // Use the attendance endpoint for teacher courses
      const response = await api.get('/attendance/teacher/courses', {
        params: { teacher_id: teacherId }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load my courses'
      };
    }
  },

  // Reset password (if you implement this endpoint)
  resetPassword: async (teacherId) => {
    try {
      const response = await api.post(`/admin/reset-password/${teacherId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to reset password'
      };
    }
  }
};