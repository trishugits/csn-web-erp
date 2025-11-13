const Student = require("../models/student");
const validator = require('validator');
const bcrypt = require("bcrypt");
const csvUtil = require("../utils/csvUtils");
const Teacher = require("../models/teacher");

exports.addStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dob, studentId, password, gender, fatherName, motherName, address, class: className, aadharId } = req.body;
    if (!firstName || !lastName || !email || !studentId || !password || !aadharId) return res.status(400).json({ message: 'Missing fields' });
    if (!validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email' });
    if (phone && !validator.isMobilePhone(phone, 'en-IN')) return res.status(400).json({ message: 'Invalid phone' });
    const exists = await Student.findOne({ $or: [{ email }, { studentId }] });
    if (exists) return res.status(409).json({ message: 'Student exists' });
    const hashed = await bcrypt.hash(password, 10);
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    const st = await Student.create({ firstName, lastName, email, phone, dob, studentId, password: hashed, gender, fatherName, motherName, address, class: teacher.allotedClass, enrolledBy: req.user.id, aadharId });
    res.status(201).json({ message: 'Student added', student: st });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.importStudentsCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV required' });
    const rows = await csvUtil.csvToJson(req.file.buffer);
    const added = [];
    for (const r of rows) {
      if (!r.studentId || !r.email || !r.password) continue;
      if (!validator.isEmail(r.email)) continue;
      const ex = await Student.findOne({ $or: [{ email: r.email }, { studentId: r.studentId }] });
      if (ex) continue;
      const hashed = await bcrypt.hash(r.password, 10);
      const teacher = await Teacher.findById(req.user.id);
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
      const doc = {
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        email: r.email,
        phone: r.phone || '',
        dob: r.dob || '',
        studentId: r.studentId,
        password: hashed,
        gender: r.gender || 'male',
        fatherName: r.fatherName || '',
        motherName: r.motherName || '',
        address: r.address || '',
        class: teacher.allotedClass || '',
        enrolledBy: req.user.id
      };
      const saved = await Student.create(doc);
      added.push(saved.studentId);
    }
    res.json({ message: 'Import done', addedCount: added.length, added });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteStudent = async (req, res) => {
  try {
    const {id} = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(401).json({message: "Student did not exist"});
    await Student.findByIdAndDelete(id);
    return res.status(200).json({message: "Student removed successfully", student});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.updateStudent = async (req, res) => {
  try {
    const {id} = req.params;
    const{ firstName, lastName, email, address, aadharId, className, dob, phone, gender, fatherName, motherName, joiningDate, } = req.body;
    const student = await Student.findById(id);
    if(!student) return res.status(404).json({message: "Student did not exist"});
    if(firstName !== undefined) student.firstName = firstName;
    if(lastName !== undefined) student.lastName = lastName; 
    if(email !== undefined) student.email = email; 
    if(phone !== undefined) student.phone = phone; 
    if(address !== undefined) student.address = address; 
    if(aadharId !== undefined) student.aadharId = aadharId; 
    if(className !== undefined) student.class = className; 
    if(dob !== undefined) student.dob = dob; 
    if(gender !== undefined) student.gender = gender; 
    if(fatherName !== undefined) student.fatherName = fatherName; 
    if(motherName !== undefined) student.motherName = motherName; 
    if(joiningDate !== undefined) student.joiningDate = joiningDate; 
    await student.save();
    res.status(200).json({message: "Student updated successfully", updatedStudent: student});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.updateStatus = async (req, res) => {
  const session = await Student.startSession();
  session.startTransaction();
  
  try {
    const { studentId, status } = req.body;
    
    if (!studentId || !status) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Student ID and status are required" });
    }
    
    const student = await Student.findOne({ studentId }).session(session);
    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Student not found" });
    }
    
    if (status === 'suspended') {
      student.status = "suspended";
      student.archived = true;
      await student.save({ session });
      
      await session.commitTransaction();
      return res.json({ message: "Student suspended successfully", student });
    }
    
    if (status === 'inactive') {
      student.status = "inactive";
      student.archived = true;
      await student.save({ session });
      
      await session.commitTransaction();
      return res.json({ message: "Student set to inactive", student });
    }
    
    if (status === 'active') {
      student.status = "active";
      student.archived = false;
      await student.save({ session });
      
      await session.commitTransaction();
      return res.json({ message: "Student set to active", student });
    }
    
    await session.abortTransaction();
    return res.status(400).json({ message: "Invalid status value" });
    
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.getStudents = async(req, res) => {
    try {
        let { page = 1, limit = 50, search } = req.query;
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 50;
        limit = limit > 50 ? 50 : limit;
        
        const q = {archived: false};
        
        // If user is a teacher, filter by their assigned class
        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findById(req.user.id);
            if (!teacher) return res.status(404).json({message: "Teacher not found"});
            q.class = teacher.allotedClass;
        }
        
        // Apply search filters
        if (search) {
            q.$or = [
                {studentId: new RegExp(search, 'i')}, 
                {firstName: new RegExp(search, 'i')}, 
                {lastName: new RegExp(search, 'i')}, 
                {email: new RegExp(search, 'i')}, 
                {phone: new RegExp(search, 'i')}
            ];
        }
        
        const docs = await Student.find(q).skip((page-1) * limit).limit(limit);
        const totalDocuments = await Student.countDocuments(q);
        
        res.json({totalDocuments, page, docs});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}
