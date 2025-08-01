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
  optionSuccessStatus: true,
};
app.use(cors(corsOption));

// user signup api

async function addingUser(userData) {
  try {
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(userData.password, salt);
    const user = {
      name: userData.name,
      email: userData.email,
      password: secPass,
    };
    const addingData = USER(user);
    const addedData = addingData.save();
    return addedData;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.post("/auth/signup", async (req, res) => {
  try {
    const savedUser = await addingUser(req.body);
    if (savedUser) {
      res.status(200).json({ messae: "user added Successfully." }, savedUser);
    } else {
      res.status(404).json({ error: "User not Added Successfully." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const userData = await getuserData();
    if (userData) {
      res.status(200).json({ message: "data Found" });
    } else {
      res.status(404).json({ error: "user not found." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Server is runinng on PORT:", PORT);
});
