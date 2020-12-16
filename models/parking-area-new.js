const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema({
    mobile:String,
    contactName:String,
    parkingName:String,
    latitude:String,
    longitude:String,
  created: { type: Date, default: Date.now },
  
});

module.exports = mongoose.model("Parking", parkingSchema, "parking-area-new");
