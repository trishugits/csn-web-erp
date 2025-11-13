const Notice = require("../models/notice");
const Student = require("../models/student");
const Teacher = require("../models/teacher");
const Admin = require("../models/admin");

exports.getNotice = async (req, res) => {
    try {
        const role = req.user.role?.toLowerCase?.();
        const profileId = req.user.profile?._id;
      const now = new Date();
  
      // 🧩 Show all active notices (past startDate, not expired)
      const baseQuery = {
        startDate: { $lte: now },
        $or: [
          { endDate: { $gte: now } },
          { endDate: { $exists: false } },
          { endDate: null }
        ],
      };
  
      let notices = [];
  
      // 🧑‍🎓 STUDENT: See notices created by Admin + their Teacher
      if (role === "student") {
        const student = await Student.findById(profileId);
        if (!student) return res.status(404).json({ message: "Student not found" });
  
        const teacher = await Teacher.findOne({ allotedClass: student.class });
  
        notices = await Notice.find({
          ...baseQuery,
          $or: [
            { createdByModel: "Admin" },
            teacher ? { createdBy: teacher._id, createdByModel: "Teacher" } : {},
          ],
        })
          .sort({ createdAt: -1 })
          .populate("createdBy", "firstName lastName email");
      }
  
      // 👩‍🏫 TEACHER: See notices created by Admin + their own
      else if (role === "teacher") {
        const teacher = await Teacher.findById(profileId);
        if (!teacher) return res.status(404).json({ message: "Teacher not found" });
  
        notices = await Notice.find({
          ...baseQuery,
          $or: [
            { createdByModel: "Admin" },
            { createdBy: teacher._id, createdByModel: "Teacher" }
          ],
        })
          .sort({ createdAt: -1 })
          .populate("createdBy", "firstName lastName email");
      }
  
      // 👨‍💼 ADMIN: See all notices regardless of importance or creator
      else if (role === "admin") {
        notices = await Notice.find(baseQuery)
          .sort({ createdAt: -1 })
          .populate("createdBy", "firstName lastName email");
      }
  
      res.status(200).json({
        message: "Notices fetched successfully",
        count: notices.length,
        notices,
      });
    } catch (err) {
      console.error("Error fetching notices:", err);
      res.status(500).json({ message: err.message });
    }
  };
  
  

exports.getProfile = async (req, res) => {
    res.json({profile: req.user.profile || null, role: req.user.role});
}


