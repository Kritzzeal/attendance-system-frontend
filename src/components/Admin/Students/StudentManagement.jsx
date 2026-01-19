// src/components/Admin/StudentManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Students per page
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // New student form state
  const [newStudent, setNewStudent] = useState({
    student_id: '',
    name: '',
    year: new Date().getFullYear(), // Current year as default
    theory_section: 'TA',
    practical_batch: 'PA',
    student_mobile: '',
    parent_mobile: '',
    is_active: true
  });

  // Fetch students from backend with pagination
  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Calculate skip value for pagination
      const skip = (page - 1) * itemsPerPage;
      
      const response = await fetch(`https://attendance-system-production-5149.up.railway.app/api/v1/admin/students?skip=${skip}&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Students data:', data);
      
      // Handle different response formats
      if (data.success !== false) {
        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
          setTotalStudents(data.total || data.students.length);
          setTotalPages(Math.ceil((data.total || data.students.length) / itemsPerPage));
        } else if (data.data && Array.isArray(data.data)) {
          setStudents(data.data);
          setTotalStudents(data.total || data.data.length);
          setTotalPages(Math.ceil((data.total || data.data.length) / itemsPerPage));
        } else if (Array.isArray(data)) {
          setStudents(data);
          setTotalStudents(data.length);
          setTotalPages(Math.ceil(data.length / itemsPerPage));
        } else {
          setStudents([]);
          setTotalStudents(0);
          setTotalPages(1);
        }
      } else {
        setStudents([]);
        setTotalStudents(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
      setTotalStudents(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(currentPage);
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle add new student - REMOVED YEAR VALIDATION
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      console.log('Adding student:', newStudent);
      
      const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/admin/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent)
      });

      const responseData = await response.json();
      console.log('Add response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP ${response.status}`);
      }

      // Refresh the student list
      await fetchStudents(currentPage);
      
      // Close modal and reset form
      setShowAddModal(false);
      setNewStudent({
        student_id: '',
        name: '',
        year: new Date().getFullYear(),
        theory_section: 'TA',
        practical_batch: 'PA',
        student_mobile: '',
        parent_mobile: '',
        is_active: true
      });
      
      toast.success('Student added successfully!');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(`Failed to add student: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit student - REMOVED YEAR VALIDATION
  const handleEditStudent = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedStudent.student_id) {
      toast.error('No student selected for editing');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Prepare update data - exclude student_id from body since it's in URL
      const updateData = {
        name: selectedStudent.name,
        year: selectedStudent.year,
        theory_section: selectedStudent.theory_section,
        practical_batch: selectedStudent.practical_batch,
        student_mobile: selectedStudent.student_mobile || '',
        parent_mobile: selectedStudent.parent_mobile || '',
        is_active: selectedStudent.is_active
      };

      console.log('Updating student:', selectedStudent.student_id, 'with data:', updateData);
      
      const response = await fetch(`https://attendance-system-production-5149.up.railway.app/api/v1/admin/students/${selectedStudent.student_id}`, {
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

      // Refresh the student list
      await fetchStudents(currentPage);
      
      // Close modal and reset
      setShowEditModal(false);
      setSelectedStudent(null);
      
      toast.success('Student updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(`Failed to update student: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // View student details
  const handleViewStudent = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Fetching student details:', studentId);
      
      const response = await fetch(`https://attendance-system-production-5149.up.railway.app/api/v1/admin/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Student not found in system');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Student details:', responseData);
      
      // Open view modal with student data
      setSelectedStudent({
        student_id: studentId,
        ...responseData.student
      });
      setShowViewModal(true);
      
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error(`Failed to load student details: ${error.message}`);
    }
  };

  // Delete student function
  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('Deleting student:', studentId);
      
      const response = await fetch(`https://attendance-system-production-5149.up.railway.app/api/v1/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      // Refresh the student list
      await fetchStudents(currentPage);
      
      toast.success(`Student "${studentName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(`Failed to delete student: ${error.message}`);
    }
  };

  // Open edit modal with student data
  const openEditModal = (student) => {
    setSelectedStudent({
      student_id: student.student_id,
      name: student.name || '',
      year: student.year || new Date().getFullYear(),
      theory_section: student.theory_section || 'TA',
      practical_batch: student.practical_batch || 'PA',
      student_mobile: student.student_mobile || '',
      parent_mobile: student.parent_mobile || '',
      is_active: student.is_active !== false // Default to true if not specified
    });
    setShowEditModal(true);
  };

  // Handle file selection for import
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      
      setImportFile(file);
      setImportStatus(null); // Clear previous status
    }
  };

  // Handle student import
  const handleImportStudents = async () => {
    if (!importFile) {
      toast.error('Please select an Excel file to import');
      return;
    }

    try {
      setImporting(true);
      setImportStatus(null);
      
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      const url = 'https://attendance-system-production-5149.up.railway.app/api/v1/admin/upload/students';
      
      console.log('Uploading student file:', importFile.name);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const responseData = await response.json();
      console.log('Import response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP ${response.status}`);
      }

      // Refresh students after import
      await fetchStudents(currentPage);
      
      // Set import status for display
      if (responseData.results) {
        const { successful, failed, errors } = responseData.results;
        setImportStatus({
          type: 'success',
          message: `Import completed: ${successful} students added/updated, ${failed} failed`,
          details: errors.length > 0 ? errors : null
        });
      } else {
        setImportStatus({
          type: 'success',
          message: 'Students imported successfully!'
        });
      }
      
      // Clear file after successful upload (optional)
      setTimeout(() => {
        setImportFile(null);
        setImportStatus(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error importing students:', error);
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error.message}`
      });
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Filter students based on search (client-side filtering for current page)
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.year?.toString().includes(searchTerm) ||
    student.practical_batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.theory_section?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get year badge color
  const getYearColor = (year) => {
    const colors = {
      2021: '#e74c3c',
      2022: '#e67e22',
      2023: '#f1c40f',
      2024: '#2ecc71',
      2025: '#3498db',
      2026: '#9b59b6',
      1: '#3498db',
      2: '#2ecc71',
      3: '#9b59b6',
      4: '#e67e22'
    };
    return colors[year] || '#95a5a6';
  };

  // Get batch badge color
  const getBatchColor = (batch) => {
    if (!batch) return '#95a5a6';
    const colors = {
      'PA': '#3498db',
      'PB': '#2ecc71',
      'PC': '#9b59b6',
      'PD': '#e67e22',
      'PE': '#e74c3c',
      'PF': '#f1c40f',
      'TA': '#3498db',
      'TB': '#2ecc71',
      'TC': '#9b59b6',
      'TD': '#e67e22'
    };
    return colors[batch] || '#95a5a6';
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading && currentPage === 1) {
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
        <p style={{ color: '#666' }}>Loading students...</p>
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
          <h1 style={{ margin: '0', color: '#2c3e50' }}>Student Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Manage all students • Total: {totalStudents} students
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
            Import Students
          </button>
          
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
            Add Student
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
            placeholder="Search students by name, ID, year, or batch..."
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
            onClick={() => fetchStudents(currentPage)}
            style={{ 
              padding: '10px 20px', 
              background: '#2ecc71', 
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
        
        {/* Page Info */}
        <div style={{ 
          marginTop: '15px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalStudents)} of {totalStudents} students
            {searchTerm && filteredStudents.length < students.length && (
              <span style={{ marginLeft: '10px', color: '#3498db' }}>
                ({filteredStudents.length} match search)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Page {currentPage} of {totalPages}</span>
            <span style={{ color: '#ddd' }}>|</span>
            <span>{itemsPerPage} per page</span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div style={{ 
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: '0', color: '#2c3e50' }}>
            Students {searchTerm ? `(${filteredStudents.length} found)` : `(Page ${currentPage})`}
          </h3>
        </div>
        
        {filteredStudents.length === 0 ? (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: '#95a5a6'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>👨‍🎓</div>
            <p style={{ fontSize: '16px', margin: '0' }}>
              {searchTerm ? 'No students match your search' : 'No students found'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setShowAddModal(true)}
                style={{ 
                  marginTop: '15px',
                  padding: '10px 20px', 
                  background: '#2ecc71', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add Your First Student
              </button>
            )}
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
                    fontSize: '14px'
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
                    fontSize: '14px'
                  }}>
                    Year
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Theory Section
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Practical Batch
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Contact
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Status
                  </th>
                  <th style={{ 
                    padding: '15px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.student_id}
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
                        {student.student_id}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {student.name}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: `${getYearColor(student.year)}20`,
                        color: getYearColor(student.year),
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Year {student.year}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: `${getBatchColor(student.theory_section)}20`,
                        color: getBatchColor(student.theory_section),
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {student.theory_section || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: `${getBatchColor(student.practical_batch)}20`,
                        color: getBatchColor(student.practical_batch),
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {student.practical_batch || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>
                      <div>📱 {student.student_mobile || 'N/A'}</div>
                      {student.parent_mobile && (
                        <div style={{ fontSize: '11px', marginTop: '3px', color: '#999' }}>
                          Parent: {student.parent_mobile}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '5px 10px',
                        background: student.is_active !== false ? '#d4edda' : '#f8d7da',
                        color: student.is_active !== false ? '#155724' : '#721c24',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {student.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleViewStudent(student.student_id)}
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
                          title="View student details"
                        >
                          👁️ View
                        </button>
                        <button 
                          onClick={() => openEditModal(student)}
                          style={{ 
                            padding: '6px 12px',
                            background: '#fff3cd',
                            color: '#856404',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Edit student"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.student_id, student.name)}
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
                          title="Delete student"
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

      {/* Pagination Controls */}
      {totalPages > 1 && !searchTerm && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '10px',
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            style={{ 
              padding: '8px 12px',
              background: currentPage === 1 ? '#f8f9fa' : '#3498db',
              color: currentPage === 1 ? '#95a5a6' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⏮️ First
          </button>
          
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ 
              padding: '8px 12px',
              background: currentPage === 1 ? '#f8f9fa' : '#3498db',
              color: currentPage === 1 ? '#95a5a6' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ◀️ Previous
          </button>
          
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} style={{ padding: '8px 12px', color: '#95a5a6' }}>
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{ 
                  padding: '8px 12px',
                  background: currentPage === page ? '#2c3e50' : '#f8f9fa',
                  color: currentPage === page ? 'white' : '#2c3e50',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === page ? '600' : '400',
                  minWidth: '40px'
                }}
              >
                {page}
              </button>
            )
          ))}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ 
              padding: '8px 12px',
              background: currentPage === totalPages ? '#f8f9fa' : '#3498db',
              color: currentPage === totalPages ? '#95a5a6' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            Next ▶️
          </button>
          
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={{ 
              padding: '8px 12px',
              background: currentPage === totalPages ? '#f8f9fa' : '#3498db',
              color: currentPage === totalPages ? '#95a5a6' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            Last ⏭️
          </button>
        </div>
      )}

      {/* Add Student Modal - REMOVED YEAR VALIDATION */}
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
              <h2 style={{ margin: '0', color: '#2c3e50' }}>Add New Student</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setNewStudent({
                    student_id: '',
                    name: '',
                    year: new Date().getFullYear(),
                    theory_section: 'TA',
                    practical_batch: 'PA',
                    student_mobile: '',
                    parent_mobile: '',
                    is_active: true
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
            
            <form onSubmit={handleAddStudent}>
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
                      Student ID *
                    </label>
                    <input
                      type="text"
                      value={newStudent.student_id}
                      onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      placeholder="e.g., 202501001"
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Year *
                    </label>
                    <input
                      type="number"
                      value={newStudent.year}
                      onChange={(e) => setNewStudent({...newStudent, year: parseInt(e.target.value) || new Date().getFullYear()})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      placeholder="e.g., 2025"
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Theory Section
                    </label>
                    <select
                      value={newStudent.theory_section}
                      onChange={(e) => setNewStudent({...newStudent, theory_section: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="TA">TA</option>
                      <option value="TB">TB</option>
                      <option value="TC">TC</option>
                      <option value="TD">TD</option>
                      <option value="TE">TE</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Practical Batch
                    </label>
                    <select
                      value={newStudent.practical_batch}
                      onChange={(e) => setNewStudent({...newStudent, practical_batch: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PC">PC</option>
                      <option value="PD">PD</option>
                      <option value="PE">PE</option>
                      <option value="PF">PF</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Student Mobile
                    </label>
                    <input
                      type="tel"
                      value={newStudent.student_mobile}
                      onChange={(e) => setNewStudent({...newStudent, student_mobile: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="e.g., 9876543210"
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Fields */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Parent Mobile
                  </label>
                  <input
                    type="tel"
                    value={newStudent.parent_mobile}
                    onChange={(e) => setNewStudent({...newStudent, parent_mobile: e.target.value})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 9876543210"
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={newStudent.is_active}
                      onChange={(e) => setNewStudent({...newStudent, is_active: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Active Student
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStudent({
                      student_id: '',
                      name: '',
                      year: new Date().getFullYear(),
                      theory_section: 'TA',
                      practical_batch: 'PA',
                      student_mobile: '',
                      parent_mobile: '',
                      is_active: true
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
                    'Add Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal - REMOVED YEAR VALIDATION */}
      {showEditModal && selectedStudent && (
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
              <h2 style={{ margin: '0', color: '#2c3e50' }}>Edit Student: {selectedStudent.student_id}</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedStudent(null);
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
                <strong>Student ID:</strong> {selectedStudent.student_id} (cannot be changed)
              </div>
            </div>
            
            <form onSubmit={handleEditStudent}>
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
                      Name *
                    </label>
                    <input
                      type="text"
                      value={selectedStudent.name}
                      onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})}
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
                      Year *
                    </label>
                    <input
                      type="number"
                      value={selectedStudent.year}
                      onChange={(e) => setSelectedStudent({...selectedStudent, year: parseInt(e.target.value) || new Date().getFullYear()})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      required
                      placeholder="e.g., 2025"
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Theory Section
                    </label>
                    <select
                      value={selectedStudent.theory_section}
                      onChange={(e) => setSelectedStudent({...selectedStudent, theory_section: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="TA">TA</option>
                      <option value="TB">TB</option>
                      <option value="TC">TC</option>
                      <option value="TD">TD</option>
                      <option value="TE">TE</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                      Practical Batch
                    </label>
                    <select
                      value={selectedStudent.practical_batch}
                      onChange={(e) => setSelectedStudent({...selectedStudent, practical_batch: e.target.value})}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PC">PC</option>
                      <option value="PD">PD</option>
                      <option value="PE">PE</option>
                      <option value="PF">PF</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Student Mobile
                  </label>
                  <input
                    type="tel"
                    value={selectedStudent.student_mobile || ''}
                    onChange={(e) => setSelectedStudent({...selectedStudent, student_mobile: e.target.value})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 9876543210"
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    Parent Mobile
                  </label>
                  <input
                    type="tel"
                    value={selectedStudent.parent_mobile || ''}
                    onChange={(e) => setSelectedStudent({...selectedStudent, parent_mobile: e.target.value})}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 9876543210"
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={selectedStudent.is_active}
                      onChange={(e) => setSelectedStudent({...selectedStudent, is_active: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Active Student
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStudent(null);
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
                    'Update Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENT MODAL */}
      {showViewModal && selectedStudent && (
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
              <h2 style={{ margin: '0', color: '#2c3e50' }}>Student Details</h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedStudent(null);
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
            
            <div style={{ padding: '10px 0' }}>
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Student ID:
                </span>
                <span style={{ 
                  color: '#2c3e50',
                  flex: 1,
                  fontFamily: 'monospace'
                }}>
                  {selectedStudent.student_id}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Name:
                </span>
                <span style={{ color: '#2c3e50', flex: 1 }}>
                  {selectedStudent.name}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Year:
                </span>
                <span style={{ color: '#2c3e50', flex: 1 }}>
                  {selectedStudent.year}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Theory Section:
                </span>
                <span style={{ 
                  color: '#2c3e50', 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    padding: '4px 8px',
                    background: `${getBatchColor(selectedStudent.theory_section)}20`,
                    color: getBatchColor(selectedStudent.theory_section),
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedStudent.theory_section || 'N/A'}
                  </span>
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Practical Batch:
                </span>
                <span style={{ 
                  color: '#2c3e50', 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    padding: '4px 8px',
                    background: `${getBatchColor(selectedStudent.practical_batch)}20`,
                    color: getBatchColor(selectedStudent.practical_batch),
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedStudent.practical_batch || 'N/A'}
                  </span>
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Mobile:
                </span>
                <span style={{ color: '#2c3e50', flex: 1 }}>
                  {selectedStudent.student_mobile || 'N/A'}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Parent Mobile:
                </span>
                <span style={{ color: '#2c3e50', flex: 1 }}>
                  {selectedStudent.parent_mobile || 'N/A'}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#34495e',
                  width: '150px',
                  flexShrink: 0
                }}>
                  Status:
                </span>
                <span style={{ color: '#2c3e50', flex: 1 }}>
                  <span style={{ 
                    padding: '4px 8px',
                    background: selectedStudent.is_active !== false ? '#d4edda' : '#f8d7da',
                    color: selectedStudent.is_active !== false ? '#155724' : '#721c24',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedStudent.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedStudent(null);
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT STUDENTS MODAL */}
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
            width: '800px',
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
              <h2 style={{ margin: '0', color: '#2c3e50' }}>Import Students from Excel</h2>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportStatus(null);
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
            
            <div style={{ 
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📋 Excel File Requirements:
                </h4>
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                  Your Excel file must contain these columns:
                </p>
                <ul style={{ 
                  margin: '10px 0',
                  paddingLeft: '20px',
                  color: '#555'
                }}>
                  <li><strong>ID Number</strong> (required) - Student ID number</li>
                  <li><strong>Name</strong> (required) - Student's full name</li>
                  <li><strong>Year</strong> (required) - Academic year (e.g., 2025)</li>
                  <li><strong>Theory</strong> (optional) - Theory section (TA, TB, etc.)</li>
                  <li><strong>Practical</strong> (optional) - Practical batch (PA, PB, etc.)</li>
                  <li><strong>Student mobile number</strong> (optional) - Student's mobile</li>
                  <li><strong>Parent mobile number</strong> (optional) - Parent's mobile</li>
                </ul>
              </div>
              
              <div>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Important Notes:
                </h4>
                <ul style={{ 
                  margin: '10px 0',
                  paddingLeft: '20px',
                  color: '#555'
                }}>
                  <li>File format must be <strong>.xlsx or .xls</strong></li>
                  <li>Column names should match exactly (case insensitive)</li>
                  <li>Existing students will be updated with new data</li>
                  <li>New students will be added</li>
                  <li>Required columns must not be empty</li>
                  <li>Year must be a valid number (e.g., 2025)</li>
                </ul>
              </div>
            </div>

            <div style={{ 
              border: '2px dashed #3498db',
              borderRadius: '8px',
              padding: '30px',
              textAlign: 'center',
              marginBottom: '20px',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              <input
                type="file"
                id="excelFile"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {!importFile ? (
                <div 
                  onClick={() => document.getElementById('excelFile').click()}
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    📊
                  </div>
                  <p style={{ margin: '0', color: '#666' }}>Click to select Excel file</p>
                  <p style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>
                    Supports .xlsx, .xls formats
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '32px' }}>📄</div>
                    <div>
                      <p style={{ 
                        margin: '0',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {importFile.name}
                      </p>
                      <p style={{ 
                        margin: '0',
                        fontSize: '14px',
                        color: '#7f8c8d'
                      }}>
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setImportFile(null)}
                    style={{ 
                      padding: '8px 16px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {importStatus && (
              <div style={{ 
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px',
                background: importStatus.type === 'success' ? '#d4edda' : 
                          importStatus.type === 'error' ? '#f8d7da' : '#d1ecf1',
                border: `1px solid ${importStatus.type === 'success' ? '#c3e6cb' : 
                          importStatus.type === 'error' ? '#f5c6cb' : '#bee5eb'}`,
                color: importStatus.type === 'success' ? '#155724' : 
                      importStatus.type === 'error' ? '#721c24' : '#0c5460'
              }}>
                {importStatus.message}
                {importStatus.details && (
                  <div style={{ 
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '4px',
                    fontFamily: 'Monaco, Courier New, monospace',
                    fontSize: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <pre style={{ margin: '0' }}>
                      {JSON.stringify(importStatus.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportStatus(null);
                }}
                disabled={importing}
                style={{ 
                  padding: '10px 20px', 
                  background: '#95a5a6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: importing ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleImportStudents}
                disabled={!importFile || importing}
                style={{ 
                  padding: '10px 20px', 
                  background: (!importFile || importing) ? '#95a5a6' : '#3498db', 
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
                ) : 'Upload & Process'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            GET: <code>/admin/students?skip={currentPage}&limit={itemsPerPage}</code> • 
            POST: <code>/admin/students</code> • 
            PUT: <code>/admin/students/:id</code> • 
            DELETE: <code>/admin/students/:id</code>
          </span>
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: '#3498db' }}>
          Showing page {currentPage} of {totalPages} • {itemsPerPage} students per page
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
