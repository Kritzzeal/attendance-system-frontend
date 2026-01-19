import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // New course form state
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    credits: 2,
    semester: 1,
    year: 2025,
    course_type: 'CORE',
    has_theory: true,
    has_practical: true,
    theory_hours: 0,
    practical_hours: 0
  });
// Add this function to handle Excel import
const handleImportCourses = async () => {
  if (!importFile) {
    toast.error('Please select an Excel file to import');
    return;
  }

  try {
    setImporting(true);
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    // Add year and semester parameters if needed
    const url = 'http://localhost:8000/api/v1/admin/upload/courses';
    
    console.log('Uploading file:', importFile.name);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary
      },
      body: formData
    });

    const responseData = await response.json();
    console.log('Import response:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.detail || `HTTP ${response.status}`);
    }

    // Refresh courses after import
    await fetchCourses();
    
    // Close modal and reset
    setShowImportModal(false);
    setImportFile(null);
    
    // Show success message with details
    if (responseData.results) {
      const { successful, failed } = responseData.results;
      toast.success(`Import completed: ${successful} courses added/updated, ${failed} failed`);
      
      // Show errors if any
      if (failed > 0 && responseData.results.errors && responseData.results.errors.length > 0) {
        console.log('Import errors:', responseData.results.errors);
        // You could show these errors in a more detailed way if needed
      }
    } else {
      toast.success('Courses imported successfully!');
    }
    
  } catch (error) {
    console.error('Error importing courses:', error);
    toast.error(`Import failed: ${error.message}`);
  } finally {
    setImporting(false);
  }
};
  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/v1/admin/courses', {
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

  // Handle add new course - FIXED: No id needed for POST
  const handleAddCourse = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      console.log('Adding course:', newCourse);
      
      const response = await fetch('http://localhost:8000/api/v1/admin/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse)
      });

      const responseData = await response.json();
      console.log('Add response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP ${response.status}`);
      }

      // Refresh the course list
      await fetchCourses();
      
      // Close modal and reset form
      setShowAddModal(false);
      setNewCourse({
        code: '',
        title: '',
        credits: 2,
        semester: 1,
        year: 2025,
        course_type: 'CORE',
        has_theory: true,
        has_practical: true,
        theory_hours: 0,
        practical_hours: 0
      });
      
      toast.success('Course added successfully!');
    } catch (error) {
      console.error('Error adding course:', error);
      toast.error(`Failed to add course: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit course - FIXED: Use course code in URL
  const handleEditCourse = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedCourse.code) {
      toast.error('No course selected for editing');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Prepare update data - exclude code from body since it's in URL
      const updateData = {
        title: selectedCourse.title,
        credits: selectedCourse.credits,
        semester: selectedCourse.semester,
        year: selectedCourse.year,
        course_type: selectedCourse.course_type,
        has_theory: selectedCourse.has_theory,
        has_practical: selectedCourse.has_practical,
        theory_hours: selectedCourse.theory_hours || 0,
        practical_hours: selectedCourse.practical_hours || 0
      };

      console.log('Updating course:', selectedCourse.code, 'with data:', updateData);
      
      const response = await fetch(`http://localhost:8000/api/v1/admin/courses/${selectedCourse.code}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const responseData = await response.json();
      console.log('Update response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP ${response.status}`);
      }

      // Refresh the course list
      await fetchCourses();
      
      // Close modal and reset
      setShowEditModal(false);
      setSelectedCourse(null);
      
      toast.success('Course updated successfully!');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error(`Failed to update course: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete course function - FIXED: Use course code in URL
  const handleDeleteCourse = async (courseCode, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('Deleting course:', courseCode);
      
      const response = await fetch(`http://localhost:8000/api/v1/admin/courses/${courseCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      const responseData = await response.json();
      console.log('Delete response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.detail || `Delete failed: ${response.status}`);
      }

      // Remove from local state
      setCourses(prev => prev.filter(course => course.code !== courseCode));
      
      toast.success(`Course "${courseTitle}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(`Failed to delete course: ${error.message}`);
    }
  };

  // Open edit modal with course data
  const openEditModal = (course) => {
    setSelectedCourse({
      code: course.code,
      title: course.title,
      credits: parseInt(course.credits) || 2,
      semester: parseInt(course.semester) || 1,
      year: parseInt(course.year) || 2025,
      course_type: course.course_type || 'CORE',
      has_theory: Boolean(course.has_theory),
      has_practical: Boolean(course.has_practical),
      theory_hours: course.theory_hours || 0,
      practical_hours: course.practical_hours || 0
    });
    setShowEditModal(true);
  };

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
          <h1 style={{ margin: '0', color: '#2c3e50' }}>Course Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Manage all courses • Total: {courses.length} courses
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ 
              padding: '10px 20px', 
              background: '#2ecc71', 
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
            <span>➕</span>
            Add New Course
          </button>
          
          <button 
            onClick={() => setShowImportModal(true)}
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
            <span>📥</span>
            Import Courses
          </button>
          
          <a 
            href="/admin/dashboard"
            style={{ 
              padding: '10px 20px', 
              background: '#95a5a6', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <span>←</span>
            Back to Dashboard
          </a>
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
          <button 
            onClick={fetchCourses}
            style={{ 
              padding: '10px 20px', 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>↻</span>
            Refresh
          </button>
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
              {searchTerm ? 'No courses match your search' : 'No courses found'}
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ 
                marginTop: '20px',
                padding: '10px 20px', 
                background: '#2ecc71', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Your First Course
            </button>
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
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px',
                    width: '120px'
                  }}>
                    Actions
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
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => openEditModal(course)}
                          style={{ 
                            padding: '6px 12px',
                            background: '#e8f4fd',
                            color: '#3498db',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Edit course"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course.code, course.title)}
                          style={{ 
                            padding: '6px 12px',
                            background: '#ffebee',
                            color: '#e74c3c',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Delete course"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '600px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: '0', color: '#2c3e50' }}>Add New Course</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setNewCourse({
                    code: '',
                    title: '',
                    credits: 2,
                    semester: 1,
                    year: 2025,
                    course_type: 'CORE',
                    has_theory: true,
                    has_practical: true,
                    theory_hours: 0,
                    practical_hours: 0
                  });
                }}
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#95a5a6'
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddCourse}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                {/* Left Column */}
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Course Code *
                    </label>
                    <input
                      type="text"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      placeholder="e.g., AEX101"
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      This will be used as the course identifier
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      placeholder="e.g., Communication Skills"
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Course Type
                    </label>
                    <select
                      value={newCourse.course_type}
                      onChange={(e) => setNewCourse({...newCourse, course_type: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="CORE">CORE</option>
                      <option value="ELECTIVE">ELECTIVE</option>
                      <option value="AUDIT">AUDIT</option>
                      <option value="SKILL">SKILL</option>
                      <option value="PROJECT">PROJECT</option>
                    </select>
                  </div>
                </div>
                
                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Academic Year *
                    </label>
                    <input
                      type="number"
                      value={newCourse.year}
                      onChange={(e) => setNewCourse({...newCourse, year: parseInt(e.target.value) || 2025})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Semester *
                    </label>
                    <select
                      value={newCourse.semester}
                      onChange={(e) => setNewCourse({...newCourse, semester: parseInt(e.target.value)})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Credits *
                    </label>
                    <input
                      type="number"
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({...newCourse, credits: parseInt(e.target.value) || 2})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
              
              {/* Course Hours */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Theory Hours (optional)
                  </label>
                  <input
                    type="number"
                    value={newCourse.theory_hours}
                    onChange={(e) => setNewCourse({...newCourse, theory_hours: parseInt(e.target.value) || 0})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Practical Hours (optional)
                  </label>
                  <input
                    type="number"
                    value={newCourse.practical_hours}
                    onChange={(e) => setNewCourse({...newCourse, practical_hours: parseInt(e.target.value) || 0})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              {/* Course Type Checkboxes */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={newCourse.has_theory}
                      onChange={(e) => setNewCourse({...newCourse, has_theory: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Has Theory Component
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={newCourse.has_practical}
                      onChange={(e) => setNewCourse({...newCourse, has_practical: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Has Practical Component
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCourse({
                      code: '',
                      title: '',
                      credits: 2,
                      semester: 1,
                      year: 2025,
                      course_type: 'CORE',
                      has_theory: true,
                      has_practical: true,
                      theory_hours: 0,
                      practical_hours: 0
                    });
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    background: '#95a5a6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  style={{ 
                    padding: '10px 20px', 
                    background: saving ? '#95a5a6' : '#2ecc71', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{ 
                        width: '12px',
                        height: '12px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Saving...
                    </>
                  ) : (
                    'Add Course'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '600px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: '0', color: '#2c3e50' }}>Edit Course: {selectedCourse.code}</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCourse(null);
                }}
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#95a5a6'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '15px', padding: '10px', background: '#e8f4fd', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', color: '#3498db' }}>
                <strong>Course Code:</strong> {selectedCourse.code} (cannot be changed)
              </div>
            </div>
            
            <form onSubmit={handleEditCourse}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                {/* Left Column */}
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={selectedCourse.title}
                      onChange={(e) => setSelectedCourse({...selectedCourse, title: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Course Type
                    </label>
                    <select
                      value={selectedCourse.course_type}
                      onChange={(e) => setSelectedCourse({...selectedCourse, course_type: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="CORE">CORE</option>
                      <option value="ELECTIVE">ELECTIVE</option>
                      <option value="AUDIT">AUDIT</option>
                      <option value="SKILL">SKILL</option>
                      <option value="PROJECT">PROJECT</option>
                    </select>
                  </div>
                </div>
                
                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Academic Year *
                    </label>
                    <input
                      type="number"
                      value={selectedCourse.year}
                      onChange={(e) => setSelectedCourse({...selectedCourse, year: parseInt(e.target.value) || 2025})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Semester *
                    </label>
                    <select
                      value={selectedCourse.semester}
                      onChange={(e) => setSelectedCourse({...selectedCourse, semester: parseInt(e.target.value)})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Credits *
                    </label>
                    <input
                      type="number"
                      value={selectedCourse.credits}
                      onChange={(e) => setSelectedCourse({...selectedCourse, credits: parseInt(e.target.value) || 2})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
              
              {/* Course Hours */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Theory Hours (optional)
                  </label>
                  <input
                    type="number"
                    value={selectedCourse.theory_hours}
                    onChange={(e) => setSelectedCourse({...selectedCourse, theory_hours: parseInt(e.target.value) || 0})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Practical Hours (optional)
                  </label>
                  <input
                    type="number"
                    value={selectedCourse.practical_hours}
                    onChange={(e) => setSelectedCourse({...selectedCourse, practical_hours: parseInt(e.target.value) || 0})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              {/* Course Type Checkboxes */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={selectedCourse.has_theory}
                      onChange={(e) => setSelectedCourse({...selectedCourse, has_theory: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Has Theory Component
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={selectedCourse.has_practical}
                      onChange={(e) => setSelectedCourse({...selectedCourse, has_practical: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Has Practical Component
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCourse(null);
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    background: '#95a5a6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  style={{ 
                    padding: '10px 20px', 
                    background: saving ? '#95a5a6' : '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{ 
                        width: '12px',
                        height: '12px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Saving...
                    </>
                  ) : (
                    'Update Course'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
{showImportModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  }}>
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '12px',
      width: '500px',
      maxWidth: '100%',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <h2 style={{ margin: '0', color: '#2c3e50' }}>Import Courses from Excel</h2>
        <button 
          onClick={() => {
            setShowImportModal(false);
            setImportFile(null);
          }}
          style={{ 
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#95a5a6'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '25px' }}>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Upload an Excel file (.xlsx, .xls) with course data. The file should have course information in a single column format like:
        </p>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#2c3e50'
        }}>
          1. IFP 101 Induction cum Foundation Programme 2 (0+2) (Non-gradial)<br/>
          2. SEC 1 Skill Enhancement Course – I 2 (0+2)<br/>
          3. AEX Communication Skills 2 (1+1)<br/>
          4. AGR Farming Based Livelihood Systems 3 (2+1)
        </div>
        
        <div style={{ 
          border: '2px dashed #ddd',
          borderRadius: '8px',
          padding: '30px',
          textAlign: 'center',
          background: importFile ? '#e8f4fd' : '#f8f9fa',
          transition: 'all 0.3s',
          cursor: 'pointer'
        }}
        onClick={() => document.getElementById('excel-file-input').click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#3498db';
          e.currentTarget.style.background = '#e8f4fd';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.background = importFile ? '#e8f4fd' : '#f8f9fa';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.background = '#e8f4fd';
          
          const files = e.dataTransfer.files;
          if (files.length > 0 && files[0].name.match(/\.(xlsx|xls)$/i)) {
            setImportFile(files[0]);
          } else {
            toast.error('Please select an Excel file (.xlsx or .xls)');
          }
        }}
        >
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.name.match(/\.(xlsx|xls)$/i)) {
                setImportFile(file);
              } else {
                toast.error('Please select an Excel file (.xlsx or .xls)');
              }
            }}
          />
          
          {importFile ? (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px', color: '#3498db' }}>📄</div>
              <div style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '5px' }}>
                {importFile.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {(importFile.size / 1024).toFixed(1)} KB • 
                Click to change file
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px', color: '#95a5a6' }}>📁</div>
              <div style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '5px' }}>
                Drop Excel file here or click to browse
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Supports .xlsx and .xls formats
              </div>
            </div>
          )}
        </div>
        
        {importFile && (
          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            background: '#e8f4fd',
            borderRadius: '6px',
            borderLeft: '4px solid #3498db'
          }}>
            <div style={{ fontSize: '13px', color: '#3498db' }}>
              <strong>Ready to import:</strong> {importFile.name}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
              The system will parse course codes, titles, credits, and hours automatically
            </div>
          </div>
        )}
      </div>
      
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '25px',
        borderLeft: '4px solid #f39c12'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '18px', color: '#f39c12' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: '500', color: '#856404', marginBottom: '5px' }}>
              Important Notes
            </div>
            <ul style={{ 
              margin: '0', 
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#856404'
            }}>
              <li>Existing courses with matching codes will be updated</li>
              <li>New courses will be created with year=1 and semester=1 by default</li>
              <li>The parser automatically extracts theory and practical hours from (X+Y) format</li>
              <li>Course type is determined from additional parentheses (e.g., Non-gradial)</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button 
          type="button"
          onClick={() => {
            setShowImportModal(false);
            setImportFile(null);
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#95a5a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
        <button 
          onClick={handleImportCourses}
          disabled={!importFile || importing}
          style={{ 
            padding: '10px 20px', 
            background: (!importFile || importing) ? '#95a5a6' : '#2ecc71', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: (!importFile || importing) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {importing ? (
            <>
              <div style={{ 
                width: '12px',
                height: '12px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Importing...
            </>
          ) : (
            'Import Courses'
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {/* ... Keep existing import modal code ... */}

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
          <span style={{ fontWeight: 'bold' }}>API Endpoints:</span>
          <span>
            POST: <code>/admin/courses</code> • 
            PUT: <code>/admin/courses/:code</code> • 
            DELETE: <code>/admin/courses/:code</code>
          </span>
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: '#3498db' }}>
          Note: Using course CODE (not ID) for updates and deletions
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;