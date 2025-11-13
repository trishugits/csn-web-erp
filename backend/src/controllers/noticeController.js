const Notice = require("../models/notice");
const Teacher = require("../models/teacher");

exports.addNotice = async (req, res) => {
    try {
      const { title, message, startDate, endDate, important } = req.body;
      const userRole = req.user.role;
  
      if (!title || !message || !startDate) {
        return res.status(400).json({ message: "Title, message, and startDate are required" });
      }
  
      if (userRole === "student") {
        return res.status(403).json({ message: "Students are not allowed to create notices" });
      }
  
      let computedTarget = req.body.target || {};
  
      // 🧩 For teachers: force their allotted class as target
      if (userRole === "teacher") {
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }
  
        const teacherClass = teacher.allotedClass;
        if (!teacherClass) {
          return res.status(400).json({ message: "No allotted class found for this teacher" });
        }
  
        // 🔒 Force the target for teachers
        computedTarget = {
          classes: Array.isArray(teacherClass) ? teacherClass : [teacherClass],
        };
      } else {
        // 🧹 Sanitize admin input: make sure it's an object with arrays
        computedTarget = {
          roles: Array.isArray(computedTarget.roles) ? computedTarget.roles : [],
          classes: Array.isArray(computedTarget.classes) ? computedTarget.classes : [],
          ids: Array.isArray(computedTarget.ids) ? computedTarget.ids : [],
        };
      }
  
      const notice = await Notice.create({
        title,
        message,
        target: computedTarget,
        startDate,
        endDate,
        important,
        createdBy: req.user.id,
        createdByModel: userRole === "teacher" ? "Teacher" : "Admin",
      });
  
      res.status(201).json({ message: "Notice created successfully", notice });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

exports.editNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const role = req.user.role;
        
        const notice = await Notice.findById(id);  
        if (!notice) return res.status(404).json({message: "Notice not found"});  
        
        if (role === 'student') {  
            return res.status(403).json({message: "Students cannot edit notices"});  
        }
        
        if (role === 'teacher' && notice.createdBy.toString() !== req.user.id) {  
            return res.status(403).json({message: "You can only edit your own notices"});  
        }
        
        if (role === "teacher" && updates.target?.classes) {
            const teacher = await Teacher.findById(req.user.id);  
            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found" });
            }
            
            const teacherClass = teacher.allotedClass;
            const invalidClasses = updates.target.classes.filter(
                cls => cls !== teacherClass  
            );
            
            if (invalidClasses.length > 0){
                return res.status(403).json({message: `You cannot assign notices to unauthorised classes: ${invalidClasses.join(", ")}`});
            }
        }
        
        const allowedFields = ["title", "message", "target", "startDate", "endDate", "important"];
        let filteredUpdates = {};
        for (const key of allowedFields){
            if (updates[key] !== undefined){
                filteredUpdates[key] = updates[key];
            }
        }
        
        const updatedNotice = await Notice.findByIdAndUpdate(id, filteredUpdates, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({message: "Notice updated successfully", notice: updatedNotice});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.deleteNotice = async (req, res) => {
    try {
        const {id} = req.params;
        const role = req.user.role;
        
        const notice = await Notice.findById(id);
        if (!notice){
            return res.status(404).json({message: "Notice not found"});  
        }
        
        if (role === 'student'){  
            return res.status(403).json({message: "Students cannot delete notices"});  
        }
        
        if (role === "teacher" && notice.createdBy.toString() !== req.user.id){  
            return res.status(403).json({message: "You can only delete your own notices"}); 
        }
        
        await Notice.findByIdAndDelete(id); 
        res.status(200).json({message: "Notice deleted successfully"});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.getPublishedNotices = async (req, res) => {
    try {
        const { role, id } = req.user;
        let { page = 1, limit = 50, search } = req.query;
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 50;
        limit = limit > 50 ? 50 : limit;

        let query = {};

        if (role === 'admin') {
            query.createdBy = id;
        }

        if (role === 'teacher') {
            query.createdBy = id;
        }

        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { message: new RegExp(search, 'i') }
            ];
        }

        const notices = await Notice.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('createdBy', 'firstName lastName email');

        const totalDocuments = await Notice.countDocuments(query);

        res.status(200).json({
            message: "Published notices fetched successfully",
            totalDocuments,
            page,
            count: notices.length,
            notices
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
