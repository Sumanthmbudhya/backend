const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;


mongoose.connect("mongodb://localhost:27017/userdb")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));


app.use(cors()); 
app.use(bodyParser.json()); 


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); 
  },
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));


const JWT_SECRET = "your_jwt_secret";


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);


const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  designation: { type: String, required: true },
  gender: { type: String, required: true },
  courses: { type: [String], required: true },
  image: { type: String }, 
});

const Employee = mongoose.model("Employee", employeeSchema);


app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    return res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Both username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/employees", upload.single('image'), async (req, res) => {
  const { name, email, phone, designation, gender, courses } = req.body;
  const image = req.file ? req.file.path : null; 

  if (!name || !email || !phone || !designation || !gender || !courses) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newEmployee = new Employee({
      name,
      email,
      phone,
      designation,
      gender,
      courses: courses.split(","),
      image, 
    });

    await newEmployee.save();
    return res.status(201).json({ message: "Employee created successfully", employee: newEmployee });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating employee" });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    return res.status(200).json({ employees });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching employees" });
  }
});


app.delete("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting employee" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
