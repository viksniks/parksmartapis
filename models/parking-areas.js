const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  desc: String,
  created: { type: Date, default: Date.now },
  latitude:String,
  logitude:String,
  contactNumber:String,
  contactName:String
});

module.exports = mongoose.model("Image", imageSchema, "parking-areas");
