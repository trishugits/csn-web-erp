import api from './api';

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone?: string;
  class: string;
  rollNo?: string;
  status?: string;
  archived: boolean;
  dob?: string;
  gender?: string;
  session?: string;
  address?: string;
  aadharId?: string;
  fatherName?: string;
  motherName?: string;
}

export interface Notice {
  _id: string;
  title: string;
  message: string;
  target: {
    roles?: string[];
    classes?: string[];
    ids?: string[];
  };
  startDate: string;
  endDate?: string;
  important: boolean;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TeacherProfile {
  _id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
  email: string;
  phone: string;
  allotedClass: string;
  qualification?: string;
  joiningDate?: string;
  address?: string;
  aadharId?: string;
}

export const teacherApi = {
  // Profile
  getProfile: () => {
    return api.get('/teacher/profile');
  },

  // Students
  getStudents: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/teacher/students', { params });
  },

  addStudent: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    studentId: string;
    password: string;
    class: string;
    gender?: string;
    dob?: string;
    address?: string;
    aadharId: string;
    fatherName?: string;
    motherName?: string;
  }) => {
    return api.post('/teacher/students', data);
  },

  updateStudent: (id: string, data: Partial<Student>) => {
    return api.patch(`/teacher/students/update/${id}`, data);
  },

  deleteStudent: (id: string) => {
    return api.delete(`/teacher/students/delete/${id}`);
  },

  updateStudentStatus: (studentId: string, status: 'active' | 'inactive' | 'suspended') => {
    return api.post('/teacher/students/status', { studentId, status });
  },

  importStudentsCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/teacher/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  exportStudentsCsv: async (students: Student[]) => {
    const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Gender', 'DOB', 'Status'];
    const rows = students.map(s => [
      s.studentId,
      s.firstName,
      s.lastName,
      s.email,
      s.phone || '',
      s.class,
      s.gender || '',
      s.dob ? new Date(s.dob).toLocaleDateString() : '',
      s.archived ? 'Archived' : 'Active'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Notices
  // Get notices targeted TO the teacher (from admin)
  getNotices: () => {
    return api.get('/teacher/notices');
  },

  // Get notices created BY the teacher
  getPublishedNotices: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/teacher/notices/published', { params });
  },

  addNotice: (data: {
    title: string;
    message: string;
    target: {
      roles?: string[];
      classes?: string[];
      ids?: string[];
    };
    startDate: string;
    endDate?: string;
    important?: boolean;
  }) => {
    return api.post('/teacher/notices', data);
  },

  updateNotice: (id: string, data: Partial<Notice>) => {
    return api.patch(`/teacher/notices/${id}`, data);
  },

  deleteNotice: (id: string) => {
    return api.delete(`/teacher/notices/${id}`);
  },

  // Fees (using common fee routes)
  getFeeStructure: (params?: { class?: string; session?: string; page?: number; limit?: number }) => {
    return api.get('/teacher/fee-structure', { params });
  },

  createFeeStructure: (data: {
    class: string;
    session: string;
    tuitionFee: number;
    transportFee?: number;
    examFee?: number;
    otherCharges?: number;
  }) => {
    return api.post('/teacher/fee-structure', data);
  },

  updateFeeStructure: (id: string, data: {
    tuitionFee?: number;
    transportFee?: number;
    examFee?: number;
    otherCharges?: number;
  }) => {
    return api.patch(`/teacher/fee-structure/${id}`, data);
  },

  deleteFeeStructure: (id: string) => {
    return api.delete(`/teacher/fee-structure/${id}`);
  },

  createPaymentsForPeriod: (data: {
    class: string;
    session: string;
    period: string;
    dueDate: string;
  }) => {
    return api.post('/teacher/fees/create-period', data);
  },

  createPaymentForStudent: (data: {
    studentId: string;
    class: string;
    session: string;
    period: string;
    dueDate: string;
  }) => {
    return api.post('/teacher/fees/create-single', data);
  },

  markFeeAsPaid: (data: {
    paymentId: string;
    amountPaid: number;
    paymentMode: string;
    paymentDate: string;
    receiptNumber?: string;
    notes?: string;
  }) => {
    return api.post('/teacher/fees/mark-paid', data);
  },

  getPaymentTracking: (params?: {
    period?: string;
    session?: string;
  }) => {
    return api.get('/teacher/fees/tracking', { params });
  },

  getFeeSummary: (params?: { class?: string; period?: string }) => {
    return api.get('/teacher/fees/summary', { params });
  },

  getClassFees: (classParam: string, params?: { period?: string; status?: string }) => {
    return api.get(`/teacher/fees/class/${classParam}`, { params });
  },
};
