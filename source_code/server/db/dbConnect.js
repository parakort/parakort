const mongoose = require("mongoose");
require('dotenv').config();

// Import models
const Trial = require("./trialModel");
const Options = require("./optionsModel.js");

async function dbConnect() {
  mongoose.connect(process.env.MONGO_URI, { dbName: true? "TheClubhouse" : process.env.APP_NAME })
    .then(() => {
      console.log("Successfully connected to MongoDB Atlas!");
      initDb(); // Call initDb after connection is successful
    })
    .catch((error) => {
      console.log("Unable to connect to MongoDB Atlas!");
      console.error(error);
    });
}



async function initDb() {
  // Create default Options doc if none exists
  try {
    const optionsCount = await Options.countDocuments();
    if (optionsCount === 0) {
      const defaultOptions = new Options({});
      await defaultOptions.save();
      console.log("Default options document created.");
    }
  } catch (error) {
    console.error("Error creating default options document:", error);
  }

  // Create default trial doc if none exists
  try {
    const trialCount = await Trial.countDocuments();
    if (trialCount === 0) {
      const defaultTrials = new Trial({});
      await defaultTrials.save();
      console.log("Default trial document created.");
    }
  } catch (error) {
    console.error("Error creating default trial document:", error);
  }
}

module.exports = dbConnect;
