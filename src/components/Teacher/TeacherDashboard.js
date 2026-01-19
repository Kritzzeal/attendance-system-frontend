import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [absentStudents, setAbsentStudents] = useState([]);
  const teacherId = 13; // Your teacher ID

  // Mock courses for demo
  const mockCourses = [
    { code: 'AEX101', title: 'Communication Skills' },
    { code: 'MAT101', title: 'Mathematics' },
    { code: 'PHY101', title: 'Physics' },
    { code: 'CSE101', title: 'Computer Science' },
  ];

  // Fetch attendance data for selected course
  const fetchAttendanceData = async (courseCode) => {
    if (!teacherId || !courseCode) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token') || 'demo-token';
      const url = `http://localhost:8000/api/v1/attendance/today?teacher_id=${teacherId}&course_code=${courseCode}`;
      
      console.log('Fetching attendance from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        setAttendanceData(data);
        
        // Filter absent students
        if (data.attendance && Array.isArray(data.attendance)) {
          const absent = data.attendance.filter(student => 
            student.status === 'absent' || student.status === 'Absent'
          );
          setAbsentStudents(absent);
          toast.success(`Found ${absent.length} absent students`);
        } else {
          setAbsentStudents([]);
          toast.info('No attendance data found');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      
      // Fallback to mock data for demo
      const mockAttendance = {
        success: true,
        date: new Date().toISOString().split('T')[0],
        summary: {
          total: 45,
          present: 35,
          absent: 8,
          late: 2,
          excused: 0
        },
        count: 45,
        attendance: [
          { student_id: '202501001', student_name: 'John Doe', status: 'present', time: '09:15' },
          { student_id: '202501002', student_name: 'Jane Smith', status: 'absent', time: null },
          { student_id: '202501003', student_name: 'Bob Johnson', status: 'present', time: '09:20' },
          { student_id: '202501004', student_name: 'Alice Brown', status: 'absent', time: null },
          { student_id: '202501005', student_name: 'Charlie Wilson', status: 'late', time: '09:45' },
          { student_id: '202501006', student_name: 'Diana Lee', status: 'present', time: '09:10' },
          { student_id: '202501007', student_name: 'Edward Chen', status: 'absent', time: null },
          { student_id: '202501008', student_name: 'Fiona Wang', status: 'present', time: '09:05' },
          { student_id: '202501009', student_name: 'George Kumar', status: 'absent', time: null },
          { student_id: '202501010', student_name: 'Helen Patel', status: 'present', time: '09:18' },
        ]
      };
      
      setAttendanceData(mockAttendance);
      const absent = mockAttendance.attendance.filter(student => 
        student.status === 'absent'
      );
      setAbsentStudents(absent);
      toast.info('Using demo data. ' + absent.length + ' absent students found.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    // Set mock courses
    setCourses(mockCourses);
    if (mockCourses.length > 0) {
      setSelectedCourse(mockCourses[0].code);
      fetchAttendanceData(mockCourses[0].code);
    }
  }, []);

  // Handle course change
  const handleCourseChange = (e) => {
    const courseCode = e.target.value;
    setSelectedCourse(courseCode);
    fetchAttendanceData(courseCode);
  };

  // Refresh data
  const refreshData = () => {
    if (selectedCourse) {
      fetchAttendanceData(selectedCourse);
    }
  };

  // Get selected course title
  const getSelectedCourseTitle = () => {
    const course = courses.find(c => c.code === selectedCourse);
    return course ? `${course.code} - ${course.title}` : 'No course selected';
  };

  if (loading && !attendanceData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
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
        <p style={{ color: '#666' }}>Loading attendance data...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '25px', 
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Teacher Dashboard</h1>
        <p style={{ color: '#666', margin: '0 0 20px 0' }}>
          Today's Date: {new Date().toLocaleDateString()} • Teacher ID: {teacherId}
        </p>
        
        {/* Course Selector */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#666', 
              fontWeight: '500' 
            }}>
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              style={{ 
                width: '100%',
                maxWidth: '400px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {courses.map(course => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={refreshData}
            style={{ 
              padding: '10px 20px', 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'flex-end'
            }}
          >
            <span>↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {attendanceData?.summary && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Total Students
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
              {attendanceData.summary.total}
            </div>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Present
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#27ae60' }}>
              {attendanceData.summary.present}
            </div>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Absent
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#e74c3c' }}>
              {attendanceData.summary.absent}
            </div>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Attendance %
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#3498db' }}>
              {attendanceData.summary.total ? 
                Math.round((attendanceData.summary.present / attendanceData.summary.total) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Absent Students Section */}
      <div style={{ 
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0', color: '#2c3e50' }}>
            Today's Absent Students
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 'normal', 
              color: '#666',
              marginLeft: '10px'
            }}>
              ({getSelectedCourseTitle()})
            </span>
          </h2>
          <span style={{ 
            padding: '6px 12px',
            background: '#ffebee',
            color: '#e74c3c',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {absentStudents.length} students absent
          </span>
        </div>
        
        {absentStudents.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ 
                  background: '#f8f9fa',
                  borderBottom: '2px solid #eee'
                }}>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '120px'
                  }}>
                    Student ID
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Name
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '100px'
                  }}>
                    Status
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '150px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {absentStudents.map((student, index) => (
                  <tr 
                    key={student.student_id || index}
                    style={{ 
                      borderBottom: '1px solid #eee',
                      transition: 'background 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <td style={{ padding: '15px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {student.student_id}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {student.student_name}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '6px 12px',
                        background: '#ffebee',
                        color: '#e74c3c',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ fontSize: '14px' }}>❌</span>
                        Absent
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            toast.info(`Marking ${student.student_name} as present...`);
                            // Here you would make API call to update status
                          }}
                          style={{ 
                            padding: '6px 12px',
                            background: '#d4edda',
                            color: '#155724',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>✓</span>
                          Mark Present
                        </button>
                        <button
                          onClick={() => {
                            toast.info(`Sending notification to ${student.student_name}...`);
                            // Here you would implement notification
                          }}
                          style={{ 
                            padding: '6px 12px',
                            background: '#d1ecf1',
                            color: '#0c5460',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>📱</span>
                          Notify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: '#95a5a6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#95a5a6' }}>
              No Absent Students Today!
            </h3>
            <p style={{ margin: '0', fontSize: '14px' }}>
              All students are present in {getSelectedCourseTitle()}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions for Absent Students */}
      {absentStudents.length > 0 && (
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>
            Quick Actions for Absent Students
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <button
              onClick={() => {
                toast.success(`Marking all ${absentStudents.length} absent students as present...`);
                // Here you would update all absent students
              }}
              style={{ 
                padding: '15px',
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '20px' }}>✓✓</span>
              Mark All as Present
            </button>
            <button
              onClick={() => {
                toast.success(`Sending notifications to all ${absentStudents.length} absent students...`);
                // Here you would send notifications
              }}
              style={{ 
                padding: '15px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '20px' }}>📢</span>
              Notify All Absent
            </button>
            <button
              onClick={() => {
                const names = absentStudents.map(s => s.student_name).join(', ');
                toast.info(`Absent students: ${names}`);
              }}
              style={{ 
                padding: '15px',
                background: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '20px' }}>📋</span>
              Copy Absent List
            </button>
          </div>
        </div>
      )}

      {/* API Info */}
      <div style={{ 
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '15px',
        fontSize: '12px',
        color: '#666',
        borderLeft: '4px solid #3498db'
      }}>
        <div style={{ marginBottom: '5px' }}>
          <strong>Current API Request:</strong>{' '}
          <code>
            GET /api/v1/attendance/today?teacher_id={teacherId}&course_code={selectedCourse}
          </code>
        </div>
        <div style={{ fontSize: '11px', color: '#3498db' }}>
          {attendanceData?.date ? `Date: ${attendanceData.date} • ` : ''}
          {absentStudents.length} absent student(s) found • 
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;