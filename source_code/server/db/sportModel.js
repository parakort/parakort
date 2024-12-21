const mongoose = require("mongoose");

const SportSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    image: String, // Additional metadata for each sport
    // Other shared fields
  });
  
module.exports = mongoose.model.Sports || mongoose.model("Sport", SportSchema);