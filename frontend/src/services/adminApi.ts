import api from './api';

export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
  email: string;
  phone: string;
  allotedClass: string;
  qualification: string;
  status: string;
  archived: boolean;
  joiningDate: string;
  createdAt: string;
  aadharId?: string;
  address?: string;
}

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

export interface FeeStructure {
  _id: string;
  class: string;
  session: string;
  tuitionFee: number;
  transportFee: number;
  examFee: number;
  otherCharges: number;
  totalFee: number;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalNotices: number;
  feeCollection?: {
    totalCollected: number;
    pendingCollection: number;
    collectionRate: number;
  };
}

export const adminApi = {
  // Teachers
  getTeachers: (params?: { page?: number; limit?: number; search?: string; archived?: boolean }) => {
    return api.get('/admin/teachers', { params });
  },
  addTeacher: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    teacherId: string;
    allotedClass: string;
    qualification: string;
    password: string;
    aadharId: string;
    joiningDate: string;
    address: string;
  }) => {
    return api.post('/admin/teachers', data);
  },
  updateTeacher: (id: string, data: Partial<Teacher>) => {
    return api.patch(`/admin/teachers/update/${id}`, data);
  },
  deleteTeacher: (id: string) => {
    return api.delete(`/admin/teachers/delete/${id}`);
  },
  archiveTeacher: (id: string) => {
    return api.post(`/admin/teachers/archive/${id}`);
  },
  unarchiveTeacher: (id: string) => {
    return api.post(`/admin/teachers/unarchive/${id}`);
  },
  importTeachersCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/teachers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportTeachersCsv: async (teachers: Teacher[]) => {
    // Convert teachers to CSV format
    const headers = ['Teacher ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Qualification', 'Status', 'Join Date'];
    const rows = teachers.map(t => [
      t.teacherId,
      t.firstName,
      t.lastName,
      t.email,
      t.phone,
      t.allotedClass || '',
      t.qualification || '',
      t.archived ? 'Archived' : 'Active',
      t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Students
  addStudent: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    studentId: string;
    class: string;
    password: string;
    gender?: string;
    dob?: string;
    address?: string;
    aadharId?: string;
    fatherName?: string;
    motherName?: string;
    session?: string;
  }) => {
    return api.post('/admin/students', data);
  },
  importStudentsCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getStudents: (params?: { page?: number; limit?: number; search?: string; class?: string; archived?: boolean }) => {
    return api.get('/admin/students', { params });
  },
  getStudentsByClass: (classParam: string) => {
    return api.get(`/admin/students/class/${classParam}`);
  },
  getStudentsClasswise: () => {
    return api.get('/admin/students/classwise');
  },
  updateStudent: (id: string, data: Partial<Student>) => {
    return api.patch(`/admin/students/update/${id}`, data);
  },
  archiveStudent: (id: string) => {
    return api.post(`/admin/students/archive/${id}`);
  },
  unarchiveStudent: (id: string) => {
    return api.post(`/admin/students/unarchive/${id}`);
  },
  deleteStudent: (id: string) => {
    return api.delete(`/admin/students/delete/${id}`);
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
  getNotices: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/admin/notices', { params });
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
    return api.post('/admin/notices', data);
  },
  updateNotice: (id: string, data: Partial<Notice>) => {
    return api.patch(`/admin/notices/${id}`, data);
  },
  deleteNotice: (id: string) => {
    return api.delete(`/admin/notices/${id}`);
  },
  getPublishedNotices: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/admin/notices/published', { params });
  },

  // Fees
  getFeeStructure: (params?: { class?: string; session?: string; page?: number; limit?: number }) => {
    return api.get('/admin/fee-structure', { params });
  },
  createFeeStructure: (data: {
    class: string;
    session: string;
    tuitionFee: number;
    transportFee?: number;
    examFee?: number;
    otherCharges?: number;
  }) => {
    return api.post('/admin/fee-structure', data);
  },
  updateFeeStructure: (id: string, data: {
    tuitionFee?: number;
    transportFee?: number;
    examFee?: number;
    otherCharges?: number;
  }) => {
    return api.patch(`/admin/fee-structure/${id}`, data);
  },
  deleteFeeStructure: (id: string) => {
    return api.delete(`/admin/fee-structure/${id}`);
  },
  createPaymentsForPeriod: (data: {
    class: string;
    session: string;
    period: string;
    dueDate: string;
  }) => {
    return api.post('/admin/fees/create-period', data);
  },
  createPaymentForStudent: (data: {
    studentId: string;
    class: string;
    session: string;
    period: string;
    dueDate: string;
  }) => {
    return api.post('/admin/fees/create-single', data);
  },
  markFeeAsPaid: (data: {
    paymentId: string;
    amountPaid: number;
    paymentMode: string;
    paymentDate: string;
    receiptNumber?: string;
    notes?: string;
  }) => {
    return api.post('/admin/fees/mark-paid', data);
  },
  getPaymentTracking: (params?: {
    class?: string;
    period?: string;
    session?: string;
  }) => {
    return api.get('/admin/fees/tracking', { params });
  },
  getFeeSummary: (params?: { class?: string; period?: string }) => {
    return api.get('/admin/fees/summary', { params });
  },
  getClassFees: (classParam: string, params?: { period?: string; status?: string }) => {
    return api.get(`/admin/fees/class/${classParam}`, { params });
  },

  // Admin-specific fee methods
  getAdminDashboardSummary: (params?: { session?: string }) => {
    return api.get('/admin/fees/admin/dashboard', { params });
  },
  getClassWiseReport: (params: { class: string; session?: string; period?: string }) => {
    return api.get('/admin/fees/admin/class-report', { params });
  },
  getAllClassesWithFees: (params?: { session?: string }) => {
    return api.get('/admin/fees/admin/all-classes', { params });
  },
  bulkMarkAsPaid: (data: {
    paymentIds: string[];
    paymentMode: string;
    paymentDate: string;
    notes?: string;
  }) => {
    return api.post('/admin/fees/admin/bulk-mark-paid', data);
  },
  getPaymentRecordsByDate: (params: {
    startDate: string;
    endDate: string;
    class?: string;
    session?: string;
    status?: string;
  }) => {
    return api.get('/admin/fees/admin/payment-records', { params });
  },
  exportPaymentRecords: (params: {
    startDate?: string;
    endDate?: string;
    class?: string;
    session?: string;
    status?: string;
    search?: string;
  }) => {
    return api.get('/admin/fees/admin/export-records', { 
      params,
      responseType: 'blob'
    });
  },
  searchClassReport: (params: {
    class: string;
    session?: string;
    period?: string;
    search?: string;
  }) => {
    return api.get('/admin/fees/admin/search-class-report', { params });
  },
  sendFeeReminders: (data: {
    studentIds: string[];
    class?: string;
    session?: string;
    period?: string;
  }) => {
    return api.post('/admin/fees/admin/send-reminders', data);
  },
  sendBulkFeeReminders: (data: {
    class?: string;
    session?: string;
    period?: string;
    status?: string;
  }) => {
    return api.post('/admin/fees/admin/send-bulk-reminders', data);
  },
  getAllStudents: (params?: { page?: number; limit?: number; search?: string; class?: string }) => {
    return api.get('/admin/students', { params });
  },

  // Dashboard Stats (we'll need to aggregate from multiple endpoints)
  getDashboardStats: async (): Promise<DashboardStats> => {
    const [studentsRes, teachersRes, noticesRes, feeSummaryRes] = await Promise.all([
      api.get('/admin/students', { params: { limit: 1 } }),
      api.get('/admin/teachers', { params: { limit: 1 } }),
      api.get('/admin/notices', { params: { limit: 1 } }),
      api.get('/admin/fees/summary').catch(() => null),
    ]);

    const feeData = feeSummaryRes?.data;
    const feeCollection = feeData
      ? {
          totalCollected: feeData.totalCollected || 0,
          pendingCollection: feeData.pendingAmount || 0,
          collectionRate: feeData.collectionRate || 0,
        }
      : undefined;

    return {
      totalStudents: studentsRes.data?.totalDocuments || 0,
      totalTeachers: teachersRes.data?.totalDocuments || 0,
      totalNotices: noticesRes.data?.totalDocuments || 0,
      feeCollection,
    };
  },
};

