const FeeStructure = require('../models/feeStructure');
const FeePayment = require('../models/feePayment');
const Student = require('../models/student');
const Teacher = require('../models/teacher');

// Create Fee Structure
exports.createFeeStructure = async (req, res) => {
  try {
    const { class: className, session, tuitionFee, transportFee, examFee, otherCharges } = req.body;

    // Check if fee structure already exists
    const existingStructure = await FeeStructure.findOne({ class: className, session });
    if (existingStructure) {
      return res.status(400).json({ message: 'Fee structure already exists for this class and session' });
    }

    const totalFee = tuitionFee + (transportFee || 0) + (examFee || 0) + (otherCharges || 0);

    const feeStructure = new FeeStructure({
      class: className,
      session,
      tuitionFee,
      transportFee: transportFee || 0,
      examFee: examFee || 0,
      otherCharges: otherCharges || 0,
      totalFee,
    });

    await feeStructure.save();

    res.status(201).json({
      message: 'Fee structure created successfully',
      feeStructure,
    });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Fee Structure
exports.getFeeStructure = async (req, res) => {
  try {
    const { class: className, session } = req.query;
    const query = {};

    if (className) query.class = className;
    if (session) query.session = session;

    const feeStructures = await FeeStructure.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Fee structures fetched successfully',
      feeStructures,
    });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Fee Structure
exports.updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { tuitionFee, transportFee, examFee, otherCharges, session } = req.body;

    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Update fields
    if (tuitionFee !== undefined) feeStructure.tuitionFee = tuitionFee;
    if (transportFee !== undefined) feeStructure.transportFee = transportFee;
    if (examFee !== undefined) feeStructure.examFee = examFee;
    if (otherCharges !== undefined) feeStructure.otherCharges = otherCharges;
    if (session !== undefined) feeStructure.session = session;

    // Recalculate total
    feeStructure.totalFee =
      feeStructure.tuitionFee +
      feeStructure.transportFee +
      feeStructure.examFee +
      feeStructure.otherCharges;

    await feeStructure.save();

    res.status(200).json({
      message: 'Fee structure updated successfully',
      feeStructure,
    });
  } catch (error) {
    console.error('Error updating fee structure:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Fee Structure
exports.deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const feeStructure = await FeeStructure.findById(id);
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Check if user has permission (admin can delete any, teacher can delete only their class)
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.allotedClass !== feeStructure.class) {
        return res.status(403).json({ message: 'You can only delete fee structures for your assigned class' });
      }
    }

    await FeeStructure.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Fee structure deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create Payments for Period (All Students)
exports.createPaymentsForPeriod = async (req, res) => {
  try {
    const { class: className, session, period, dueDate } = req.body;

    // Get fee structure
    const feeStructure = await FeeStructure.findOne({ class: className, session });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found for this class and session' });
    }

    // Get all students in the class
    const students = await Student.find({ class: className, archived: false });
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this class' });
    }

    const payments = [];
    let createdCount = 0;

    for (const student of students) {
      // Check if payment already exists
      const existingPayment = await FeePayment.findOne({
        student: student._id,
        class: className,
        session,
        period,
      });

      if (!existingPayment) {
        const payment = new FeePayment({
          student: student._id,
          class: className,
          session,
          period,
          amountDue: feeStructure.totalFee,
          amountPaid: 0,
          status: 'unpaid',
          dueDate: dueDate || new Date(),
        });

        await payment.save();
        payments.push(payment);
        createdCount++;
      }
    }

    res.status(201).json({
      message: `Payment records created for ${createdCount} students`,
      createdCount,
      payments,
    });
  } catch (error) {
    console.error('Error creating payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create Payment for Single Student
exports.createPaymentForStudent = async (req, res) => {
  try {
    const { studentId, class: className, session, period, dueDate } = req.body;

    // Get fee structure
    const feeStructure = await FeeStructure.findOne({ class: className, session });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found for this class and session' });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if payment already exists
    const existingPayment = await FeePayment.findOne({
      student: studentId,
      class: className,
      session,
      period,
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Payment record already exists for this student and period' });
    }

    const payment = new FeePayment({
      student: studentId,
      class: className,
      session,
      period,
      amountDue: feeStructure.totalFee,
      amountPaid: 0,
      status: 'unpaid',
      dueDate: dueDate || new Date(),
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment record created successfully',
      payment,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark Fee as Paid (Manual Payment)
exports.markFeeAsPaid = async (req, res) => {
  try {
    const { paymentId, amountPaid, paymentMode, paymentDate, receiptNumber, notes } = req.body;

    const payment = await FeePayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Update payment
    payment.amountPaid += amountPaid;
    payment.paymentMode = paymentMode;
    payment.paymentDate = paymentDate || new Date();
    payment.receiptNumber = receiptNumber;
    payment.notes = notes;

    // Update status
    if (payment.amountPaid >= payment.amountDue) {
      payment.status = 'paid';
    } else if (payment.amountPaid > 0) {
      payment.status = 'partial';
    }

    await payment.save({ validateBeforeSave: false });

    res.status(200).json({
      message: 'Payment marked as paid successfully',
      payment,
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Payment Tracking
exports.getPaymentTracking = async (req, res) => {
    try {
      const { class: className, period, session } = req.query;
      const query = {};
  
      // 🧩 Add optional filters
      if (period) query.period = period;
      if (session) query.session = session;
  
      // 🎯 Restrict teacher to their allotted class directly using FeePayment.class
      if (req.user.role === "teacher") {
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }
  
        if (!teacher.allotedClass) {
          return res.status(400).json({ message: "Teacher has no allotted class" });
        }
  
        // 🔒 Restrict to teacher's class
        query.class = teacher.allotedClass;
      } 
      // 👑 Admin can view any class if provided
      else if (className) {
        query.class = className;
      }
  
      // 🔍 Fetch filtered payments directly
      const payments = await FeePayment.find(query)
        .populate("student", "firstName lastName studentId class")
        .sort({ createdAt: -1 });
  
      // 📊 Calculate summary stats
      const stats = {
        totalStudents: payments.length,
        paidCount: payments.filter((p) => p.status === "paid").length,
        pendingCount: payments.filter((p) => p.status === "unpaid").length,
        partialCount: payments.filter((p) => p.status === "partial").length,
      };
  
      if (req.user.role === "admin") {
        stats.totalExpected = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
        stats.totalCollected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        stats.totalPending = stats.totalExpected - stats.totalCollected;
        stats.collectionRate =
          stats.totalExpected > 0
            ? ((stats.totalCollected / stats.totalExpected) * 100).toFixed(2) + "%"
            : "0%";
      }
  
      // ✅ Respond
      res.status(200).json({
        message: "Payment tracking data fetched successfully",
        payments,
        stats,
      });
    } catch (error) {
      console.error("Error fetching payment tracking:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  


// Get Class Fees
exports.getClassFees = async (req, res) => {
  try {
    const { class: className } = req.params;
    const { session } = req.query;

    const query = { class: className };
    if (session) query.session = session;

    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Class fees fetched successfully',
      payments,
    });
  } catch (error) {
    console.error('Error fetching class fees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Student Fees
exports.getStudentFees = async (req, res) => {
  try {
    // Students authenticate directly (no separate User model)
    // req.user._id IS the student's _id
    const studentId = req.user.profile?._id;
    
    console.log('=== STUDENT FEES DEBUG ===');
    console.log('Student ID from token:', studentId);
    
    // Verify student exists
    const student = await Student.findById(studentId);
    console.log('Student found:', student ? `${student.firstName} ${student.lastName}` : 'NO');
    
    if (!student) {
      console.log('========================');
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find payments for this student
    const payments = await FeePayment.find({ student: studentId })
      .populate('student', 'firstName lastName studentId class')
      .sort({ createdAt: -1 });

    console.log('Payments found:', payments.length);
    console.log('========================');

    res.status(200).json({
      message: 'Student fees fetched successfully',
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const { paymentId } = req.params;

    const payment = await FeePayment.findById(paymentId).populate('student');
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const remainingAmount = payment.amountDue - payment.amountPaid;

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const options = {
      amount: remainingAmount * 100, // paise
      currency: 'INR',
      receipt: `receipt_${paymentId}`,
      notes: {
        paymentId: paymentId,
        studentId: payment.student._id.toString(),
        period: payment.period,
      },
    };

    const order = await razorpay.orders.create(options);
    payment.razorpayOrderId = order.id;
    await payment.save();

    const student = payment.student;
    console.log('Razorpay Order Created:', order.id);

    res.status(200).json({
      message: 'Order created successfully',
      key: process.env.RAZORPAY_KEY_ID,
      order,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: student.phone,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify Razorpay Payment
exports.verifyPayment = async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log('=== VERIFY PAYMENT ===');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);

    // Verify Razorpay signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.log('Signature verification failed');
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    console.log('Signature verified successfully');

    const payment = await FeePayment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const remainingAmount = payment.amountDue - payment.amountPaid;
    payment.amountPaid += remainingAmount;
    payment.status = 'paid';
    payment.paymentMode = 'online';
    payment.paymentDate = new Date();
    payment.razorpayPaymentId = razorpay_payment_id;

    await payment.save();

    console.log('Payment updated successfully');
    console.log('======================');

    res.status(200).json({
      message: 'Payment verified successfully',
      payment,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Fee Summary
exports.getFeeSummary = async (req, res) => {
  try {
    const { class: className, session } = req.query;
    const query = {};

    if (className) query.class = className;
    if (session) query.session = session;

    const payments = await FeePayment.find(query);

    const summary = {
      totalExpected: payments.reduce((sum, p) => sum + p.amountDue, 0),
      totalCollected: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      totalPending: 0,
      paidCount: payments.filter(p => p.status === 'paid').length,
      pendingCount: payments.filter(p => p.status === 'unpaid').length,
      partialCount: payments.filter(p => p.status === 'partial').length,
    };

    summary.totalPending = summary.totalExpected - summary.totalCollected;

    res.status(200).json({
      message: 'Fee summary fetched successfully',
      summary,
    });
  } catch (error) {
    console.error('Error fetching fee summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Download Report
exports.downloadReport = async (req, res) => {
  try {
    const { class: className, session, period } = req.params;

    const payments = await FeePayment.find({ class: className, session, period })
      .populate('student', 'firstName lastName studentId');

    // Generate CSV or PDF report (implement report generation here)

    res.status(200).json({
      message: 'Report generated successfully',
      payments,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Admin Dashboard Summary
exports.getAdminDashboardSummary = async (req, res) => {
  try {
    const { session } = req.query;
    const query = {};
    if (session) query.session = session;

    // Get all payments
    const payments = await FeePayment.find(query);

    // Calculate totals
    const totalExpected = payments.reduce((sum, p) => sum + p.amountDue, 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalPending = totalExpected - totalCollected;
    const collectionPercentage = totalExpected > 0
      ? ((totalCollected / totalExpected) * 100).toFixed(2)
      : '0.00';

    // Get class-wise statistics
    const classWiseStats = {};

    for (const payment of payments) {
      if (!classWiseStats[payment.class]) {
        classWiseStats[payment.class] = {
          class: payment.class,
          totalStudents: 0,
          paidStudents: 0,
          unpaidStudents: 0,
          partialStudents: 0,
          totalExpected: 0,
          totalCollected: 0,
          totalPending: 0,
        };
      }

      const stats = classWiseStats[payment.class];
      stats.totalStudents++;
      stats.totalExpected += payment.amountDue;
      stats.totalCollected += payment.amountPaid;
      stats.totalPending += (payment.amountDue - payment.amountPaid);

      if (payment.status === 'paid') stats.paidStudents++;
      else if (payment.status === 'unpaid') stats.unpaidStudents++;
      else if (payment.status === 'partial') stats.partialStudents++;
    }

    // Convert to array
    const classWiseArray = Object.values(classWiseStats);

    // Overall statistics
    const overallStats = {
      totalStudents: payments.length,
      paidCount: payments.filter(p => p.status === 'paid').length,
      unpaidCount: payments.filter(p => p.status === 'unpaid').length,
      partialCount: payments.filter(p => p.status === 'partial').length,
      totalExpected,
      totalCollected,
      totalPending,
      collectionPercentage: collectionPercentage + '%',
    };

    res.status(200).json({
      message: 'Dashboard summary fetched successfully',
      overallStats,
      classWiseStats: classWiseArray,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Class-wise Fee Report
exports.getClassWiseReport = async (req, res) => {
  try {
    const { class: className, session, period } = req.query;

    if (!className) {
      return res.status(400).json({ message: 'Class parameter is required' });
    }

    const query = { class: className };
    if (session) query.session = session;
    if (period) query.period = period;

    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName studentId email phone')
      .sort({ 'student.firstName': 1 });

    // Calculate class statistics
    const stats = {
      totalStudents: payments.length,
      paidCount: payments.filter(p => p.status === 'paid').length,
      unpaidCount: payments.filter(p => p.status === 'unpaid').length,
      partialCount: payments.filter(p => p.status === 'partial').length,
      totalExpected: payments.reduce((sum, p) => sum + p.amountDue, 0),
      totalCollected: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      totalPending: 0,
    };
    stats.totalPending = stats.totalExpected - stats.totalCollected;
    stats.collectionRate = stats.totalExpected > 0
      ? ((stats.totalCollected / stats.totalExpected) * 100).toFixed(2) + '%'
      : '0%';

    res.status(200).json({
      message: 'Class-wise report fetched successfully',
      class: className,
      session,
      period,
      stats,
      payments,
    });
  } catch (error) {
    console.error('Error fetching class-wise report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Classes with Fee Data
exports.getAllClassesWithFees = async (req, res) => {
  try {
    const { session } = req.query;
    const query = {};
    if (session) query.session = session;

    // Get all fee structures
    const feeStructures = await FeeStructure.find(query);

    // Get payment data for each class
    const classesData = [];

    for (const structure of feeStructures) {
      const payments = await FeePayment.find({
        class: structure.class,
        session: structure.session
      });

      const classData = {
        class: structure.class,
        session: structure.session,
        feeStructure: structure,
        totalStudents: payments.length,
        paidCount: payments.filter(p => p.status === 'paid').length,
        unpaidCount: payments.filter(p => p.status === 'unpaid').length,
        partialCount: payments.filter(p => p.status === 'partial').length,
        totalExpected: payments.reduce((sum, p) => sum + p.amountDue, 0),
        totalCollected: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      };

      classData.totalPending = classData.totalExpected - classData.totalCollected;
      classData.collectionRate = classData.totalExpected > 0
        ? ((classData.totalCollected / classData.totalExpected) * 100).toFixed(2) + '%'
        : '0%';

      classesData.push(classData);
    }

    res.status(200).json({
      message: 'All classes data fetched successfully',
      classes: classesData,
    });
  } catch (error) {
    console.error('Error fetching classes data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk Mark as Paid (for multiple students)
exports.bulkMarkAsPaid = async (req, res) => {
  try {
    const { paymentIds, paymentMode, paymentDate, notes } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({ message: 'Payment IDs array is required' });
    }

    const updatedPayments = [];

    for (const paymentId of paymentIds) {
      const payment = await FeePayment.findById(paymentId);
      if (payment && payment.status !== 'paid') {
        const remainingAmount = payment.amountDue - payment.amountPaid;
        payment.amountPaid += remainingAmount;
        payment.status = 'paid';
        payment.paymentMode = paymentMode || 'offline';
        payment.paymentDate = paymentDate || new Date();
        payment.notes = notes;
        await payment.save();
        updatedPayments.push(payment);
      }
    }

    res.status(200).json({
      message: `${updatedPayments.length} payments marked as paid successfully`,
      count: updatedPayments.length,
      payments: updatedPayments,
    });
  } catch (error) {
    console.error('Error bulk marking payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get Payment Records by Date Range (for date-wise reports)
exports.getPaymentRecordsByDate = async (req, res) => {
  try {
    const { startDate, endDate, class: className, session, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const query = {
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (className) query.class = className;
    if (session) query.session = session;
    if (status) query.status = status;

    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName studentId email phone class')
      .sort({ paymentDate: -1 });

    // Calculate statistics
    const stats = {
      totalRecords: payments.length,
      totalCollected: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      paidCount: payments.filter(p => p.status === 'paid').length,
      partialCount: payments.filter(p => p.status === 'partial').length,
      unpaidCount: payments.filter(p => p.status === 'unpaid').length,
    };

    res.status(200).json({
      message: 'Payment records fetched successfully',
      startDate,
      endDate,
      stats,
      payments,
    });
  } catch (error) {
    console.error('Error fetching payment records by date:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export Payment Records as CSV
exports.exportPaymentRecords = async (req, res) => {
  try {
    const { startDate, endDate, class: className, session, status, search } = req.query;

    const query = {};

    // Date filter
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Other filters
    if (className) query.class = className;
    if (session) query.session = session;
    if (status) query.status = status;

    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName studentId email phone class')
      .sort({ paymentDate: -1 });

    // Filter by search if provided
    let filteredPayments = payments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = payments.filter(p => 
        p.student?.firstName?.toLowerCase().includes(searchLower) ||
        p.student?.lastName?.toLowerCase().includes(searchLower) ||
        p.student?.studentId?.toLowerCase().includes(searchLower) ||
        p.student?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Generate CSV
    const csvHeaders = [
      'Student ID',
      'Student Name',
      'Class',
      'Email',
      'Phone',
      'Period',
      'Session',
      'Amount Due',
      'Amount Paid',
      'Balance',
      'Status',
      'Payment Date',
      'Payment Mode',
      'Receipt Number'
    ];

    const csvRows = filteredPayments.map(p => [
      p.student?.studentId || '',
      `${p.student?.firstName || ''} ${p.student?.lastName || ''}`,
      p.class || '',
      p.student?.email || '',
      p.student?.phone || '',
      p.period || '',
      p.session || '',
      p.amountDue || 0,
      p.amountPaid || 0,
      (p.amountDue - p.amountPaid) || 0,
      p.status || '',
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
      p.paymentMode || '',
      p.receiptNumber || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payment-records-${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting payment records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search Students in Class Report
exports.searchClassReport = async (req, res) => {
  try {
    const { class: className, session, period, search } = req.query;

    if (!className) {
      return res.status(400).json({ message: 'Class parameter is required' });
    }

    const query = { class: className };
    if (session) query.session = session;
    if (period) query.period = period;

    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName studentId email phone')
      .sort({ 'student.firstName': 1 });

    // Filter by search term
    let filteredPayments = payments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = payments.filter(p => 
        p.student?.firstName?.toLowerCase().includes(searchLower) ||
        p.student?.lastName?.toLowerCase().includes(searchLower) ||
        p.student?.studentId?.toLowerCase().includes(searchLower) ||
        p.student?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const stats = {
      totalStudents: filteredPayments.length,
      paidCount: filteredPayments.filter(p => p.status === 'paid').length,
      unpaidCount: filteredPayments.filter(p => p.status === 'unpaid').length,
      partialCount: filteredPayments.filter(p => p.status === 'partial').length,
      totalExpected: filteredPayments.reduce((sum, p) => sum + p.amountDue, 0),
      totalCollected: filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0),
      totalPending: 0,
    };
    stats.totalPending = stats.totalExpected - stats.totalCollected;
    stats.collectionRate = stats.totalExpected > 0
      ? ((stats.totalCollected / stats.totalExpected) * 100).toFixed(2) + '%'
      : '0%';

    res.status(200).json({
      message: 'Search results fetched successfully',
      class: className,
      session,
      period,
      search,
      stats,
      payments: filteredPayments,
    });
  } catch (error) {
    console.error('Error searching class report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Send Fee Payment Reminders
exports.sendFeeReminders = async (req, res) => {
  try {
    const { class: className, session, period, studentIds } = req.body;
    const sendEmail = require('../utils/sendEmails');

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs are required' });
    }

    // Build query for payments
    const query = {
      _id: { $in: studentIds },
      status: { $in: ['unpaid', 'partial'] }
    };

    if (className) query.class = className;
    if (session) query.session = session;
    if (period) query.period = period;

    // Get unpaid/partial payments with student details
    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName email studentId');

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No unpaid payments found for selected students' });
    }

    const emailResults = {
      sent: [],
      failed: [],
    };

    // Send email to each student
    for (const payment of payments) {
      if (!payment.student || !payment.student.email) {
        emailResults.failed.push({
          studentId: payment.student?.studentId || 'Unknown',
          reason: 'No email address'
        });
        continue;
      }

      const student = payment.student;
      const balance = payment.amountDue - payment.amountPaid;

      // Create email content
      const subject = `Fee Payment Reminder - ${payment.period || 'Pending'}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .amount { font-size: 24px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fee Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${student.firstName} ${student.lastName},</p>
              
              <p>This is a friendly reminder regarding your pending fee payment.</p>
              
              <div class="info-box">
                <p><strong>Student ID:</strong> ${student.studentId}</p>
                <p><strong>Class:</strong> ${payment.class}</p>
                <p><strong>Session:</strong> ${payment.session}</p>
                <p><strong>Period:</strong> ${payment.period}</p>
                <p><strong>Due Date:</strong> ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              
              <div class="info-box">
                <p><strong>Payment Details:</strong></p>
                <p>Total Amount Due: ₹${payment.amountDue.toLocaleString()}</p>
                <p>Amount Paid: ₹${payment.amountPaid.toLocaleString()}</p>
                <p class="amount">Outstanding Balance: ₹${balance.toLocaleString()}</p>
              </div>
              
              <p>Please make the payment at your earliest convenience to avoid any inconvenience.</p>
              
              <p>If you have already made the payment, please disregard this reminder.</p>
              
              <p>For any queries, please contact the school administration.</p>
              
              <div class="footer">
                <p>This is an automated reminder. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail(student.email, subject, html, true);
        emailResults.sent.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          amount: balance
        });
      } catch (error) {
        emailResults.failed.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          reason: error.message
        });
      }
    }

    res.status(200).json({
      message: 'Reminders sent successfully',
      summary: {
        total: payments.length,
        sent: emailResults.sent.length,
        failed: emailResults.failed.length
      },
      results: emailResults
    });
  } catch (error) {
    console.error('Error sending fee reminders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send Bulk Fee Reminders (for entire class or all unpaid)
exports.sendBulkFeeReminders = async (req, res) => {
  try {
    const { class: className, session, period, status } = req.body;
    const sendEmail = require('../utils/sendEmails');

    // Build query for unpaid/partial payments
    const query = {
      status: status || { $in: ['unpaid', 'partial'] }
    };

    if (className) query.class = className;
    if (session) query.session = session;
    if (period) query.period = period;

    // Get all unpaid/partial payments
    const payments = await FeePayment.find(query)
      .populate('student', 'firstName lastName email studentId');

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No unpaid payments found' });
    }

    const emailResults = {
      sent: [],
      failed: [],
    };

    // Send email to each student
    for (const payment of payments) {
      if (!payment.student || !payment.student.email) {
        emailResults.failed.push({
          studentId: payment.student?.studentId || 'Unknown',
          reason: 'No email address'
        });
        continue;
      }

      const student = payment.student;
      const balance = payment.amountDue - payment.amountPaid;

      const subject = `Fee Payment Reminder - ${payment.period || 'Pending'}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .amount { font-size: 24px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fee Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${student.firstName} ${student.lastName},</p>
              
              <p>This is a friendly reminder regarding your pending fee payment.</p>
              
              <div class="info-box">
                <p><strong>Student ID:</strong> ${student.studentId}</p>
                <p><strong>Class:</strong> ${payment.class}</p>
                <p><strong>Session:</strong> ${payment.session}</p>
                <p><strong>Period:</strong> ${payment.period}</p>
                <p><strong>Due Date:</strong> ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              
              <div class="info-box">
                <p><strong>Payment Details:</strong></p>
                <p>Total Amount Due: ₹${payment.amountDue.toLocaleString()}</p>
                <p>Amount Paid: ₹${payment.amountPaid.toLocaleString()}</p>
                <p class="amount">Outstanding Balance: ₹${balance.toLocaleString()}</p>
              </div>
              
              <p>Please make the payment at your earliest convenience to avoid any inconvenience.</p>
              
              <p>If you have already made the payment, please disregard this reminder.</p>
              
              <p>For any queries, please contact the school administration.</p>
              
              <div class="footer">
                <p>This is an automated reminder. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail(student.email, subject, html, true);
        emailResults.sent.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          amount: balance
        });
      } catch (error) {
        emailResults.failed.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          reason: error.message
        });
      }
    }

    res.status(200).json({
      message: 'Bulk reminders sent successfully',
      summary: {
        total: payments.length,
        sent: emailResults.sent.length,
        failed: emailResults.failed.length
      },
      results: emailResults
    });
  } catch (error) {
    console.error('Error sending bulk fee reminders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
