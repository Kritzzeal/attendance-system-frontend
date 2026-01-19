// components/Admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { api } from '../../App'; // Import the API service

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_teachers: 0,
    total_courses: 0,
    total_students: 0,
    total_attendance_records: 0
  });
  const [recent, setRecent] = useState({
    courses: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/stats');
      
      if (data.success) {
        setStats(data.stats);
        setRecent(data.recent || { courses: [], students: [] });
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666' }}>Loading dashboard data...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: '#ffebee',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '30px', color: '#2c3e50' }}>Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[
          { 
            key: 'total_users', 
            title: 'Total Users', 
            icon: '👥',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          },
          { 
            key: 'total_teachers', 
            title: 'Teachers', 
            icon: '👨‍🏫',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
          },
          { 
            key: 'total_students', 
            title: 'Students', 
            icon: '👨‍🎓',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
          },
          { 
            key: 'total_courses', 
            title: 'Courses', 
            icon: '📚',
            color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
          },
          { 
            key: 'total_attendance_records', 
            title: 'Attendance Records', 
            icon: '📊',
            color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' 
          }
        ].map((stat) => (
          <div 
            key={stat.key}
            style={{ 
              background: stat.color,
              color: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>
              {stat.icon}
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: '0.9' }}>
              {stat.title}
            </h3>
            <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>
              {formatNumber(stats[stat.key])}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Data Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Recent Courses */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 15px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: '0', color: '#2c3e50' }}>Recent Courses</h3>
          {recent.courses && recent.courses.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {recent.courses.slice(0, 5).map((course, index) => (
                <div key={index} style={{ 
                  padding: '10px',
                  borderBottom: index < recent.courses.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{course.code}</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>{course.title}</div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#3498db',
                    background: '#ebf5ff',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {course.credits} Credits
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              color: '#95a5a6'
            }}>
              No recent courses
            </div>
          )}
        </div>

        {/* Recent Students */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 15px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: '0', color: '#2c3e50' }}>Recent Students</h3>
          {recent.students && recent.students.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {recent.students.slice(0, 5).map((student, index) => (
                <div key={index} style={{ 
                  padding: '10px',
                  borderBottom: index < recent.students.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{ 
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#3498db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{student.name}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      ID: {student.student_id} | Section: {student.theory_section}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              color: '#95a5a6'
            }}>
              No recent students
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '10px 30px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 auto'
          }}
        >
          <span>↻</span>
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;