// src/services/attendance.js - FIXED VERSION
import api from './api';

export const attendanceService = {
  // Mark attendance
  markAttendance: async (attendanceData) => {
    try {
      // Get teacher ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const teacherId = user.id || user.teacher_id;
      
      if (!teacherId) {
        return { success: false, error: 'Teacher ID not found. Please login again.' };
      }
      
      const response = await api.post('/attendance/mark', attendanceData, {
        params: { teacher_id: teacherId }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Mark attendance error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to mark attendance'
      };
    }
  },

  // Get students for attendance
  getStudentsForAttendance: async (courseCode, sessionType, sectionBatch) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const teacherId = user.id || user.teacher_id;
      
      if (!teacherId) {
        return { success: false, error: 'Teacher ID not found' };
      }
      
      const response = await api.get('/attendance/students-list', {
        params: {
          course_code: courseCode,
          session_type: sessionType,
          section_batch: sectionBatch,
          teacher_id: teacherId
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get students error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load students'
      };
    }
  },

  // Get teacher courses
  getTeacherCourses: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const teacherId = user.id || user.teacher_id;
      
      if (!teacherId) {
        return { success: false, error: 'Teacher ID not found' };
      }
      
      const response = await api.get('/attendance/teacher/courses', {
        params: { teacher_id: teacherId }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get teacher courses error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load courses'
      };
    }
  },

  // Get today's attendance
  getTodayAttendance: async (filters = {}) => {
    try {
      const params = {};
      if (filters.teacherId) params.teacher_id = filters.teacherId;
      if (filters.courseCode) params.course_code = filters.courseCode;
      
      const response = await api.get('/attendance/today', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get today attendance error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load today\'s attendance'
      };
    }
  },

  // Get student attendance
  getStudentAttendance: async (studentId, filters = {}) => {
    try {
      const params = {};
      if (filters.courseCode) params.course_code = filters.courseCode;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      
      const response = await api.get(`/attendance/student/${studentId}`, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get student attendance error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load student attendance'
      };
    }
  }
};