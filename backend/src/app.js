const express = require('express');
const app = express();
require('dotenv').config({ path: require('path').resolve(__dirname, '../env')});
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const Admin = require('./models/admin');
const bcrypt = require('bcrypt');
app.use(express.json());
app.use(cookieParser());

// CORS for frontend integration
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true 
}));
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/teacher', teacherRoutes);
app.use('/student', studentRoutes);
// app.post('/addAdmin', async (req, res) => {
//     try {
//         const { adminId, name, email, password, roles, aadharId, address } = req.body;

//         if (!adminId || !name || !email || !password) {
//             return res.status(400).json({ message: 'Missing required fields' });
//         }

//         const hashPassword = await bcrypt.hash(password, 10);

//         const admin = await Admin.create({
//             adminId,
//             name,
//             email,
//             password: hashPassword,
//             roles,
//             aadharId,
//             address,
//         });

//         res.status(201).json({ message: 'Admin created', admin });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

const connectDB = require("./config/database")
connectDB()
.then(() => {
    console.log("Database Connected Successfully...");
    app.listen(process.env.PORT, ()=> {
        console.log(`Server is successfully running at http://localhost:${process.env.PORT}`)
    });
})
.catch((err) => {
    console.log("Database not connected");
});
