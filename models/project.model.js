const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, require: true, unique: true },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Project = new mongoose.model("Project", projectSchema);

module.exports = Project;
