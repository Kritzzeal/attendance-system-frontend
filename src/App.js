import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import AdminDashboard component
import AdminDashboard from './components/Admin/AdminDashboard';

// Other components
import TeacherManagement from './components/Admin/Teachers/TeacherManagement';
import CourseManagement from './components/Admin/Course/CourseManagement';
import StudentManagement from './components/Admin/Students/StudentManagement';
import AdminAttendance from './components/Admin/AttendanceManagement'; 
import TeacherAttendance from './components/Teacher/MarkAttendance';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import CourseList from './components/Teacher/CourseList';
import StudentList from './components/Teacher/StudentList';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
// API Service
const createApiService = () => {
  const baseURL = 'https://attendance-system-production-5149.up.railway.app/api/v1';
  
  const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      toast.error(`API Error: ${error.message}`);
      throw error;
    }
  };

  return {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, data) => 
      request(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    put: (endpoint, data) => 
      request(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  };
};

export const api = createApiService();

// Login Component - MODIFIED TO USE REAL BACKEND
// Login Component - UPDATED TO CHECK ADMIN FROM DATABASE
// Login Component - UPDATED TO USE /auth/profile ENDPOINT
// Login Component - SINGLE FORM ONLY
// Login Component - WITH VALIDATION
// Login Component - WITH IMPROVED EMAIL VALIDATION
const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Improved email validation regex
  const validateEmail = (email) => {
    // Must contain @ and at least one dot after @
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Detailed email validation with specific error messages
  const validateEmailWithDetails = (email) => {
    if (!email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    
    // Check for @ symbol
    if (!email.includes('@')) {
      return { isValid: false, message: 'Email must contain @ symbol' };
    }
    
    // Check for at least one dot after @
    const parts = email.split('@');
    if (parts.length < 2) {
      return { isValid: false, message: 'Invalid email format' };
    }
    
    const domain = parts[1];
    if (!domain.includes('.')) {
      return { isValid: false, message: 'Email must contain domain (e.g., example.com)' };
    }
    
    // Check domain has text after last dot
    const domainParts = domain.split('.');
    const lastPart = domainParts[domainParts.length - 1];
    if (lastPart.length < 2) {
      return { isValid: false, message: 'Domain extension is too short' };
    }
    
    // Final regex validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true, message: '' };
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      general: ''
    };
    let isValid = true;

    // Email validation with detailed feedback
    const emailValidation = validateEmailWithDetails(credentials.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
      isValid = false;
    }

    // Password validation
    if (!credentials.password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (credentials.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
      isValid = false;
    } else if (credentials.password.includes(' ')) {
      newErrors.password = 'Password cannot contain spaces';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginAttempted(true);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setErrors({...errors, general: ''}); // Clear any previous general errors

      console.log('Attempting login for:', credentials.email);
      
      // 1. Login to get the token
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || 
                            errorData.message || 
                            `Login failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received from server');
      }

      // Store token in localStorage
      const token = data.access_token;
      localStorage.setItem('token', token);
      
      // 2. Get user profile to determine role
      console.log('Getting user profile...');
      const profileResponse = await fetch('http://localhost:8000/api/v1/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        throw new Error(`Failed to get user profile (${profileResponse.status})`);
      }

      const userProfile = await profileResponse.json();
      console.log('User profile:', userProfile);
      
      // Create user object with role FROM DATABASE
      const userData = {
        email: userProfile.email || credentials.email,
        name: userProfile.name || credentials.email.split('@')[0],
        role: userProfile.role, // This should be 'admin' or 'teacher'
        token: token,
        id: userProfile.id,
        teacher_id: userProfile.teacher_id
      };
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Show success message
      toast.success(`Welcome, ${userData.name}!`);
      
      // Redirect based on ACTUAL ROLE FROM DATABASE
      setTimeout(() => {
        if (userProfile.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/teacher/dashboard';
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      
      // Set specific error message
      let errorMessage = error.message || 'Login failed. Please check your credentials.';
      
      // Check for common error patterns
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'User not found. Please check your email address.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setErrors({
        ...errors,
        general: errorMessage
      });
      
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (loginAttempted) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const handleResetForm = () => {
    setCredentials({
      email: '',
      password: '',
    });
    setErrors({
      email: '',
      password: '',
      general: ''
    });
    setLoginAttempted(false);
  };

  const handleInputBlur = (e) => {
    const { name } = e.target;
    if (loginAttempted) {
      validateForm();
    }
  };

  // Email validation helper text
  const getEmailHelperText = () => {
    if (!credentials.email || errors.email) return '';
    
    const hasAt = credentials.email.includes('@');
    const hasDotAfterAt = credentials.email.includes('@') && 
                         credentials.email.split('@')[1].includes('.');
    
    if (!hasAt) {
      return '❌ Missing @ symbol';
    } else if (!hasDotAfterAt) {
      return '❌ Missing dot in domain (e.g., example.com)';
    } else if (validateEmail(credentials.email)) {
      return '✅ Valid email format';
    }
    return '';
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#2c3e50',
          marginBottom: '30px'
        }}>
          📚 Attendance System
        </h1>
        
        {/* General Error Message */}
        {errors.general && (
          <div style={{ 
            marginBottom: '20px',
            padding: '12px',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            fontSize: '14px',
            border: '1px solid #f5c6cb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>❌</span>
              <strong>Login Failed</strong>
            </div>
            <p style={{ margin: '0', fontSize: '13px' }}>{errors.general}</p>
            <button 
              onClick={handleResetForm}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                background: 'transparent',
                color: '#721c24',
                border: '1px solid #721c24',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: '#555',
              fontWeight: '500'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="teacher@college.edu"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border 0.3s',
                backgroundColor: errors.email ? '#fff8f8' : 'white'
              }}
              disabled={loading}
              required
              onFocus={(e) => e.target.style.borderColor = errors.email ? '#dc3545' : '#667eea'}
            />
            
            {/* Email helper text */}
            {getEmailHelperText() && !errors.email && (
              <div style={{
                color: '#28a745',
                fontSize: '11px',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                fontStyle: 'italic'
              }}>
                <span style={{ marginRight: '5px' }}>💡</span>
                {getEmailHelperText()}
              </div>
            )}
            
            {/* Email error message */}
            {errors.email && (
              <div style={{
                color: '#dc3545',
                fontSize: '12px',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '5px' }}>⚠️</span>
                {errors.email}
              </div>
            )}
            
            {/* Email format hint */}
            <div style={{
              fontSize: '11px',
              color: '#6c757d',
              marginTop: '5px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px',
              border: '1px dashed #dee2e6'
            }}>
              <strong>Format:</strong> name@domain.extension (e.g., teacher@college.edu)
            </div>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: '#555',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.password ? '#dc3545' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border 0.3s',
                backgroundColor: errors.password ? '#fff8f8' : 'white'
              }}
              disabled={loading}
              required
              onFocus={(e) => e.target.style.borderColor = errors.password ? '#dc3545' : '#667eea'}
            />
            {errors.password && (
              <div style={{
                color: '#dc3545',
                fontSize: '12px',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '5px' }}>⚠️</span>
                {errors.password}
              </div>
            )}
            
            {/* Password strength hint */}
            {credentials.password && !errors.password && (
              <div style={{
                fontSize: '11px',
                color: credentials.password.length >= 6 ? '#28a745' : '#ffc107',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '5px' }}>
                  {credentials.password.length >= 6 ? '✅' : '💡'}
                </span>
                Password strength: {credentials.password.length >= 6 ? 'Good' : 'Weak'} 
                ({credentials.password.length} chars)
              </div>
            )}
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%',
              padding: '15px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              opacity: loading ? 0.7 : 1,
              marginBottom: '15px'
            }}
          >
            {loading ? '🔐 Authenticating...' : 'Login'}
          </button>
        </form>

        {/* Help Text */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
          border: '1px solid #e9ecef'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>
            Need Help?
          </p>
          <p style={{ margin: '0', fontSize: '11px' }}>
            Ensure you're using the correct email and password provided by your institution.
          </p>
          {loginAttempted && (
            <button 
              onClick={handleResetForm}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                background: 'transparent',
                color: '#6c757d',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Clear Form & Start Over
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Teacher routes components (keeping them for compatibility)
const MyClasses = () => (
  <div style={{ padding: '30px' }}>
    <h1>My Classes</h1>
    <p>Welcome teacher! Here are your assigned classes.</p>
    <div style={{ marginTop: '20px' }}>
      <h3>Your Courses:</h3>
      <ul>
        <li>Course 1 - Theory Section A</li>
        <li>Course 2 - Practical Section B</li>
        <li>Course 3 - Lab Section C</li>
      </ul>
      <div style={{ marginTop: '20px' }}>
        <a href="/teacher/mark-attendance" style={{ padding: '10px 20px', background: '#3498db', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Mark Attendance
        </a>
      </div>
    </div>
  </div>
);

const MarkAttendance = () => (
  <div style={{ padding: '30px' }}>
    <h1>Mark Attendance</h1>
    <p>Mark attendance for your class.</p>
    <div style={{ marginTop: '20px' }}>
      <a href="/teacher/my-classes" style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        Back to My Classes
      </a>
    </div>
  </div>
);

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        {user.email && <Navbar />}
        <div style={{ 
          display: 'flex',
          minHeight: user.email ? 'calc(100vh - 70px)' : '100vh',
          marginTop: user.email ? '70px' : '0'
        }}>
          {user.email && <Sidebar />}
          <main style={{ 
            flex: 1,
            padding: user.email ? '20px' : '0',
            marginLeft: user.email ? '250px' : '0',
            transition: 'margin-left 0.3s',
            overflow: 'auto'
          }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/teachers" element={
                <ProtectedRoute requiredRole="admin">
                  <TeacherManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/students" element={
                <ProtectedRoute requiredRole="admin">
                  <StudentManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/attendance" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAttendance />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/courses" element={
                <ProtectedRoute requiredRole="admin">
                  <CourseManagement />
                </ProtectedRoute>
              } />
              
              {/* Teacher Routes */}
              
              <Route path="/teacher/students" element={
                <ProtectedRoute requiredRole="teacher">
                  <StudentList />
                </ProtectedRoute>
              } />
              <Route path="/teacher/my-courses" element={
                <ProtectedRoute requiredRole="teacher">
                  <CourseList />
                </ProtectedRoute>
              } />
              
              <Route path="/teacher/mark-attendance" element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherAttendance />
                </ProtectedRoute>
              } />
              <Route path="/teacher/dashboard" element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              
              {/* Default Route */}
              <Route path="/" element={
                <ProtectedRoute>
                  {() => {
                    if (user.role === 'admin') {
                      return <Navigate to="/admin/dashboard" replace />;
                    } else if (user.role === 'teacher') {
                      return <Navigate to="/teacher/dashboard" replace />;
                    } else {
                      return <Navigate to="/login" replace />;
                    }
                  }}
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

// ProtectedRoute component
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    toast.error(`Access denied. Requires ${requiredRole} role.`);
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/teacher/dashboard" replace />;
    }
  }
  
  return children;
};

export default App;
