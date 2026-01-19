// src/components/Admin/Teachers/TeacherList.jsx - DYNAMIC VERSION
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, 
  Badge, Form, InputGroup, Modal, Alert, Spinner 
} from 'react-bootstrap';
import { 
  FaPlus, FaTrash, FaUpload, 
  FaKey, FaEye, FaFilter, FaDownload, FaSync 
} from 'react-icons/fa';
import { teacherService } from '../../../services/teachers';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state for new teacher
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    employee_id: '',
    department: 'General',
    designation: 'Assistant Professor',
    phone: '',
    password: ''
  });

  // Load teachers on component mount and when refreshKey changes
  useEffect(() => {
    loadTeachers();
  }, [refreshKey]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await teacherService.getAllTeachers();
      
      if (result.success) {
        setTeachers(result.data || []);
        toast.success(`Loaded ${result.data?.length || 0} teachers`);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const errorMsg = 'Failed to load teachers. Please check your connection.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Load teachers error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => {
    if (!teacher) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check each field safely
    const name = teacher.name || '';
    const email = teacher.email || '';
    const teacherId = teacher.teacher_id || teacher.id || '';
    const department = teacher.department || '';
    const employeeId = teacher.employee_id || '';
    
    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      teacherId.toString().toLowerCase().includes(searchLower) ||
      department.toLowerCase().includes(searchLower) ||
      employeeId.toLowerCase().includes(searchLower)
    );
  });

  // Handle import file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Handle teacher import
  const handleImport = async () => {
    if (!importFile) {
      toast.warning('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const result = await teacherService.importTeachers(importFile);
      
      if (result.success) {
        const data = result.data;
        toast.success(
          `Import successful! Created: ${data.teachers_created || 0}, ` +
          `Updated: ${data.teachers_updated || 0}, ` +
          `Assignments: ${data.assignments_created || 0}`
        );
        setShowImportModal(false);
        setImportFile(null);
        setRefreshKey(prev => prev + 1); // Trigger refresh
      } else {
        toast.error(`Import failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error(`Import error: ${err.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  // Handle add new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newTeacher.name || !newTeacher.email || !newTeacher.employee_id) {
      toast.error('Please fill in all required fields: Name, Email, and Employee ID');
      return;
    }
    
    try {
      // Prepare teacher data for your backend
      const teacherData = {
        name: newTeacher.name,
        email: newTeacher.email,
        employee_id: newTeacher.employee_id,
        department: newTeacher.department,
        designation: newTeacher.designation,
        phone: newTeacher.phone,
        password: newTeacher.password || undefined // Let backend generate if empty
      };
      
      const result = await teacherService.createTeacher(teacherData);
      
      if (result.success) {
        toast.success(`Teacher "${newTeacher.name}" created successfully!`);
        setShowAddModal(false);
        
        // Reset form
        setNewTeacher({
          name: '',
          email: '',
          employee_id: '',
          department: 'General',
          designation: 'Assistant Professor',
          phone: '',
          password: ''
        });
        
        // Refresh list
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(`Error creating teacher: ${result.error}`);
      }
    } catch (err) {
      console.error('Create teacher error:', err);
      toast.error(`Error creating teacher: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle reset password
  const handleResetPassword = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to reset password for "${teacherName}"?`)) {
      try {
        // You need to implement this endpoint in your backend
        const result = await teacherService.resetPassword(teacherId);
        
        if (result.success) {
          const newPassword = result.data?.new_password;
          toast.success(
            `Password reset for ${teacherName}. New password: ${newPassword || 'Generated'}`,
            { autoClose: 10000 } // Show for 10 seconds
          );
        } else {
          toast.error(`Failed to reset password: ${result.error}`);
        }
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to delete teacher "${teacherName}"?`)) {
      try {
        // Note: You need to implement delete endpoint in your backend
        toast.info('Delete functionality not yet implemented in backend');
        console.log(`Would delete teacher ${teacherId}: ${teacherName}`);
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  // Handle view details
  const handleViewDetails = (teacher) => {
    // You can implement a modal or redirect to teacher details page
    toast.info(`Viewing details for ${teacher.name}`);
    console.log('Teacher details:', teacher);
  };

  // Calculate statistics
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.is_active !== false).length,
    departments: new Set(teachers.map(t => t.department).filter(Boolean)).size,
    teachersByDept: teachers.reduce((acc, teacher) => {
      const dept = teacher.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {})
  };

  if (loading && teachers.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading teachers...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Teacher Management</h2>
          <p className="text-muted">Manage all teachers and their course assignments</p>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" className="me-2" onClick={() => setRefreshKey(prev => prev + 1)}>
            <FaSync /> Refresh
          </Button>
          <Button variant="primary" className="me-2" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Add Teacher
          </Button>
          <Button variant="success" onClick={() => setShowImportModal(true)}>
            <FaUpload /> Import Excel
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-white bg-primary">
            <Card.Body>
              <h6>Total Teachers</h6>
              <h3>{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success">
            <Card.Body>
              <h6>Active</h6>
              <h3>{stats.active}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-info">
            <Card.Body>
              <h6>Departments</h6>
              <h3>{stats.departments}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning">
            <Card.Body>
              <h6>Last Updated</h6>
              <h6>{new Date().toLocaleTimeString()}</h6>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, email, department, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                )}
              </InputGroup>
              <Form.Text className="text-muted">
                {filteredTeachers.length} of {teachers.length} teachers match your search
              </Form.Text>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="outline-secondary">
                <FaDownload /> Export
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Teachers Table */}
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      {loading ? (
                        <Spinner size="sm" />
                      ) : searchTerm ? (
                        'No teachers found matching your search'
                      ) : teachers.length === 0 ? (
                        'No teachers found. Click "Add Teacher" to create one.'
                      ) : (
                        'No teachers match your search'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id || teacher.teacher_id}>
                      <td>
                        <strong>{teacher.employee_id || teacher.teacher_id || 'N/A'}</strong>
                      </td>
                      <td>
                        <strong>{teacher.name || 'Unknown'}</strong>
                        {teacher.designation && (
                          <small className="text-muted d-block">{teacher.designation}</small>
                        )}
                      </td>
                      <td>{teacher.email || 'N/A'}</td>
                      <td>
                        <Badge bg="info">{teacher.department || 'General'}</Badge>
                      </td>
                      <td>
                        <Badge bg={teacher.is_active !== false ? 'success' : 'danger'}>
                          {teacher.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-1" 
                          title="View Details"
                          onClick={() => handleViewDetails(teacher)}
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-1" 
                          title="Reset Password"
                          onClick={() => handleResetPassword(teacher.id || teacher.teacher_id, teacher.name)}
                        >
                          <FaKey />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          title="Delete"
                          onClick={() => handleDeleteTeacher(teacher.id || teacher.teacher_id, teacher.name)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Import Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Import Teachers from Excel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Upload the biometric Excel file. Teachers will be imported from Sheet3.
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Select Excel File</Form.Label>
            <Form.Control 
              type="file" 
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            <Form.Text className="text-muted">
              File should contain teacher assignments in Sheet3
            </Form.Text>
          </Form.Group>
          
          {importFile && (
            <Alert variant="success">
              File selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
            </Alert>
          )}
          
          {importing && (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Importing teachers...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowImportModal(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleImport}
            disabled={!importFile || importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Teacher Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Form onSubmit={handleAddTeacher}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Teacher</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={newTeacher.employee_id}
                    onChange={(e) => setNewTeacher({...newTeacher, employee_id: e.target.value})}
                    placeholder="Enter employee ID"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={newTeacher.department}
                    onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                  >
                    <option value="Agricultural Extension">Agricultural Extension</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Agricultural Economics">Agricultural Economics</option>
                    <option value="Soil Science">Soil Science</option>
                    <option value="Horticulture">Horticulture</option>
                    <option value="General">General</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Designation</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTeacher.designation}
                    onChange={(e) => setNewTeacher({...newTeacher, designation: e.target.value})}
                    placeholder="e.g., Assistant Professor"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                    placeholder="Leave blank to auto-generate password"
                  />
                  <Form.Text className="text-muted">
                    If left blank, a random password will be generated
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Teacher
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default TeacherList;