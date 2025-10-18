const express = require('express');
const app = express();
const Student = require("./models/studentDB")
app.use(express.json());
app.post("/teachers/addstudent", async (req, res) => {
    const student = new Student(req.body);
    try {
        student.save();
        res.send("Student Added Successfully");
    } catch (err) {
        res.status(400).send("Error saving the student: " + err.message);
    }
})

const connectDB = require("./config/database")
connectDB()
.then(() => {
    console.log("Database Connected Successfully...");
    app.listen(3009, ()=> {
        console.log("Server is successfully running on port 3009...")
    });
})
.catch((err) => {
    console.log("Database not connected");
});
