import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './TeacherManagement.css';

// API Service - Include this at the top of your component file
const createApiService = () => {
  const baseURL = 'http://localhost:8000/api/v1';
  
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

// Create API instance
const api = createApiService();

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignCourse, setShowAssignCourse] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  
  // Form states
  const [teacherForm, setTeacherForm] = useState({
    teacher_id: '',
    name: '',
    email: '',
    mobile: '',
    department: 'General',
    designation: 'Assistant Professor',
    employee_id: '',
    qualification: '',
    experience: '',
    is_active: true,
    is_hod: false,
    password: ''
  });
  
  const [courseAssignment, setCourseAssignment] = useState({
    course_code: '',
    section: '',
    batch: ''
  });

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/all/teachers/?skip=0&limit=1000');
      
      if (data.success && data.teachers) {
        setTeachers(data.teachers);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const data = await api.get('/admin/courses?limit=1000');
      if (data.success && data.courses) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Add new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/admin/teachers', teacherForm);
      
      if (response.success) {
        toast.success('Teacher added successfully!');
        setShowAddForm(false);
        setTeacherForm({
          teacher_id: '',
          name: '',
          email: '',
          mobile: '',
          department: 'General',
          designation: 'Assistant Professor',
          employee_id: '',
          qualification: '',
          experience: '',
          is_active: true,
          is_hod: false,
          password: ''
        });
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast.error(error.message || 'Failed to add teacher');
    }
  };

  // Edit teacher
  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setTeacherForm({
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email,
      mobile: teacher.mobile || '',
      department: teacher.department || 'General',
      designation: teacher.designation || 'Assistant Professor',
      employee_id: teacher.employee_id || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      is_active: teacher.is_active,
      is_hod: teacher.is_hod || false,
      password: '' // Leave empty unless changing password
    });
    setShowEditForm(true);
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    
    try {
      // Create update data without password if empty
      const updateData = { ...teacherForm };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      // Use teacher_id or id based on your API
      const teacherId = selectedTeacher.id || selectedTeacher.teacher_id;
      const response = await api.put(`/admin/teachers/${teacherId}`, updateData);
      
      if (response.success) {
        toast.success('Teacher updated successfully!');
        setShowEditForm(false);
        setSelectedTeacher(null);
        setTeacherForm({
          teacher_id: '',
          name: '',
          email: '',
          mobile: '',
          department: 'General',
          designation: 'Assistant Professor',
          employee_id: '',
          qualification: '',
          experience: '',
          is_active: true,
          is_hod: false,
          password: ''
        });
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error(error.message || 'Failed to update teacher');
    }
  };

  // Delete teacher
  const handleDeleteTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      // Use teacher_id or id based on your API
      const teacherId = selectedTeacher.id || selectedTeacher.teacher_id;
      await api.delete(`/admin/teachers/${teacherId}`);
      
      toast.success(`Teacher ${selectedTeacher.name} deleted successfully`);
      setShowDeleteConfirm(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(error.message || 'Failed to delete teacher');
      setShowDeleteConfirm(false);
      setSelectedTeacher(null);
    }
  };

  // Toggle status
  const handleToggleStatus = async (teacher) => {
    try {
      const teacherId = teacher.id || teacher.teacher_id;
      await api.put(`/admin/teachers/${teacherId}`, {
        is_active: !teacher.is_active
      });
      toast.success(`Teacher ${teacher.name} ${teacher.is_active ? 'deactivated' : 'activated'}`);
      fetchTeachers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Assign course
  const handleAssignCourse = async (e) => {
    e.preventDefault();
    
    if (!selectedTeacher || !courseAssignment.course_code) {
      toast.error('Please select a course');
      return;
    }

    try {
      const teacherId = selectedTeacher.id || selectedTeacher.teacher_id;
      const response = await api.post(
        `/admin/teachers/${teacherId}/courses`,
        courseAssignment
      );
      
      if (response.success) {
        toast.success('Course assigned successfully');
        setShowAssignCourse(false);
        setCourseAssignment({ course_code: '', section: '', batch: '' });
        setSelectedTeacher(null);
        // Refresh teachers to update course count
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error assigning course:', error);
      toast.error(error.message || 'Failed to assign course');
    }
  };

  // Fetch teacher's courses
  const handleViewCourses = async (teacher) => {
    try {
      const teacherId = teacher.id || teacher.teacher_id;
      const response = await api.get(`/admin/teachers/${teacherId}/courses`);
      if (response.success) {
        // Show courses in a modal or alert
        const courseList = response.courses.map(c => `${c.course_code} (${c.section || 'No section'})`).join(', ');
        alert(`${teacher.name} has ${response.count} assigned courses:\n${courseList}`);
      }
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      toast.error('Failed to load courses');
    }
  };

  // Upload teacher-course mappings
  const handleUploadTeacherCourses = async (file) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/upload/teacher-courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully processed ${data.results.successful} mappings`);
        fetchTeachers(); // Refresh to show updated assignments
      } else {
        toast.error(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    }
  };

  // Upload teachers from Excel
  const handleUploadTeachers = async (file) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/upload/teachers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully processed ${data.results.successful} teachers`);
        fetchTeachers(); // Refresh list
      } else {
        toast.error(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading teachers...</p>
      </div>
    );
  }

  return (
    <div className="teacher-management">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1>Teacher Management</h1>
          <p>Manage all teachers in the system • Total: {teachers.length} teachers</p>
        </div>
        
        <div className="header-actions">
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            ➕ Add Teacher
          </button>
          
          {/* Import Teachers Button */}
          <button 
            onClick={() => document.getElementById('importTeachersFile').click()}
            className="btn-secondary"
          >
            📤 Import Teachers
          </button>
          <input
            id="importTeachersFile"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              if (e.target.files[0]) {
                handleUploadTeachers(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
          
          {/* Import Teacher-Course Mappings Button */}
          <button 
            onClick={() => document.getElementById('importMappingsFile').click()}
            className="btn-secondary"
          >
            📊 Import Course Assignments
          </button>
          <input
            id="importMappingsFile"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              if (e.target.files[0]) {
                handleUploadTeacherCourses(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="table-container">
        <table className="teachers-table">
          <thead>
            <tr>
              <th>Teacher ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Courses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  No teachers found
                </td>
              </tr>
            ) : (
              teachers.map(teacher => (
                <tr key={teacher.id || teacher.teacher_id}>
                  <td>{teacher.teacher_id}</td>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.department}</td>
                  <td>{teacher.designation}</td>
                  <td>
                    <span className="badge">{teacher.assigned_courses || 0}</span>
                    <button 
                      onClick={() => handleViewCourses(teacher)}
                      className="btn-view"
                    >
                      View
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge ${teacher.is_active ? 'active' : 'inactive'}`}>
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowAssignCourse(true);
                        }}
                        className="btn-assign"
                        title="Assign Course"
                      >
                        📚
                      </button>
                      <button 
                        onClick={() => handleEditTeacher(teacher)}
                        className="btn-edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(teacher)}
                        className="btn-status"
                        title={teacher.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {teacher.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="btn-delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Teacher Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add New Teacher</h2>
                <button onClick={() => setShowAddForm(false)} className="modal-close">
                  ×
                </button>
              </div>
              <form onSubmit={handleAddTeacher}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Teacher ID *</label>
                    <input 
                      type="text" 
                      value={teacherForm.teacher_id}
                      onChange={(e) => setTeacherForm({...teacherForm, teacher_id: e.target.value})}
                      placeholder="T1234"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input 
                      type="text" 
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                      placeholder="teacher@college.edu"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input 
                      type="tel" 
                      value={teacherForm.mobile}
                      onChange={(e) => setTeacherForm({...teacherForm, mobile: e.target.value})}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={teacherForm.department}
                      onChange={(e) => setTeacherForm({...teacherForm, department: e.target.value})}
                    >
                      <option value="General">General</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input 
                      type="text" 
                      value={teacherForm.designation}
                      onChange={(e) => setTeacherForm({...teacherForm, designation: e.target.value})}
                      placeholder="Assistant Professor"
                    />
                  </div>
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input 
                      type="text" 
                      value={teacherForm.employee_id}
                      onChange={(e) => setTeacherForm({...teacherForm, employee_id: e.target.value})}
                      placeholder="EMP123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Qualification</label>
                    <input 
                      type="text" 
                      value={teacherForm.qualification}
                      onChange={(e) => setTeacherForm({...teacherForm, qualification: e.target.value})}
                      placeholder="Ph.D., M.Tech, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Experience</label>
                    <input 
                      type="text" 
                      value={teacherForm.experience}
                      onChange={(e) => setTeacherForm({...teacherForm, experience: e.target.value})}
                      placeholder="5 years"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password (Optional)</label>
                    <input 
                      type="password" 
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                      placeholder="Leave empty for auto-generate"
                    />
                    <small>If empty, password will be: Teacher@{teacherForm.teacher_id || 'ID'}</small>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={teacherForm.is_active}
                        onChange={(e) => setTeacherForm({...teacherForm, is_active: e.target.checked})}
                      />
                      Active Account
                    </label>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={teacherForm.is_hod}
                        onChange={(e) => setTeacherForm({...teacherForm, is_hod: e.target.checked})}
                      />
                      Head of Department
                    </label>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditForm && selectedTeacher && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Teacher: {selectedTeacher.name}</h2>
                <button onClick={() => {
                  setShowEditForm(false);
                  setSelectedTeacher(null);
                }} className="modal-close">
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateTeacher}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Teacher ID *</label>
                    <input 
                      type="text" 
                      value={teacherForm.teacher_id}
                      onChange={(e) => setTeacherForm({...teacherForm, teacher_id: e.target.value})}
                      placeholder="T1234"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input 
                      type="text" 
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                      placeholder="teacher@college.edu"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input 
                      type="tel" 
                      value={teacherForm.mobile}
                      onChange={(e) => setTeacherForm({...teacherForm, mobile: e.target.value})}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={teacherForm.department}
                      onChange={(e) => setTeacherForm({...teacherForm, department: e.target.value})}
                    >
                      <option value="General">General</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input 
                      type="text" 
                      value={teacherForm.designation}
                      onChange={(e) => setTeacherForm({...teacherForm, designation: e.target.value})}
                      placeholder="Assistant Professor"
                    />
                  </div>
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input 
                      type="text" 
                      value={teacherForm.employee_id}
                      onChange={(e) => setTeacherForm({...teacherForm, employee_id: e.target.value})}
                      placeholder="EMP123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Qualification</label>
                    <input 
                      type="text" 
                      value={teacherForm.qualification}
                      onChange={(e) => setTeacherForm({...teacherForm, qualification: e.target.value})}
                      placeholder="Ph.D., M.Tech, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Experience</label>
                    <input 
                      type="text" 
                      value={teacherForm.experience}
                      onChange={(e) => setTeacherForm({...teacherForm, experience: e.target.value})}
                      placeholder="5 years"
                    />
                  </div>
                  <div className="form-group">
                    <label>Change Password (Optional)</label>
                    <input 
                      type="password" 
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                      placeholder="Leave empty to keep current password"
                    />
                    <small>Leave empty to keep current password</small>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={teacherForm.is_active}
                        onChange={(e) => setTeacherForm({...teacherForm, is_active: e.target.checked})}
                      />
                      Active Account
                    </label>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={teacherForm.is_hod}
                        onChange={(e) => setTeacherForm({...teacherForm, is_hod: e.target.checked})}
                      />
                      Head of Department
                    </label>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedTeacher(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                  >
                    Update Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {showAssignCourse && selectedTeacher && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Assign Course to {selectedTeacher.name}</h2>
                <button onClick={() => {
                  setShowAssignCourse(false);
                  setSelectedTeacher(null);
                }} className="modal-close">
                  ×
                </button>
              </div>
              <form onSubmit={handleAssignCourse}>
                <div className="form-group">
                  <label>Select Course *</label>
                  <select
                    value={courseAssignment.course_code}
                    onChange={(e) => setCourseAssignment({
                      ...courseAssignment,
                      course_code: e.target.value
                    })}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.code} value={course.code}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Section</label>
                    <input
                      type="text"
                      placeholder="e.g., A, B"
                      value={courseAssignment.section}
                      onChange={(e) => setCourseAssignment({
                        ...courseAssignment,
                        section: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Batch</label>
                    <input
                      type="text"
                      placeholder="e.g., 1, 2"
                      value={courseAssignment.batch}
                      onChange={(e) => setCourseAssignment({
                        ...courseAssignment,
                        batch: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAssignCourse(false);
                      setSelectedTeacher(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Assign Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTeacher && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Confirm Delete</h2>
                <button onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTeacher(null);
                }} className="modal-close">
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{selectedTeacher.name}</strong>?</p>
                <p className="text-warning">This will remove all their course assignments and cannot be undone.</p>
                
                <div className="teacher-details">
                  <p><strong>Teacher ID:</strong> {selectedTeacher.teacher_id}</p>
                  <p><strong>Email:</strong> {selectedTeacher.email}</p>
                  <p><strong>Department:</strong> {selectedTeacher.department}</p>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedTeacher(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmDeleteTeacher}
                  className="btn-danger"
                >
                  Delete Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;