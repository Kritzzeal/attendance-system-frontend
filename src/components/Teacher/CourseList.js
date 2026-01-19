import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/admin/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Courses data:', data);
      
      // Handle both array and object response formats
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else if (data.data && Array.isArray(data.data)) {
        setCourses(data.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <p style={{ color: '#666' }}>Loading courses...</p>
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
    <div style={{ padding: '30px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{ margin: '0', color: '#2c3e50' }}>Available Courses</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            View all courses • Total: {courses.length} courses
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchCourses}
            style={{ 
              padding: '10px 20px', 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <span>↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ 
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search courses by title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Courses Table */}
      <div style={{ 
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: '0', color: '#2c3e50' }}>
            Courses ({filteredCourses.length} of {courses.length})
          </h3>
        </div>
        
        {filteredCourses.length === 0 ? (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: '#95a5a6'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📚</div>
            <p style={{ fontSize: '16px', margin: '0' }}>
              {searchTerm ? 'No courses match your search' : 'No courses available'}
            </p>
          </div>
        ) : (
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
                    width: '100px'
                  }}>
                    Course Code
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Title
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '80px'
                  }}>
                    Year
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '100px'
                  }}>
                    Semester
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '80px'
                  }}>
                    Credits
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '120px'
                  }}>
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr 
                    key={course.code}
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
                    <td style={{ padding: '15px' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#2c3e50',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}>
                        {course.code}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {course.title}
                      </div>
                      {course.course_type && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          marginTop: '5px'
                        }}>
                          Type: {course.course_type}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: '#e8f4fd',
                        color: '#3498db',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {course.year}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: '#f0e6ff',
                        color: '#9b59b6',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Semester {course.semester}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontWeight: '500', color: '#2c3e50' }}>
                      {course.credits} credits
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: course.has_theory && course.has_practical ? '#d4edda' : 
                                  course.has_theory ? '#fff3cd' : '#ffeaa7',
                        color: course.has_theory && course.has_practical ? '#155724' : 
                              course.has_theory ? '#856404' : '#856404',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {course.has_theory && course.has_practical ? 'Theory & Practical' :
                         course.has_theory ? 'Theory Only' : 'Practical Only'}
                      </span>
                      {(course.theory_hours > 0 || course.practical_hours > 0) && (
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#666',
                          marginTop: '3px'
                        }}>
                          {course.theory_hours > 0 && `${course.theory_hours}h theory `}
                          {course.practical_hours > 0 && `${course.practical_hours}h practical`}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Info */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666',
        borderLeft: '4px solid #3498db'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span style={{ fontWeight: 'bold' }}>API Endpoint:</span>
          <span>
            GET: <code>/admin/courses</code>
          </span>
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: '#3498db' }}>
          Read-only view for teachers
        </div>
      </div>
    </div>
  );
};

export default CourseList;
