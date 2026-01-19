// src/components/Admin/Teachers/TeacherList.jsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, 
  Badge, Form, InputGroup, Modal, Alert, Spinner 
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaUpload, 
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

  // Form state for new teacher
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    employee_id: '',
    department: 'General',
    designation: 'Assistant Professor',
    password: '',
    phone: ''
  });

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const result = await teacherService.getAllTeachers();
      
      if (result.success) {
        setTeachers(result.data.teachers || result.data);
        setError(null);
        toast.success('Teachers loaded successfully');
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      setError('Failed to load teachers');
      toast.error('Failed to load teachers');
      console.error('Load teachers error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (teacher.name && teacher.name.toLowerCase().includes(searchLower)) ||
      (teacher.email && teacher.email.toLowerCase().includes(searchLower)) ||
      (teacher.teacher_id && teacher.teacher_id.toLowerCase().includes(searchLower)) ||
      (teacher.department && teacher.department.toLowerCase().includes(searchLower))
    );
  });

  // Handle import file change
  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
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
        toast.success(`Import successful: ${data.teachers_created || 0} teachers created, ${data.assignments_created || 0} assignments created`);
        setShowImportModal(false);
        setImportFile(null);
        loadTeachers(); // Refresh the list
      } else {
        toast.error(`Import failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error(`Import error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Handle add new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare teacher data
      const teacherData = {
        ...newTeacher,
        role: 'teacher'
      };
      
      const result = await teacherService.createTeacher(teacherData);
      
      if (result.success) {
        toast.success(`Teacher ${newTeacher.name} created successfully`);
        setShowAddModal(false);
        setNewTeacher({
          name: '',
          email: '',
          employee_id: '',
          department: 'General',
          designation: 'Assistant Professor',
          password: '',
          phone: ''
        });
        loadTeachers(); // Refresh the list
      } else {
        toast.error(`Error creating teacher: ${result.error}`);
      }
    } catch (err) {
      console.error('Create teacher error:', err);
      toast.error(`Error creating teacher: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Handle reset password
  const handleResetPassword = async (teacherId, teacherName) => {
    if (window.confirm(`Reset password for ${teacherName}?`)) {
      try {
        // You need to create this endpoint in your backend
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/reset-password/${teacherId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          toast.success(`Password reset for ${teacherName}. New password: ${result.new_password}`);
        } else {
          toast.error('Failed to reset password');
        }
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  // Calculate statistics
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.is_active).length,
    departments: new Set(teachers.map(t => t.department).filter(Boolean)).size,
    teachersByDept: teachers.reduce((acc, teacher) => {
      const dept = teacher.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {})
  };

  if (loading) {
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
          <Button variant="secondary" className="me-2" onClick={loadTeachers}>
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
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="outline-secondary" onClick={loadTeachers}>
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
                      {searchTerm ? 'No teachers found matching your search' : 'No teachers found'}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>{teacher.teacher_id || 'N/A'}</td>
                      <td>
                        <strong>{teacher.name}</strong>
                        {teacher.designation && (
                          <small className="text-muted d-block">{teacher.designation}</small>
                        )}
                      </td>
                      <td>{teacher.email}</td>
                      <td>
                        <Badge bg="info">{teacher.department || 'General'}</Badge>
                      </td>
                      <td>
                        <Badge bg={teacher.is_active ? 'success' : 'danger'}>
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="info" size="sm" className="me-1" title="View Details">
                          <FaEye />
                        </Button>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-1" 
                          title="Reset Password"
                          onClick={() => handleResetPassword(teacher.id, teacher.name)}
                        >
                          <FaKey />
                        </Button>
                        <Button variant="danger" size="sm" title="Delete">
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
            />
            <Form.Text className="text-muted">
              File should contain teacher assignments in Sheet3
            </Form.Text>
          </Form.Group>
          
          {importing && (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Importing teachers...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
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
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                    placeholder="Leave blank to auto-generate"
                  />
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