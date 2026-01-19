// src/components/Teacher/MyClasses.jsx - DYNAMIC VERSION
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, 
  Badge, Alert, Spinner, Form, Modal
} from 'react-bootstrap';
import { 
  FaCalendar, FaUsers, FaClock, FaBook, 
  FaChartBar, FaFilter, FaSync, FaEye, FaCheckCircle
} from 'react-icons/fa';
import { attendanceService } from '../../services/attendance';
import { toast } from 'react-toastify';

const MyClasses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '07:45',
    endTime: '09:45',
    sessionType: 'theory',
    sectionBatch: 'TA'
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Load teacher's courses on component mount
  useEffect(() => {
    loadTeacherCourses();
  }, []);

  const loadTeacherCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await attendanceService.getTeacherCourses();
      
      if (result.success) {
        setCourses(result.data?.courses || result.data || []);
        console.log('Loaded courses:', result.data);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const errorMsg = 'Failed to load courses. Please check your connection.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Load courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle course selection for attendance
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    
    // Set default values based on course
    setAttendanceData(prev => ({
      ...prev,
      sessionType: course.has_theory ? 'theory' : 'practical',
      sectionBatch: course.section || 'TA'
    }));
    
    // Show attendance modal
    setShowAttendanceModal(true);
  };

  // Load students when modal opens
  useEffect(() => {
    if (showAttendanceModal && selectedCourse) {
      loadStudentsForAttendance();
    }
  }, [showAttendanceModal, attendanceData.sectionBatch]);

  const loadStudentsForAttendance = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoadingStudents(true);
      
      const result = await attendanceService.getStudentsForAttendance(
        selectedCourse.code,
        attendanceData.sessionType,
        attendanceData.sectionBatch
      );
      
      if (result.success) {
        const studentsData = result.data?.students || [];
        setStudents(studentsData);
        
        // Initialize all students as present by default
        const initialStatus = {};
        studentsData.forEach(student => {
          initialStatus[student.student_id] = 'present';
        });
        setAttendanceStatus(initialStatus);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to load students');
      console.error('Load students error:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Submit attendance
  const handleSubmitAttendance = async () => {
    if (!selectedCourse || students.length === 0) {
      toast.error('No students to mark attendance for');
      return;
    }
    
    // Prepare attendance list
    const attendanceList = students.map(student => ({
      student_id: student.student_id,
      status: attendanceStatus[student.student_id] || 'present'
    }));
    
    const payload = {
      course_code: selectedCourse.code,
      session_type: attendanceData.sessionType,
      section_batch: attendanceData.sectionBatch,
      date: attendanceData.date,
      start_time: attendanceData.startTime,
      end_time: attendanceData.endTime,
      attendance_list: attendanceList
    };
    
    console.log('Submitting attendance:', payload);
    
    try {
      setSubmitting(true);
      
      const result = await attendanceService.markAttendance(payload);
      
      if (result.success) {
        toast.success(`Attendance marked successfully!`);
        console.log('Attendance response:', result.data);
        
        // Show SMS notification for absent students
        const absentCount = Object.values(attendanceStatus).filter(s => s === 'absent').length;
        if (absentCount > 0) {
          toast.info(`SMS will be sent to ${absentCount} absent student(s)`);
        }
        
        // Close modal
        setShowAttendanceModal(false);
        setSelectedCourse(null);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Error submitting attendance');
      console.error('Submit attendance error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Debug function to test API endpoints
  const testEndpoints = async () => {
    console.log('Testing API endpoints...');
    
    // Test 1: Get teacher courses
    console.log('1. Testing /attendance/teacher/courses...');
    const coursesResult = await attendanceService.getTeacherCourses();
    console.log('Courses result:', coursesResult);
    
    // Test 2: If we have a course, test students list
    if (coursesResult.success && coursesResult.data?.length > 0) {
      const firstCourse = coursesResult.data[0];
      console.log('2. Testing /attendance/students-list...');
      const studentsResult = await attendanceService.getStudentsForAttendance(
        firstCourse.code,
        'theory',
        'TA'
      );
      console.log('Students result:', studentsResult);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading your classes...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Classes</h2>
          <p className="text-muted">View your assigned courses and mark attendance</p>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={loadTeacherCourses} className="me-2">
            <FaSync /> Refresh
          </Button>
          <Button variant="info" onClick={testEndpoints}>
            Test APIs
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Courses Grid - DYNAMIC */}
      <Row>
        {courses.length === 0 ? (
          <Col>
            <Alert variant="info">
              No courses assigned to you yet. Please contact the administrator.
            </Alert>
          </Col>
        ) : (
          courses.map((course, index) => (
            <Col md={4} key={index} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <Card.Title>{course.code}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        {course.title || 'No title available'}
                      </Card.Subtitle>
                    </div>
                    <Badge bg={course.session_type === 'theory' ? "primary" : "success"}>
                      {course.session_type || (course.has_theory ? 'Theory' : 'Practical')}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaBook className="me-2 text-muted" />
                      <span>Year {course.year || 'N/A'} - Semester {course.semester || 'N/A'}</span>
                    </div>
                    {(course.section || course.section_batch) && (
                      <div className="d-flex align-items-center mb-2">
                        <FaUsers className="me-2 text-muted" />
                        <span>Section: {course.section || course.section_batch || 'N/A'}</span>
                      </div>
                    )}
                    {course.batch && (
                      <div className="d-flex align-items-center mb-2">
                        <FaUsers className="me-2 text-muted" />
                        <span>Batch: {course.batch}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="primary" 
                    className="w-100"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <FaCalendar className="me-2" />
                    Mark Attendance
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Attendance Modal */}
      <Modal 
        show={showAttendanceModal} 
        onHide={() => setShowAttendanceModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Mark Attendance - {selectedCourse?.code}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {selectedCourse && (
            <>
              <Alert variant="info" className="mb-4">
                <strong>{selectedCourse.title || selectedCourse.code}</strong><br />
                Year {selectedCourse.year || 'N/A'} - Semester {selectedCourse.semester || 'N/A'}
              </Alert>
              
              {/* Attendance Form */}
              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={attendanceData.date}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          date: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Session Type</Form.Label>
                      <Form.Select
                        value={attendanceData.sessionType}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          sessionType: e.target.value
                        })}
                      >
                        <option value="theory">Theory</option>
                        <option value="practical">Practical</option>
                        <option value="lab">Lab</option>
                        <option value="tutorial">Tutorial</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Section/Batch</Form.Label>
                      <Form.Select
                        value={attendanceData.sectionBatch}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          sectionBatch: e.target.value
                        })}
                      >
                        <option value="TA">TA (Theory Section A)</option>
                        <option value="TB">TB (Theory Section B)</option>
                        <option value="PA">PA (Practical Batch A)</option>
                        <option value="PB">PB (Practical Batch B)</option>
                        <option value="PC">PC (Practical Batch C)</option>
                        <option value="PD">PD (Practical Batch D)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Time Slot</Form.Label>
                      <Form.Select
                        value={`${attendanceData.startTime}-${attendanceData.endTime}`}
                        onChange={(e) => {
                          const [start, end] = e.target.value.split('-');
                          setAttendanceData({
                            ...attendanceData,
                            startTime: start,
                            endTime: end
                          });
                        }}
                      >
                        <option value="">Custom Time</option>
                        <option value="07:45-09:45">7:45 - 9:45 AM</option>
                        <option value="10:15-11:15">10:15 - 11:15 AM</option>
                        <option value="11:15-12:15">11:15 - 12:15 PM</option>
                        <option value="13:00-14:00">1:00 - 2:00 PM</option>
                        <option value="14:15-16:15">2:15 - 4:15 PM</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Custom Time Inputs */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={attendanceData.startTime}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          startTime: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={attendanceData.endTime}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          endTime: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Students List */}
                {loadingStudents ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                    <p>Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <Alert variant="warning">
                    No students found for {attendanceData.sectionBatch} section/batch.
                  </Alert>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Students ({students.length})</h5>
                      <Button variant="outline-primary" size="sm" onClick={() => {
                        const newStatus = {};
                        students.forEach(student => {
                          newStatus[student.student_id] = 'present';
                        });
                        setAttendanceStatus(newStatus);
                      }}>
                        Mark All Present
                      </Button>
                    </div>
                    
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Section</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.student_id}>
                              <td>{student.student_id}</td>
                              <td>{student.name}</td>
                              <td>
                                {attendanceData.sessionType === 'theory' 
                                  ? student.theory_section 
                                  : student.practical_batch}
                              </td>
                              <td>
                                <Form.Select
                                  size="sm"
                                  value={attendanceStatus[student.student_id] || 'present'}
                                  onChange={(e) => setAttendanceStatus(prev => ({
                                    ...prev,
                                    [student.student_id]: e.target.value
                                  }))}
                                >
                                  <option value="present">✅ Present</option>
                                  <option value="absent">❌ Absent</option>
                                  <option value="late">⏰ Late</option>
                                  <option value="excused">📝 Excused</option>
                                </Form.Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </>
                )}
              </Form>
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowAttendanceModal(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitAttendance}
            disabled={submitting || students.length === 0}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              'Submit Attendance'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyClasses;