import api from './api';

export interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone?: string;
  class: string;
  rollNo?: string;
  dob?: string;
  gender?: string;
  address?: string;
  aadharId?: string;
  fatherName?: string;
  motherName?: string;
  session?: string;
}

export interface Notice {
  _id: string;
  title: string;
  message: string;
  target: {
    roles?: string[];
    classes?: string[];
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
}

export interface FeePayment {
  _id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  feeType: string;
}

export const studentApi = {
  // Profile
  getProfile: () => {
    return api.get('/student/profile');
  },

  updateProfile: (data: Partial<StudentProfile>) => {
    return api.patch('/student/profile', data);
  },

  // Notices
  getNotices: () => {
    return api.get('/student/notices');
  },

  // Fees
  getFeeStructure: (params?: { class?: string; session?: string }) => {
    return api.get('/student/fee-structure', { params });
  },

  getMyFees: () => {
    return api.get('/student/fees/my-fees');
  },

  getFeeDetails: (paymentId: string) => {
    return api.get(`/student/fees/details/${paymentId}`);
  },

  getPaymentHistory: () => {
    return api.get('/student/fees/payment-history');
  },

  // Payment
  createOrder: (paymentId: string) => {
    return api.post(`/student/fees/order/${paymentId}`);
  },

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paymentId: string;
  }) => {
    return api.post('/student/fees/verify', data);
  },
};
