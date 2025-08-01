const mongoose = require("mongoose");
require("dotenv").config();

const MONGOUri = process.env.MONGOUrl;

const inilizeData = async () => {
  await mongoose
    .connect(MONGOUri)
    .then(() => {
      console.log("Connected to Database.");
    })
    .catch((error) => {
      console.log("Connecting Database Error:", error);
    });
};

module.exports = { inilizeData };
