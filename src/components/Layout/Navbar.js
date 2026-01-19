// src/components/Layout/Navbar.jsx - SIMPLIFIED VERSION
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link 
          to={user.role === 'admin' ? '/admin/dashboard' : 
              user.role === 'teacher' ? '/teacher/dashboard' :
              user.role === 'student' ? '/student/dashboard' : '/'} 
          style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 'bold' }}
        >
          🎓 Attendance System
        </Link>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user.email ? (
          <>
            <span style={{ fontSize: '14px' }}>
              Welcome, <strong>{user.name || user.email}</strong>
              {user.role && <span style={{ marginLeft: '10px', backgroundColor: '#3498db', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>
                {user.role}
              </span>}
            </span>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;