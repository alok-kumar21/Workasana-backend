const mongoose = require("mongoose");

const tagsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Tags = new mongoose.model("Tags", tagsSchema);

module.exports = Tags;
