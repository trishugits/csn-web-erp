const Teacher = require("../models/teacher");
const Admin = require("../models/admin");
const Student = require("../models/student");
const validator = require('validator');
const bcrypt = require("bcrypt");
const csvUtil = require("../utils/csvUtils");
const Attendance = require("../models/monthlyAttendance");
const mongoose = require("mongoose");

exports.addTeachers = async (req, res) => {
    try {
        const {firstName, lastName, phone, email, teacherId, allotedClass, qualification, password, aadharId, joiningDate, address} = req.body;
        if (!address || !firstName || !lastName || !phone || !teacherId || !allotedClass || !qualification || !password || !aadharId || !joiningDate) {
            return res.status(400).json({message: "Missing Fields"});
        }
        if (!validator.isEmail(email)) return res.status(400).json({message: "Invalid Email"});
        const exists = await Teacher.findOne({ $or: [{email}, {teacherId}]});
        if (exists) return res.status(400).json({message: "Teacher Already exists"});
        const hashPassword = await bcrypt.hash(password, 10);
        const t = await Teacher.create({firstName, lastName, phone, email, teacherId, allotedClass, qualification, password: hashPassword, createdBy: req.user.id, address: address, joiningDate, aadharId})
        res.json({message: "Teacher added", teacher: t});

    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.importTeachersCsv = async (req, res) => {
    try {
        if(!req.file) return res.json({message: "Upload CSV File"});
        const rows = await csvUtil.csvToJson(req.file.buffer);
        const added = [];
        for (const r of rows){
            if(!r.address || !r.firstName || !r.lastName || !r.teacherId || !r.email || !r.password || !r.phone || !r.allotedClass || !r.qualification || !r.aadharId) continue;
            if (!validator.isEmail(r.email)) continue;
            const ex = await Teacher.findOne({ $or: [{email: r.email}, {teacherId: r.teacherId}]});
            if (ex) continue;
            const hashPassword = await bcrypt.hash(r.password, 10);
            const doc = {
                firstName: r.firstName,
                lastName: r.lastName,
                teacherId: r.teacherId,
                email: r.email,
                phone: r.phone,
                allotedClass: r.allotedClass,
                qualification: r.qualification,
                aadharId: r.aadharId,
                password: hashPassword,
                address: r.address
            }
            const saved = await Teacher.create(doc);
            added.push(saved.teacherId);
        }
        res.json({message: 'Import complete', addedCount: added.length, added});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.getTeachers = async(req, res) => {
    try {
        let { page = 1, limit = 50, search, archived } = req.query;
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 50;
        limit = limit > 50 ? 50 : limit;
        const q = {};
        // If archived parameter is provided, filter by it; otherwise default to non-archived
        if (archived !== undefined) {
            q.archived = archived === 'true' || archived === true;
        } else {
            q.archived = false;
        }
        if (search) q.$or = [{teacherId: new RegExp(search, 'i')}, {firstName: new RegExp(search, 'i')}, {lastName: new RegExp(search, 'i')}, {email: new RegExp(search, 'i')}, {phone: new RegExp(search, 'i')}];
        const docs = await Teacher.find(q).skip((page-1) * limit).limit((limit));
        const totalDocuments = await Teacher.countDocuments(q);
        res.json({totalDocuments, page, docs});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.reassignClasses = async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { assignments } = req.body;
        if(!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({message: "Assignments are required"});
        }

        // check for duplicate classes
        const classList = assignments.map(a => a.allotedClass);
        const duplicateClass = classList.filter((cls, idx) => classList.indexOf(cls) !== idx);
        if (duplicateClass.length > 0){
            return res.status(400).json({message: `Duplicate Classes are in request ${duplicateClass.join(", ")}`});
        }

        //check if any these classes are already assigned to other teacher or not\
        const existing = await Teacher.find({allotedClass: {$in: classList}}).session(session);
        for (const ex of existing) {
            const incoming = assignments.find(a => a.allotedClass === ex.allotedClass);
            if (incoming && incoming.teacherId === ex.teacherId){
                return res.status(400).json({message: `Class ${ex.allotedClass} is already assigned to ${ex.firstName} ${ex.lastName} (teacherId: ${ex.teacherId})`});
            }
        }

        const updated = []
        for (const a of assignments){
            const teacher = await Teacher.findOne({ teacherId: a.teacherId}).session(session);
            if (!teacher) return res.status(400).json({message: `Teacher not found: ${a.teacherId}`});
            teacher.allotedClass = a.allotedClass;
            await teacher.save({session});

            updated.push({
                teacherId: teacher.teacherId,
                name: `${teacher.firstName} ${teacher.lastName}`,
                allotedClass: teacher.allotedClass
            });
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({message: "Class reassignment completed successfully", updated});

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({message: err.message});        
    }
}

exports.archiveTeacher = async(req, res) => {
    try {
        const {id} = req.params;
        const teacher = await Teacher.findById(id);
        if (!teacher) return res.status(404).json({message: "Teacher not Found"});
        teacher.archived = true;
        teacher.status = "inactive";
        await teacher.save();

        res.json({message: "Teacher Archived", teacherId: teacher.teacherId});
    } catch (err) {
        res.json({message: err.message});        
    }
}

exports.unarchiveTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    teacher.archived = false;
    teacher.status = "active";  
    await teacher.save();

    res.json({ message: "Teacher unarchived", teacherId: teacher.teacherId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteTeacher = async (req, res) => {
    try {
        const {id} = req.params;
        const teacher = await Teacher.findById(id);
        if (!teacher) return res.status(404).json({message: "Teacher not Found"});
        await Teacher.findByIdAndDelete(id);
        res.json({message: "Teacher removed successfully"});
    } catch (err) {
        res.json({message: err.message});
    }
}

exports.updateTeacherStatus = async (req, res) => {
    const session = await Teacher.startSession();
    session.startTransaction();
    try {
        const {teacherId, newTeacherId, status} = req.body;
        if (!teacherId || !status) return res.status(400).json({message: "One of the field is missing"});
        const oldTeacher = await Teacher.findOne({teacherId}).session(session);
        if(!oldTeacher) return res.status(400).json({message: "Teacher whose status you want to update does not exists"});
        const className = oldTeacher.allotedClass;

        if(status === 'suspended'){
            oldTeacher.status = "suspended";
            oldTeacher.archived = true;
            await oldTeacher.save({session});

            await session.commitTransaction();
            session.endSession();
            return res.json({message: "Teacher suspended successfully", teacher: oldTeacher});
        }

        if (status === "inactive"){
            if (!newTeacherId){
                return res.json({message: "New teacher ID is required"});
            }
            const newTeacher = await Teacher.findOne({teacherId: newTeacherId}).session(session);
            if(!newTeacher) return res.status(400).json({message: "New teacher has not been added yet"});
            oldTeacher.status = "inactive";
            oldTeacher.archived = true;
            await oldTeacher.save({session});
            newTeacher.allotedClass = className;
            await newTeacher.save({session});
            await session.commitTransaction();
            
            session.endSession();

            return res.json({message: `Teacher set to Inactive. Class ${className} reassigned to ${newTeacher.firstName}`, oldTeacher, newTeacher});
        }


    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error updating Teacher status: ");
        res.status(500).json({message: err.message});
    }
}

exports.updateTeacher = async (req, res) => {
    try {
        const id = req.params.id;
        const { firstName, lastName, address, aadharId, phone, email, qualification, verified, joiningDate, teacherId} = req.body;
        const teacher = await Teacher.findById(id);
        if (!teacher) return res.json({message: "Teacher not found"});
        if (firstName !== undefined) teacher.firstName = firstName;
        if (lastName !== undefined) teacher.lastName = lastName;
        if (phone !== undefined) teacher.phone = phone;
        if (aadharId !== undefined) teacher.aadharId = aadharId;
        if (email !== undefined) teacher.email = email;
        if (teacherId !== undefined) teacher.teacherId = teacherId;
        if (qualification !== undefined) teacher.qualification = qualification;
        if (verified !== undefined) teacher.verified = verified;
        if (joiningDate !== undefined) teacher.joiningDate = joiningDate;
        if (address !== undefined) teacher.address = address;
        await teacher.save();

        res.json({message: "Teacher details updated successfully",  updatedTeacher: teacher});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

// exports.markTeacherAttendance = async (req, res) => {
//     try {
//         const {records, date} = req.body;
//         // validate records and date
//         if(!records || !Array.isArray(records)) return res.status(400).json({message: "Records are required to mark attendance"});
//         if (!date) return res.status(400).json({message: "Date is required"});
//         // date format ('YYYY-MM)
//         const month = date.slice(0,7);
//         //process each record
//         const results = [];
//         for (const rec of records) {
//             const {teacherId, status, remarks} = rec;
//             //validate that teacher exists
//             const teacher = Teacher.findOne(teacherId);
//             if (!teacher){
//                 results.push({teacherId, success: false, message: "Teacher not found"});
//                 continue;
//             } 
//             //find or create attendance document for this teacher and date
//             let attendance = await Attendance.findOne({
//                 userId: teacherId,
//                 userModel: 'Teacher',
//                 month: month,
//             });
//             //create attendance document
//             if(!attendance){
//                 attendance = new Attendance({
//                     userId: teacherId,
//                     userModel: 'Teacher',
//                     role: 'teacher',
//                     class: null,
//                     month: month,
//                     records: []
//                 });  
//             }
//             //check attendance already existd for the date
//             const existingRecordIndex = attendance.records.findIndex(r => r.date === date);
//             if (existingRecordIndex !== -1){
//                 attendance.records[existingRecordIndex].status = status;
//                 attendance.records[existingRecordIndex].remarks = remarks || '';
//             } else {
//                 attendance.records.push({
//                     date: date,
//                     status: status,
//                     remarks: remarks || ''
//                 });
//             }
//             await attendance.save();
//             results.push({
//                 teacherId: teacherId,
//                 success: true,
//                 name: `${teacher.firstName} ${teacher.lastName}`,
//                 status: status
//             });
//         }
//         res.json({message: "Attendancce marking completed", count: results.filter(r => r.success).length, results});

//     } catch (error) {
//         res.status(500).json({message: err.message});
//     }
// }

exports.getStudentsByClass = async (req, res) => {
    try {
        const { class: cls } = req.params;
        const { session, archived, search } = req.query;
        let { page = 1, limit = 50 } = req.query;

        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 50;
        limit = limit > 100 ? 100 : limit;

        if (!cls) {
            return res.status(400).json({ message: "Class parameter is required" });
        }

        const query = { class: cls };

        if (session) {
            query.session = session;
        }

        if (archived !== undefined) {
            query.archived = archived === 'true';
        } else {
            query.archived = false;
        }

        if (search) {
            query.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { studentId: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        const students = await Student.find(query)
            .populate('enrolledBy', 'firstName lastName teacherId email')
            .sort({ firstName: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalDocuments = await Student.countDocuments(query);

        const classTeacher = await Teacher.findOne({ allotedClass: cls, archived: false });

        return res.status(200).json({
            message: `Students of class ${cls} fetched successfully`,
            class: cls,
            classTeacher: classTeacher ? {
                _id: classTeacher._id,
                name: `${classTeacher.firstName} ${classTeacher.lastName}`,
                teacherId: classTeacher.teacherId,
                email: classTeacher.email
            } : null,
            totalDocuments,
            page,
            limit,
            totalPages: Math.ceil(totalDocuments / limit),
            count: students.length,
            students
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStudentsClasswise = async (req, res) => {
    try {
        const { session, archived } = req.query;
        const query = {};
        
        if (session) {
            query.session = session;
        }

        if (archived !== undefined) {
            query.archived = archived === 'true';
        } else {
            query.archived = false;
        }

        const classWiseData = await Student.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$class',
                    totalStudents: { $sum: 1 },
                    students: {
                        $push: {
                            _id: '$_id',
                            firstName: '$firstName',
                            lastName: '$lastName',
                            studentId: '$studentId',
                            email: '$email',
                            phone: '$phone',
                            dob: '$dob',
                            gender: '$gender',
                            enrolledBy: '$enrolledBy',
                            session: '$session',
                            archived: '$archived',
                            createdAt: '$createdAt'
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        
        for (let classData of classWiseData) {
            await Student.populate(classData.students, {
                path: 'enrolledBy',
                select: 'firstName lastName teacherId email'
            });
        }

        const summary = {
            totalClasses: classWiseData.length,
            totalStudents: classWiseData.reduce((sum, cls) => sum + cls.totalStudents, 0),
            classBreakdown: classWiseData.map(cls => ({
                class: cls._id,
                count: cls.totalStudents
            }))
        };

        return res.status(200).json({
            message: "Class-wise students fetched successfully",
            summary,
            data: classWiseData.map(cls => ({
                class: cls._id,
                totalStudents: cls.totalStudents,
                students: cls.students
            }))
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { class: cls, session, archived, search } = req.query;
        let { page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = req.query;

        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 50;
        limit = limit > 100 ? 100 : limit;

        const query = {};
        
        if (cls) {
            query.class = cls;
        }

        if (session) {
            query.session = session;
        }

        if (archived !== undefined) {
            query.archived = archived === 'true';
        } else {
            query.archived = false; 
        }

        if (search) {
            query.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { studentId: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') }
            ];
        }

        const sortOrder = order === 'asc' ? 1 : -1;
        const sort = {};
        sort[sortBy] = sortOrder;

        const students = await Student.find(query)
            .populate('enrolledBy', 'firstName lastName teacherId email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const totalDocuments = await Student.countDocuments(query);

        const classSummary = await Student.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$class',
                    count: { $sum: 1 },
                    students: { $push: '$$ROOT' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            message: "Students fetched successfully",
            totalDocuments,
            page,
            limit,
            totalPages: Math.ceil(totalDocuments / limit),
            count: students.length,
            students,
            classSummary: classSummary.map(cs => ({
                class: cs._id,
                count: cs.count
            }))
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addStudent = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, dob, studentId, password, gender, fatherName, motherName, address, class: className, aadharId, session } = req.body;
        
        // Validation
        if (!firstName || !lastName || !email || !studentId || !password || !className) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        
        if (phone && !validator.isMobilePhone(phone, 'en-IN')) {
            return res.status(400).json({ message: 'Invalid phone number' });
        }
        
        // Check if student already exists
        const exists = await Student.findOne({ $or: [{ email }, { studentId }] });
        if (exists) {
            return res.status(409).json({ message: 'Student with this email or ID already exists' });
        }
        
        // Hash password
        const hashed = await bcrypt.hash(password, 10);
        
        // Create student
        const student = await Student.create({
            firstName,
            lastName,
            email,
            phone: phone || '',
            dob: dob || '',
            studentId,
            password: hashed,
            gender: gender || 'male',
            fatherName: fatherName || '',
            motherName: motherName || '',
            address: address || '',
            class: className,
            aadharId: aadharId || '',
            session: session || new Date().getFullYear().toString(),
            enrolledBy: req.user.id,
            archived: false,
            status: 'active'
        });
        
        res.status(201).json({ 
            message: 'Student added successfully', 
            student: {
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                studentId: student.studentId,
                class: student.class
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.importStudentsCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'CSV file is required' });
        }
        
        const rows = await csvUtil.csvToJson(req.file.buffer);
        const added = [];
        const errors = [];
        
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            
            // Skip if missing required fields
            if (!r.studentId || !r.email || !r.password || !r.firstName || !r.lastName || !r.class) {
                errors.push({ row: i + 1, reason: 'Missing required fields' });
                continue;
            }
            
            // Validate email
            if (!validator.isEmail(r.email)) {
                errors.push({ row: i + 1, studentId: r.studentId, reason: 'Invalid email' });
                continue;
            }
            
            // Check if student already exists
            const ex = await Student.findOne({ $or: [{ email: r.email }, { studentId: r.studentId }] });
            if (ex) {
                errors.push({ row: i + 1, studentId: r.studentId, reason: 'Student already exists' });
                continue;
            }
            
            // Hash password
            const hashed = await bcrypt.hash(r.password, 10);
            
            // Create student document
            const doc = {
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email,
                phone: r.phone || '',
                dob: r.dob || '',
                studentId: r.studentId,
                password: hashed,
                gender: r.gender || 'male',
                fatherName: r.fatherName || '',
                motherName: r.motherName || '',
                address: r.address || '',
                class: r.class,
                aadharId: r.aadharId || '',
                session: r.session || new Date().getFullYear().toString(),
                enrolledBy: req.user.id,
                archived: false,
                status: 'active'
            };
            
            try {
                const saved = await Student.create(doc);
                added.push({ studentId: saved.studentId, name: `${saved.firstName} ${saved.lastName}` });
            } catch (err) {
                errors.push({ row: i + 1, studentId: r.studentId, reason: err.message });
            }
        }
        
        res.json({ 
            message: 'Import completed', 
            addedCount: added.length,
            added,
            errorCount: errors.length,
            errors: errors.slice(0, 10) // Return first 10 errors only
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.archiveStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        student.archived = true;
        student.status = "inactive";
        await student.save();
        res.json({ message: "Student archived successfully", studentId: student.studentId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.unarchiveStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        student.archived = false;
        student.status = "active";
        await student.save();
        res.json({ message: "Student unarchived successfully", studentId: student.studentId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        await Student.findByIdAndDelete(id);
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, address, aadharId, class: className, dob, phone, gender, fatherName, motherName, studentId } = req.body;
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        if (firstName !== undefined) student.firstName = firstName;
        if (lastName !== undefined) student.lastName = lastName;
        if (email !== undefined) student.email = email;
        if (phone !== undefined) student.phone = phone;
        if (address !== undefined) student.address = address;
        if (aadharId !== undefined) student.aadharId = aadharId;
        if (className !== undefined) student.class = className;
        if (dob !== undefined) student.dob = dob;
        if (gender !== undefined) student.gender = gender;
        if (fatherName !== undefined) student.fatherName = fatherName;
        if (motherName !== undefined) student.motherName = motherName;
        if (studentId !== undefined) student.studentId = studentId;
        await student.save();
        res.json({ message: "Student updated successfully", updatedStudent: student });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};