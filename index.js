const { inilizeData } = require("./dbconnect/db.connect");
inilizeData();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const USER = require("./models/users.model");
const Task = require("./models/task.model");
const Team = require("./models/team.model");
const Project = require("./models/project.model");
const Tags = require("./models/tags.model");

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
  JWT Middleware
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
// app.get("/tasks", authMiddleware, (req, res) => {
//   res.json({
//     message: "Access granted to protected tasks route ",
//     userId: req.user,
//   });
// });

/* Tasks API  stating*/

// creating tasks

async function addingTasks(tasks) {
  try {
    const newTask = Task(tasks);
    const savedTask = await newTask.save();
    return savedTask;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.post("/tasks", async (req, res) => {
  try {
    const tasks = await addingTasks(req.body);

    if (tasks) {
      res.status(201).json({ message: "Task added successfully." });
    } else {
      res.status(400).json({ error: "Failed to Add Task" });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  Getting the Task

app.get("/tasks", async (req, res) => {
  const { team, owners, tags, project, status } = req.query;
  const query = {};
  if (team) {
    query.team = team;
  }
  if (owners) {
    query.owners = owners;
  }
  if (tags) {
    query.tags = tags;
  }
  if (project) {
    query.project = project;
  }
  if (status) {
    query.status = status;
  }
  const data = await Task.find(query);

  res.json(data);
});

// Updating the Task

async function updatingTask(TaskId, updateToTask) {
  try {
    const updatedTask = await Task.findByIdAndUpdate(TaskId, updateToTask, {
      new: true,
    });
    if (!updateToTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    return updatedTask;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.post("/tasks/:id", async (req, res) => {
  try {
    const modifyTask = await updatingTask(req.params.id, req.body);

    if (modifyTask) {
      res.status(200).json({ message: "Task Updatd Successfully", modifyTask });
    } else {
      res.status(500).json({ error: "Task not Updated", modifyTask });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  Deleting the Task Api

async function deletingTask(TaskId) {
  try {
    const removedTask = await Task.findByIdAndDelete(TaskId);
    return removedTask;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await deletingTask(req.params.id);

    if (deletedTask) {
      res
        .status(200)
        .json({ message: "Task Deleted Successfully", deletedTask });
    } else {
      res.status(500).json({ error: "Data not deleted yet." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

/* Tasks API  stating*/
/* -------------------------------------------- */

/* Team Api's Starting */

// adding Team API

async function addingTeamMember(employee) {
  try {
    const empData = Team(employee);
    const SavedData = await empData.save();
    return SavedData;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.post("/teams", async (req, res) => {
  try {
    const savedTeam = await addingTeamMember(req.body);
    if (savedTeam) {
      res.status(200).json({ message: "Team added Successfully.", savedTeam });
    } else {
      res.status(500).json({ error: "Team is not added." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  Get all Teams Data

async function showAllTeams() {
  try {
    const allTeams = await Team.find();
    return allTeams;
  } catch (error) {
    console.log(error);
  }
}

app.get("/teams", async (req, res) => {
  try {
    const Teams = await showAllTeams();
    if (Teams) {
      res.status(200).json(Teams);
    } else {
      res.status(404).json({ error: "Teams not found." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

/* ---------------------------------------------------*/

// Project API's

// create new project
async function addingProject(project) {
  try {
    const savingproject = Project(project);
    const savedProject = await savingproject.save();

    return savedProject;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.post("/projects", async (req, res) => {
  try {
    const addedProject = await addingProject(req.body);
    if (addedProject) {
      res
        .status(200)
        .json({ message: "Project addded Successfuly.", addedProject });
    } else {
      res.status(500).json({ error: "Project not added" });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  get all Projects

async function showAllProject() {
  try {
    const allProjectData = await Project.find();
    return allProjectData;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.get("/projects", async (req, res) => {
  try {
    const allProject = await showAllProject();
    if (allProject) {
      res.status(200).json(allProject);
    } else {
      res.status(404).json({ error: "Projects not found" });
    }
  } catch (error) {
    console.log(error);
  }
});

//  tags API's

async function createNewTags(tags) {
  try {
    const addingTags = Tags(tags);
    const savedTags = await addingTags.save();
    return savedTags;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.post("/tags", async (req, res) => {
  try {
    const addedTags = await createNewTags(req.body);

    if (addedTags) {
      res
        .status(200)
        .json({ message: "Tags created Successfully.", addedTags });
    } else {
      res.status(500).json({ error: "Tags not created." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  Get all Tags

async function showAllTags() {
  try {
    const showTags = await Tags.find();
    return showTags;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.get("/tags", async (req, res) => {
  try {
    const allTags = await showAllTags();
    if (allTags) {
      res.status(200).json(allTags);
    } else {
      res.status(404).json({ error: "Tags not found." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

/*----------- Report API's ---------------*/

// lastweek API

async function getLastWeekTasks() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo, getDate() - 7);

    const tasks = await Task.find({
      status: "Completed",
      updatedAt: { $gte: oneWeekAgo },
    });
    return tasks;
  } catch (error) {
    console.log("Error:", error);
  }
}

app.get("/report/last-week", async (req, res) => {
  try {
    const lastWeekTasks = await getLastWeekTasks();

    if (lastWeekTasks) {
      res.status(200).json({
        message: "Tasks completed in the last 7 days.",
        count: lastWeekTasks.length,
        lastWeekTasks,
      });
    } else {
      res.status(404).json({ erorr: "No tasks found" });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  Pending Work

async function getPendingReport() {
  try {
    const pendingTasks = await Task.find({ status: "Completed" });
    const totalPendingDays = pendingTasks.reduce(
      (sum, task) => sum + (task.timeToComplete || 0),
      0
    );
    return { totalPendingDays, pendingTasks };
  } catch (error) {
    console.log("Error:", error);
  }
}

app.get("/report/pending", async (req, res) => {
  try {
    const report = await getPendingReport();
    if (report) {
      res.status(200).json({
        message: "Pending work report",
        totalPendingDays: report.totalPendingDays,
        taskCount: report.pendingTasks.length,
      });
    } else {
      res.status(404).json({ error: "No Pending tasks found." });
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

//  closed-tasks

app.get("/report/closed-tasks", async (req, res) => {
  try {
  } catch (error) {
    console.log("Error:", error);
  }
});

/* ------------------------
   Start Server
-------------------------*/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
