// src/components/Layout/Sidebar.jsx - SIMPLIFIED VERSION
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Don't show sidebar if not logged in
  if (!user.email) {
    return null;
  }
  
  const navItems = [];
  
  // Add items based on role
  if (user.role === 'admin') {
    navItems.push(
      { path: '/admin/dashboard', label: 'Admin Dashboard', emoji: '📊' },
      { path: '/admin/courses', label: 'Course Management', emoji: '📚' },
      { path: '/admin/students', label: 'Student Management', emoji: '👨‍🎓' },
      { path: '/admin/teachers', label: 'Teacher Management', emoji: '👨‍🏫' },
      { path: '/admin/attendance', label: 'Attendance', emoji: '✓' },
      { path: '/admin/teacher/courses', label: 'Course Assignment', emoji: ' ◀️ ' }
    );
  } else if (user.role === 'teacher') {
    navItems.push(
      { path: '/teacher/dashboard', label: 'Dashboard', emoji: '📊' },
      { path: '/teacher/my-courses', label: 'Courses', emoji: '📚' },
      { path: '/teacher/students', label: 'Students', emoji: '👨‍🎓' },
      { path: '/teacher/mark-attendance', label: 'Mark Attendance', emoji: '✓' }
    );
  } else if (user.role === 'student') {
    navItems.push(
      { path: '/student/dashboard', label: 'Dashboard', emoji: '📊' },
      { path: '/student/my-courses', label: 'My Courses', emoji: '📚' },
      { path: '/student/attendance', label: 'My Attendance', emoji: '✓' }
    );
  }
  
  // Common items for all roles (optional - you can remove if not needed)
  // navItems.push(
  //   { path: '/settings', label: 'Settings', emoji: '⚙️' }
  // );

  return (
    <div style={{
      width: '250px',
      minHeight: 'calc(100vh - 70px)',
      backgroundColor: '#34495e',
      color: 'white',
      position: 'fixed',
      top: '70px',
      left: 0,
      paddingTop: '20px',
      overflowY: 'auto'
    }}>
      <div style={{ padding: '0 20px' }}>
        <h4 style={{ marginBottom: '20px', color: '#ecf0f1' }}>Navigation</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={index}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 15px',
                  color: isActive ? '#2c3e50' : 'white',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#ecf0f1' : 'transparent',
                  borderRadius: '8px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '20px', marginRight: '10px' }}>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        
        {/* User info at bottom */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Account Info</div>
          <div>Role: {user.role || 'Not set'}</div>
          <div>Email: {user.email || 'Not logged in'}</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;