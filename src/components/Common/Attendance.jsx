// src/components/Shared/Attendance.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Attendance = ({ userRole = 'teacher' }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState({}); // student_id -> status
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [allStudents, setAllStudents] = useState([]); // Store all students from admin endpoint
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  
  // NEW STATE VARIABLES FOR ATTENDANCE MARKING
  // Add this state variable
  const [sendingSMS, setSendingSMS] = useState(false);
  const [sessionType, setSessionType] = useState('theory');
  const [sectionBatch, setSectionBatch] = useState('TA');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().split(' ')[0].substring(0, 5);
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toTimeString().split(' ')[0].substring(0, 5);
  });

  // NEW: State for absent students modal
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentStudentsList, setAbsentStudentsList] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});

  // Determine API base based on user role
  const isAdmin = userRole === 'admin';

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return {};
    }
  };

  // Get teacher ID - handles various possible field names
  const getTeacherId = () => {
    if (isAdmin && selectedTeacher) {
      return selectedTeacher; // Admin selected a teacher
    }
    
    const user = getCurrentUser();
    console.log('Current user:', user);
    
    // For teachers, try different field names
    if (user.teacher_id) return user.teacher_id;
    if (user.id) return user.id;
    if (user.user_id) return user.user_id;
    
    return null;
  };
  // SMS sending function
// SMS sending function - FIXED VERSION
// SMS sending function - FIXED VERSION
const sendSMSNotification = async () => {
  if (!absentStudentsList.length) {
    toast.error('No absent students to send SMS');
    return;
  }

  try {
    setSendingSMS(true);
    const token = localStorage.getItem('token');
    const currentUser = getCurrentUser();
    
    console.log('Current user:', currentUser);
    console.log('Absent students:', absentStudentsList);

    // 1. Get student IDs - Make sure we're using the correct ID field
    const absentStudentIds = absentStudentsList.map(student => {
      // Try different possible ID fields
      return student.id || student.student_id || null;
    }).filter(id => id !== null);

    if (absentStudentIds.length === 0) {
      toast.error('No valid student IDs found');
      setSendingSMS(false);
      return;
    }

    // 2. Get course details
    const selectedCourseDetails = courses.find(c => 
      (c.course_id || c.code || c.id) === selectedCourse
    );

    // 3. Prepare request data according to SMSRequest schema
    const requestData = {
  attendance_id: Number(sessionDetails.attendanceId),
  absent_student_ids: absentStudentsList.map(student => student.id).filter(id => id),
  course_id: selectedCourse || "Course",
  date: selectedDate || new Date().toISOString().split('T')[0],
  session: `${sessionType} - ${sectionBatch}`
};

console.log('SMS Request:', requestData);
    console.log('Endpoint URL:', 'https://attendance-system-production-5149.up.railway.app/api/v1/sms/send-attendance-sms');

    // 4. Send the request
    const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/sms/send-attendance-sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      
      console.error('Error response:', errorText);
      
      if (response.status === 404) {
        throw new Error(`SMS endpoint not found (404). Check if the endpoint exists: /api/v1/sms/send-attendance-sms`);
      } else if (response.status === 405) {
        throw new Error(`Method not allowed (405). Make sure the endpoint accepts POST requests. Current method: POST`);
      } else if (response.status === 422) {
        throw new Error(`Validation error (422): ${errorText}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('SMS API response:', result);

    if (result.success) {
      toast.success(`✅ SMS sent successfully! ${result.sent_count || 0} sent, ${result.failed_count || 0} failed`);
      
      // Show individual results if available
      if (result.results && Array.isArray(result.results)) {
        const failedSMS = result.results.filter(r => r.status === 'failed');
        if (failedSMS.length > 0) {
          console.log('Failed SMS details:', failedSMS);
          toast.warning(`${failedSMS.length} SMS failed to send. Check console for details.`);
        }
      }
    } else {
      toast.error(`Failed to send SMS: ${result.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error sending SMS:', error);
    toast.error(`❌ Failed to send SMS: ${error.message}`);
    
    // Add more debugging info
    console.log('Current session details:', sessionDetails);
    console.log('Selected course:', selectedCourse);
    console.log('Absent students list:', absentStudentsList);
  } finally {
    setSendingSMS(false);
  }
};

// Replace the SMS sending function with this WhatsApp function
// Update the WhatsApp function to use PyWhatsApp
// In Attendance.jsx - Update WhatsApp function for REAL numbers
const sendWhatsAppNotification = async () => {
  if (!absentStudentsList.length) {
    toast.error('No absent students to send WhatsApp');
    return;
  }

  try {
    setSendingSMS(true);
    const token = localStorage.getItem('token');
    
    const results = [];
    
    for (const student of absentStudentsList) {
      if (!student.parent_mobile) {
        results.push({
          student: student.name,
          success: false,
          error: 'No parent mobile number'
        });
        continue;
      }
      
      try {
        const requestData = {
          student_id: student.student_id || student.id,
          student_name: student.name,
          parent_mobile: student.parent_mobile,
          course: sessionDetails.course || "Class",
          date: sessionDetails.date || new Date().toISOString().split('T')[0],
          time: sessionDetails.time?.split(' - ')[0] || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          session_type: sessionDetails.sessionType || "Class"
        };
        
        console.log(`📱 Sending WhatsApp to ${student.parent_mobile} for ${student.name}`);
        
        const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/whatsapp/send-attendance-real', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        results.push({
          student: student.name,
          parent: student.parent_mobile,
          success: result.success,
          error: result.error || null,
          note: result.note || ''
        });
        
        // Show immediate feedback
        if (result.success) {
          toast.success(`✅ Sent to ${student.name}'s parent`);
        } else {
          toast.warning(`⚠️ Failed for ${student.name}: ${result.error?.substring(0, 50)}...`);
        }
        
        // Delay between messages (3 seconds to avoid rate limits)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Error for ${student.name}:`, error);
        results.push({
          student: student.name,
          parent: student.parent_mobile,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (successful > 0) {
      toast.success(`✅ WhatsApp sent to ${successful} parents`);
    }
    
    if (failed > 0) {
      toast.warning(`⚠️ ${failed} WhatsApp failed to send`);
      console.log('Failed messages:', results.filter(r => !r.success));
    }
    
    // Show detailed summary
    setTimeout(() => {
      if (failed > 0) {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => `${r.student}: ${r.error}`)
          .join('\n');
        
        alert(`WhatsApp Results:\n\nSuccessful: ${successful}\nFailed: ${failed}\n\nErrors:\n${errorMessages}`);
      }
    }, 1000);
    
    return { results, successful, failed };
    
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    toast.error(`❌ Failed to send WhatsApp: ${error.message}`);
    return { results: [], successful: 0, failed: 0 };
  } finally {
    setSendingSMS(false);
  }
};
// Fetch all students from admin endpoint
  const fetchAllStudents = async () => {
    try {
      setLoadingAllStudents(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/admin/students?skip=0&limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('All students from admin endpoint:', data);
      
      // Handle different response formats
      let studentsList = [];
      if (Array.isArray(data)) {
        studentsList = data;
      } else if (data.students && Array.isArray(data.students)) {
        studentsList = data.students;
      } else if (data.data && Array.isArray(data.data)) {
        studentsList = data.data;
      }
      
      setAllStudents(studentsList);
      toast.success(`Loaded ${studentsList.length} students`);
    } catch (error) {
      console.error('Error fetching all students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingAllStudents(false);
    }
  };

  // Fetch all teachers for admin
  const fetchAllTeachers = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingTeachers(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/admin/all/teachers/?skip=0&limit=10000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('All teachers:', data);
      
      if (data.teachers && Array.isArray(data.teachers)) {
        setAllTeachers(data.teachers);
        if (data.teachers.length > 0) {
          // Default to first teacher
          setSelectedTeacher(data.teachers[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Test API connection
  const testAttendanceAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://attendance-system-production-5149.up.railway.app/api/v1/attendance/test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('Attendance API test:', data);
      toast.success('Attendance API connected successfully');
    } catch (error) {
      console.error('API test failed:', error);
      toast.error('Failed to connect to Attendance API');
    }
  };

  // Get courses for teacher
  const fetchTeacherCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        if (isAdmin) {
          toast.info('Please select a teacher first');
        } else {
          toast.error('Teacher ID not found. Please log in again.');
        }
        return;
      }

      // Build URL with teacher_id parameter
      let url = `https://attendance-system-production-5149.up.railway.app/api/v1/attendance/teacher/courses?teacher_id=${teacherId}`;

      console.log('Fetching courses from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Teacher courses response:', data);
      
      // Store teacher info if available
      if (data.teacher_name || data.teacher_id) {
        let teacherName = data.teacher_name;
        
        // If admin selected a teacher, get name from allTeachers list
        if (isAdmin && selectedTeacher) {
          const teacher = allTeachers.find(t => t.id.toString() === selectedTeacher);
          if (teacher) {
            teacherName = teacher.name;
          }
        }
        
        setTeacherInfo({
          name: teacherName || getCurrentUser().name || 'Unknown Teacher',
          id: data.teacher_id || teacherId,
          role: data.role || 'teacher'
        });
      }
      
      // Handle the courses array
      if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses);
        if (data.courses.length > 0) {
          const firstCourse = data.courses[0];
          setSelectedCourse(firstCourse.course_id || firstCourse.code || firstCourse.id);
          
          // Set default session type based on course
          if (firstCourse.has_practical && !firstCourse.has_theory) {
            setSessionType('practical');
          }
        } else {
          setSelectedCourse('');
          setStudents([]);
          toast.info('No courses assigned to this teacher');
        }
      } else if (Array.isArray(data)) {
        setCourses(data);
        if (data.length > 0) {
          const firstCourse = data[0];
          setSelectedCourse(firstCourse.course_id || firstCourse.code || firstCourse.id);
        } else {
          setSelectedCourse('');
          setStudents([]);
        }
      } else {
        setCourses([]);
        setSelectedCourse('');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error(`Failed to load courses: ${error.message}`);
      setCourses([]);
      setSelectedCourse('');
      setStudents([]);
    }
  };

  // Get students for selected course - Modified to use allStudents list
  const fetchStudentsForCourse = async (courseId) => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      
      // If we have all students from admin endpoint, filter them
      if (allStudents.length > 0) {
        console.log('Filtering students from allStudents list for course:', courseId);
        
        // For now, let's use all students since we don't have course filtering logic
        // In a real app, you would filter by course based on student enrollment
        setStudents(allStudents);
        
        // Initialize attendance status for each student
        const initialStatus = {};
        allStudents.forEach(student => {
          const studentId = student.student_id || student.id;
          if (studentId) {
            initialStatus[studentId] = 'present'; // Default to present
          }
        });
        setAttendanceStatus(initialStatus);
        
        // Set default section/batch based on first student
        if (allStudents.length > 0) {
          const firstStudent = allStudents[0];
          if (sessionType === 'practical' && firstStudent.practical_batch) {
            setSectionBatch(firstStudent.practical_batch);
          } else if (sessionType === 'theory' && firstStudent.theory_section) {
            setSectionBatch(firstStudent.theory_section);
          }
        }
        
        if (allStudents.length === 0) {
          toast.info('No students found');
        }
        
        setLoading(false);
        return;
      }
      
      // Fallback to API if we don't have all students
      const token = localStorage.getItem('token');
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        toast.error('Teacher ID required');
        setLoading(false);
        return;
      }

      // Build URL with parameters
      let url = `https://attendance-system-production-5149.up.railway.app/api/v1/attendance/students-list?course=${encodeURIComponent(courseId)}&teacher_id=${teacherId}`;

      console.log('Fetching students from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Students for course:', data);
      
      let studentsList = [];
      if (Array.isArray(data)) {
        studentsList = data;
      } else if (data.students && Array.isArray(data.students)) {
        studentsList = data.students;
      } else if (data.data && Array.isArray(data.data)) {
        studentsList = data.data;
      }
      
      setStudents(studentsList);
      
      // Initialize attendance status for each student
      const initialStatus = {};
      studentsList.forEach(student => {
        const studentId = student.student_id || student.id;
        if (studentId) {
          initialStatus[studentId] = 'present'; // Default to present
        }
      });
      setAttendanceStatus(initialStatus);
      
      // Set default section/batch based on first student
      if (studentsList.length > 0) {
        const firstStudent = studentsList[0];
        if (sessionType === 'practical' && firstStudent.practical_batch) {
          setSectionBatch(firstStudent.practical_batch);
        } else if (sessionType === 'theory' && firstStudent.theory_section) {
          setSectionBatch(firstStudent.theory_section);
        }
      }
      
      if (studentsList.length === 0) {
        toast.info('No students found for this course');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(`Failed to load students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        if (isAdmin) {
          toast.info('Please select a teacher to view attendance');
        } else {
          toast.error('Teacher ID required');
        }
        return;
      }

      let url = `https://attendance-system-production-5149.up.railway.app/api/v1/attendance/today?teacher_id=${teacherId}`;

      console.log('Fetching today attendance from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Today's attendance:", data);
      setAttendanceData(Array.isArray(data) ? data : data.data || data.attendance || []);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      toast.error(`Failed to load today's attendance: ${error.message}`);
    }
  };

  // Mark attendance - CORRECT API FORMAT
// Mark attendance - CORRECT API FORMAT
const markAttendance = async () => {
  if (!selectedCourse) {
    toast.error('Please select a course');
    return;
  }
  
  if (Object.keys(attendanceStatus).length === 0) {
    toast.error('No students to mark attendance for');
    return;
  }

  try {
    setMarkingAttendance(true);
    const token = localStorage.getItem('token');
    const teacherId = getTeacherId();
    
    if (!teacherId) {
      toast.error('Teacher ID required');
      return;
    }

    // Get the selected course details
    const selectedCourseDetails = courses.find(c => 
      (c.course_id || c.code || c.id) === selectedCourse
    );
    
    if (!selectedCourseDetails) {
      toast.error('Course details not found');
      return;
    }

    // Format date to YYYY-MM-DD (already in correct format from input)
    const formattedDate = selectedDate;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      toast.error('Invalid date format. Please use YYYY-MM-DD');
      return;
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      toast.error('Invalid time format. Please use HH:MM');
      return;
    }

    // Prepare attendance list - FIXED: Ensure status is 'present' or 'absent'
    const attendanceList = Object.entries(attendanceStatus)
      .filter(([studentId]) => studentId)
      .map(([studentId, status]) => {
        // Ensure status is either 'present' or 'absent'
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus !== 'present' && normalizedStatus !== 'absent') {
          return {
            student_id: studentId,
            status: 'present' // Default to present if invalid
          };
        }
        return {
          student_id: studentId,
          status: normalizedStatus
        };
      });

    // Prepare request body according to API format
    const requestBody = {
      course_code: selectedCourseDetails.code || selectedCourseDetails.course_code || selectedCourse,
      session_type: sessionType,
      section_batch: sectionBatch,
      date: formattedDate,
      start_time: startTime,
      end_time: endTime,
      attendance_list: attendanceList
    };

    console.log('Marking attendance with data:', requestBody);
    console.log('Teacher ID:', teacherId);

    // Build URL with teacher_id as query parameter
    const url = `https://attendance-system-production-5149.up.railway.app/api/v1/attendance/mark?teacher_id=${teacherId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    console.log('Parsed response:', result);

    if (!response.ok) {
      console.error('Error response:', result);
      
      if (result.detail) {
        throw new Error(`API Error: ${result.detail}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }

    // Check if attendance was marked successfully
    if (result.success !== true) {
      throw new Error(result.message || 'Attendance marking failed');
    }
    
    toast.success(`✅ Attendance marked for ${attendanceList.length} students`);
    
    // Get absent students
    const absentStudents = students.filter(student => {
      const studentId = student.student_id || student.id;
      return attendanceStatus[studentId] === 'absent';
    });
    
    // Get present students
    const presentStudents = students.filter(student => {
      const studentId = student.student_id || student.id;
      return attendanceStatus[studentId] === 'present';
    });

    // Store session details
    const courseName = selectedCourseDetails.title || selectedCourseDetails.name || selectedCourse;
    
    // Prepare session details for modal
  const sessionDetailsData = {
  course: courseName,
  date: selectedDate,
  sessionType: sessionType,
  sectionBatch: sectionBatch,
  time: `${startTime} - ${endTime}`,
  teacher: teacherInfo?.name || 'Teacher',
  total: students.length,
  present: presentStudents.length,
  absent: absentStudents.length,
  attendanceId: result.attendance_id || result.id || result.data?.id || null // Get actual ID from response
};

    console.log('Session details:', sessionDetailsData);
    console.log('Absent students:', absentStudents);

    // Update state
    setAbsentStudentsList(absentStudents);
    setSessionDetails(sessionDetailsData);
    
    // Always show modal, even if no absent students
    setShowAbsentModal(true);
    
    // Reset attendance status
    const resetStatus = {};
    students.forEach(student => {
      const studentId = student.student_id || student.id;
      if (studentId) {
        resetStatus[studentId] = 'present'; // Reset to default
      }
    });
    setAttendanceStatus(resetStatus);
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    toast.error(`❌ Failed to mark attendance: ${error.message}`);
  } finally {
    setMarkingAttendance(false);
  }
};

  // Toggle student attendance status
  const toggleStudentStatus = (studentId) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return { bg: '#d4edda', text: '#155724' };
      case 'absent': return { bg: '#f8d7da', text: '#721c24' };
      case 'late': return { bg: '#fff3cd', text: '#856404' };
      default: return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  // Initialize
  useEffect(() => {
    testAttendanceAPI();
    
    if (isAdmin) {
      fetchAllTeachers();
      fetchAllStudents(); // Fetch all students for admin
    } else {
      fetchTeacherCourses();
    }
  }, []);

  // When admin selects a teacher, fetch their courses
  useEffect(() => {
    if (isAdmin && selectedTeacher) {
      fetchTeacherCourses();
    }
  }, [isAdmin, selectedTeacher]);

  // Fetch students when course changes
  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  // Update section/batch when session type changes
  useEffect(() => {
    if (students.length > 0 && selectedCourse) {
      const firstStudent = students[0];
      if (sessionType === 'practical' && firstStudent.practical_batch) {
        setSectionBatch(firstStudent.practical_batch);
      } else if (sessionType === 'theory' && firstStudent.theory_section) {
        setSectionBatch(firstStudent.theory_section);
      }
    }
  }, [sessionType, students, selectedCourse]);

  // Calculate attendance summary
  const presentCount = Object.values(attendanceStatus).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceStatus).filter(status => status === 'absent').length;
  const totalStudents = students.length;

  // Get selected teacher name for admin
  const getSelectedTeacherName = () => {
    if (!isAdmin || !selectedTeacher) return '';
    const teacher = allTeachers.find(t => t.id.toString() === selectedTeacher);
    return teacher ? teacher.name : '';
  };

  // Get year badge color for students
  const getYearColor = (year) => {
    const colors = {
      2021: '#e74c3c',
      2022: '#e67e22',
      2023: '#f1c40f',
      2024: '#2ecc71',
      2025: '#3498db',
      2026: '#9b59b6'
    };
    return colors[year] || '#95a5a6';
  };

  return (
    <div style={{ padding: '20px' }}>
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
          <h1 style={{ margin: '0', color: '#2c3e50' }}>
            {isAdmin ? 'Attendance Management' : 'Mark Attendance'}
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            {isAdmin ? 'View and manage attendance records' : 'Mark attendance for your classes'}
            {teacherInfo && (
              <span style={{ 
                marginLeft: '10px',
                background: '#e8f4fd',
                color: '#3498db',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {isAdmin ? 'Teacher: ' : ''}{teacherInfo.name} (ID: {teacherInfo.id})
              </span>
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testAttendanceAPI}
            style={{ 
              padding: '10px 20px', 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Test API
          </button>
          
          {isAdmin && (
            <button 
              onClick={fetchAllStudents}
              disabled={loadingAllStudents}
              style={{ 
                padding: '10px 20px', 
                background: '#9b59b6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {loadingAllStudents ? 'Loading...' : '🔄 Load All Students'}
            </button>
          )}
          
          <button 
            onClick={() => {
              if (isAdmin && selectedTeacher) {
                fetchTeacherCourses();
              } else if (!isAdmin) {
                fetchTeacherCourses();
              }
            }}
            style={{ 
              padding: '10px 20px', 
              background: '#2ecc71', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ↻ Refresh
          </button>
          
          {isAdmin && (
            <a 
              href="/admin/dashboard"
              style={{ 
                padding: '10px 20px', 
                background: '#95a5a6', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              Back to Dashboard
            </a>
          )}
        </div>
      </div>

      {/* Admin Teacher Selection */}
      {isAdmin && (
        <div style={{ 
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Select Teacher</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                Choose Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
                disabled={loadingTeachers || allTeachers.length === 0}
              >
                {loadingTeachers ? (
                  <option value="">Loading teachers...</option>
                ) : allTeachers.length === 0 ? (
                  <option value="">No teachers available</option>
                ) : (
                  <>
                    <option value="">Select a teacher</option>
                    {allTeachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.teacher_id || teacher.id}) - {teacher.email}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {allTeachers.length} teacher(s) available
              </div>
            </div>
            
            <div>
              {selectedTeacher && getSelectedTeacherName() && (
                <div style={{ 
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>
                    Selected Teacher:
                  </div>
                  <div style={{ color: '#3498db', fontSize: '16px', fontWeight: '500' }}>
                    {getSelectedTeacherName()}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {(() => {
                      const teacher = allTeachers.find(t => t.id.toString() === selectedTeacher);
                      return teacher ? `ID: ${teacher.teacher_id || teacher.id} • ${teacher.department || 'No department'}` : '';
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ 
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>
          {isAdmin ? 'Mark Attendance (Admin)' : 'Mark Attendance'}
          {!getTeacherId() && (
            <span style={{ 
              marginLeft: '10px',
              fontSize: '14px',
              background: '#f8d7da',
              color: '#721c24',
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 'normal'
            }}>
              {isAdmin ? 'Select a teacher first' : 'Teacher ID missing - please log in again'}
            </span>
          )}
        </h3>
        
        {/* Course and Date Selection */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ 
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
              disabled={courses.length === 0 || !getTeacherId()}
            >
              {!getTeacherId() ? (
                <option value="">{isAdmin ? 'Select a teacher first' : 'Teacher ID required'}</option>
              ) : courses.length === 0 ? (
                <option value="">Loading courses...</option>
              ) : (
                <>
                  <option value="">Select a course</option>
                  {courses.map((course, index) => (
                    <option 
                      key={course.course_id || course.code || course.id || index} 
                      value={course.course_id || course.code || course.id}
                    >
                      {course.code || course.course_code} - {course.title || course.name}
                      {course.year && ` (Year ${course.year}, Sem ${course.semester})`}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {getTeacherId() ? `${courses.length} course(s) available` : 'Teacher selection required'}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ 
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Session Type and Section/Batch Selection */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              style={{ 
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
              <option value="tutorial">Tutorial</option>
              <option value="lab">Lab</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              Section/Batch
            </label>
            <select
              value={sectionBatch}
              onChange={(e) => setSectionBatch(e.target.value)}
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
              <option value="PA">PA</option>
              <option value="PB">PB</option>
              <option value="PC">PC</option>
              <option value="PD">PD</option>
              <option value="PE">PE</option>
              <option value="PF">PF</option>
            </select>
          </div>
        </div>

        {/* Time Selection */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ 
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ 
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Course Info (if available) */}
        {selectedCourse && courses.length > 0 && (
          <div style={{ 
            marginBottom: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {(() => {
                const course = courses.find(c => 
                  (c.course_id || c.code || c.id) === selectedCourse
                );
                if (!course) return null;
                
                return (
                  <>
                    <div>
                      <strong>Course:</strong> {course.title || course.name}
                    </div>
                    {course.year && (
                      <div>
                        <strong>Year:</strong> {course.year}
                      </div>
                    )}
                    {course.semester && (
                      <div>
                        <strong>Semester:</strong> {course.semester}
                      </div>
                    )}
                    {course.credits && (
                      <div>
                        <strong>Credits:</strong> {course.credits}
                      </div>
                    )}
                    <div>
                      <strong>Session Type:</strong> {sessionType}
                    </div>
                    <div>
                      <strong>Section/Batch:</strong> {sectionBatch}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Student Count Info */}
        {isAdmin && allStudents.length > 0 && (
          <div style={{ 
            marginBottom: '15px',
            padding: '10px 15px',
            background: '#e8f4fd',
            borderRadius: '6px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '16px' }}>📚</span>
            <span>
              <strong>{allStudents.length}</strong> students loaded from database
              {selectedCourse && ` • Showing for course: ${selectedCourse}`}
            </span>
          </div>
        )}

        {/* Students List */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0', color: '#2c3e50' }}>
              Students ({students.length})
              {isAdmin && allStudents.length > 0 && (
                <span style={{ 
                  marginLeft: '10px',
                  fontSize: '14px',
                  background: '#e8f4fd',
                  color: '#3498db',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 'normal'
                }}>
                  From admin database
                </span>
              )}
            </h4>
            {selectedCourse && (
              <button 
                onClick={() => fetchStudentsForCourse(selectedCourse)}
                disabled={loading || !getTeacherId()}
                style={{ 
                  padding: '8px 15px', 
                  background: '#2ecc71', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {loading ? 'Loading...' : '↻ Refresh Students'}
              </button>
            )}
          </div>
          
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#666' }}>Loading students...</p>
            </div>
          ) : !getTeacherId() ? (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              color: '#e74c3c'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
              <p style={{ fontSize: '16px', margin: '0' }}>
                {isAdmin ? 'Please select a teacher first' : 'Teacher ID not found. Please log in again.'}
              </p>
              {!isAdmin && (
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  style={{ 
                    marginTop: '15px',
                    padding: '10px 20px', 
                    background: '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Go to Login
                </button>
              )}
            </div>
          ) : students.length === 0 ? (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              color: '#95a5a6'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👨‍🎓</div>
              <p style={{ fontSize: '16px', margin: '0' }}>
                {selectedCourse ? 'No students found for this course' : 'Please select a course'}
              </p>
              {isAdmin && allStudents.length === 0 && (
                <button 
                  onClick={fetchAllStudents}
                  style={{ 
                    marginTop: '15px',
                    padding: '10px 20px', 
                    background: '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Load Students from Database
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              border: '1px solid #eee',
              borderRadius: '8px'
            }}>
              {students.map((student, index) => {
                const studentId = student.student_id || student.id;
                if (!studentId) return null;
                
                const status = attendanceStatus[studentId] || 'present';
                const statusColor = getStatusColor(status);
                const yearColor = getYearColor(student.year);
                
                return (
                  <div 
                    key={studentId}
                    style={{ 
                      padding: '15px',
                      borderBottom: index < students.length - 1 ? '1px solid #eee' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: index % 2 === 0 ? '#f8f9fa' : 'white',
                      cursor: 'pointer',
                      transition: 'background 0.3s'
                    }}
                    onClick={() => toggleStudentStatus(studentId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e8f4fd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? '#f8f9fa' : 'white';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '3px' }}>
                        {student.name || `Student ${index + 1}`}
                        {student.is_active === false && (
                          <span style={{ 
                            marginLeft: '8px',
                            fontSize: '11px',
                            background: '#ffebee',
                            color: '#e74c3c',
                            padding: '1px 6px',
                            borderRadius: '10px'
                          }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '15px',
                        fontSize: '13px', 
                        color: '#666',
                        flexWrap: 'wrap'
                      }}>
                        <span>
                          <strong>ID:</strong> {studentId}
                        </span>
                        {student.year && (
                          <span>
                            <strong>Year:</strong> 
                            <span style={{ 
                              marginLeft: '4px',
                              padding: '1px 8px',
                              background: `${yearColor}20`,
                              color: yearColor,
                              borderRadius: '10px',
                              fontSize: '12px'
                            }}>
                              {student.year}
                            </span>
                          </span>
                        )}
                        {student.theory_section && (
                          <span>
                            <strong>Theory:</strong> {student.theory_section}
                          </span>
                        )}
                        {student.practical_batch && (
                          <span>
                            <strong>Practical:</strong> {student.practical_batch}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: '5px 15px',
                      background: statusColor.bg,
                      color: statusColor.text,
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      minWidth: '80px',
                      textAlign: 'center',
                      textTransform: 'uppercase'
                    }}>
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary and Submit */}
        <div style={{ 
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Students</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                {totalStudents}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Present</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
                {presentCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Absent</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                {absentCount}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={markAttendance}
          disabled={markingAttendance || students.length === 0 || !selectedCourse || !getTeacherId()}
          style={{ 
            width: '100%',
            padding: '15px',
            background: markingAttendance ? '#95a5a6' : 
                     (students.length > 0 && getTeacherId() ? '#2ecc71' : '#95a5a6'),
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: markingAttendance || students.length === 0 || !getTeacherId() ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {markingAttendance ? (
            <>
              <div style={{ 
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Marking Attendance...
            </>
          ) : !getTeacherId() ? (
            isAdmin ? 'Select a teacher first' : 'Teacher ID required'
          ) : (
            `Mark Attendance for ${students.length} Students`
          )}
        </button>
      </div>

      {/* Absent Students Modal */}
      {showAbsentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 25px',
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#dc2626', fontSize: '22px' }}>
                  ⚠️ Absent Students Report
                </h2>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                  Attendance marked successfully! Below are the absent students for this session.
                </p>
              </div>
              <button
                onClick={() => setShowAbsentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '4px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Session Details */}
            <div style={{
              padding: '20px 25px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Course</div>
                  <div style={{ fontWeight: '500', color: '#2c3e50' }}>{sessionDetails.course}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontWeight: '500', color: '#2c3e50' }}>{sessionDetails.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Session</div>
                  <div style={{ fontWeight: '500', color: '#2c3e50' }}>{sessionDetails.sessionType} - {sessionDetails.sectionBatch}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Time</div>
                  <div style={{ fontWeight: '500', color: '#2c3e50' }}>{sessionDetails.time}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Teacher</div>
                  <div style={{ fontWeight: '500', color: '#2c3e50' }}>{sessionDetails.teacher}</div>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div style={{
              padding: '15px 25px',
              backgroundColor: '#fff7ed',
              borderBottom: '1px solid #fed7aa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#9a3412', marginBottom: '4px' }}>Attendance Summary</div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#2c3e50' }}>Total: </span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>{totalStudents}</span>
                  </div>
              
                  <div>
                    <span style={{ fontWeight: '500', color: '#dc2626' }}>Absent: </span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{absentStudentsList.length}</span>
                  </div>
                </div>
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {absentStudentsList.length} Student{absentStudentsList.length !== 1 ? 's' : ''} Absent
              </div>
            </div>

            {/* Absent Students List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 25px'
            }}>
              {absentStudentsList.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>All Students Present!</h3>
                  <p>Great job! All students attended this session.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>
                    Absent Students List
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '15px'
                  }}>
                    {absentStudentsList.map((student, index) => (
                      <div
                        key={student.student_id || student.id || index}
                        style={{
                          padding: '15px',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          color: '#dc2626',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '4px' }}>
                            {student.name || `Student ${index + 1}`}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            ID: {student.student_id || student.id}
                            {student.year && ` • Year: ${student.year}`}
                            {student.theory_section && ` • Theory: ${student.theory_section}`}
                            {student.practical_batch && ` • Practical: ${student.practical_batch}`}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          Absent
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

{/* Modal Footer - Updated for SMS */}
{/* Modal Footer - Updated for WhatsApp */}
<div style={{
  padding: '20px 25px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  <div style={{ fontSize: '14px', color: '#666' }}>
    Session completed at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
  </div>
  <div style={{ display: 'flex', gap: '10px' }}>
    <button
      onClick={sendWhatsAppNotification}
      disabled={sendingSMS || absentStudentsList.length === 0}
      style={{
        padding: '10px 20px',
        backgroundColor: sendingSMS ? '#9ca3af' : absentStudentsList.length === 0 ? '#d1d5db' : '#25D366',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: absentStudentsList.length === 0 ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '140px',
        justifyContent: 'center'
      }}
    >
      {sendingSMS ? (
        <>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid white',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Sending...
        </>
      ) : (
        <>
          💬 Send WhatsApp ({absentStudentsList.length})
        </>
      )}
    </button>
    <button
      onClick={() => {
        // Create CSV content
        const headers = ['S.No', 'Student ID', 'Name', 'Year', 'Theory Section', 'Practical Batch', 'Parent Mobile'];
        const rows = absentStudentsList.map((student, index) => [
          index + 1,
          student.student_id || student.id,
          student.name || `Student ${index + 1}`,
          student.year || '',
          student.theory_section || '',
          student.practical_batch || '',
          student.parent_mobile || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `absent_students_${sessionDetails.date}_${sessionDetails.sessionType}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('CSV file downloaded!');
      }}
      style={{
        padding: '10px 20px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      📥 Download CSV
    </button>
    <button
      onClick={() => setShowAbsentModal(false)}
      style={{
        padding: '10px 20px',
        backgroundColor: '#6b7280',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>API Endpoints:</div>
          {isAdmin && (
            <>
              <div>• GET <code>/admin/teachers</code> - Get all teachers</div>
              <div>• GET <code>/admin/students</code> - Get all students</div>
            </>
          )}
          <div>• GET <code>/attendance/teacher/courses?teacher_id=XXX</code> - Get teacher's courses</div>
          <div>• GET <code>/attendance/students-list?course=XXX&teacher_id=XXX</code> - Get students for course</div>
          <div>• POST <code>/attendance/mark?teacher_id=XXX</code> - Mark attendance</div>
          <div>• GET <code>/attendance/today?teacher_id=XXX</code> - Get today's attendance</div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .absent-modal-print * {
            visibility: visible;
          }
          .absent-modal-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );

// In the markAttendance function, after successful marking:
// Calculate proper counts

};

export default Attendance;
