

const { inilizeData } = require("./dbconnect/db.connect");
inilizeData();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const USER = require("./models/users.model");

const app = express();
app.use(express.json());
require("dotenv").config();

const corsOption = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOption));

/* ------------------------
   Helper: JWT Middleware
-------------------------*/
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // store user id in req
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

/* ------------------------
   Signup Function
-------------------------*/
async function addingUser(userData) {
  try {
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(userData.password, salt);
    const user = new USER({
      name: userData.name,
      email: userData.email,
      password: secPass,
    });
    return await user.save();
  } catch (error) {
    console.log("Error:", error);
    return null;
  }
}

/* ------------------------
   Signup API
-------------------------*/
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check existing user
    const existingUser = await USER.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const savedUser = await addingUser({ name, email, password });
    if (savedUser) {
      res.status(201).json({ message: "User registered successfully" });
    } else {
      res.status(400).json({ error: "User not registered" });
    }
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------
   Login API
-------------------------*/
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // create JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallbackSecretKey",
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------
   Protected Example Route
-------------------------*/
app.get("/tasks", authMiddleware, (req, res) => {
  res.json({
    message: "Access granted to protected tasks route ✅",
    userId: req.user,
  });
});

/* ------------------------
   Start Server
-------------------------*/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
