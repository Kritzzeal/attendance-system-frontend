import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Students per page
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
          <h1 style={{ margin: '0', color: '#2c3e50' }}>Student Directory</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            View all students • Total: {totalStudents} students
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => fetchStudents(currentPage)}
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
                    Status
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
            GET: <code>/admin/students?skip={currentPage}&limit={itemsPerPage}</code>
          </span>
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: '#3498db' }}>
          Read-only view for students • Showing page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
};

export default StudentList;
