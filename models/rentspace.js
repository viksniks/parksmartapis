const mongoose = require("mongoose");

const rentSchema = new mongoose.Schema({
    images:String,
    selectedCountry:String,
    address:String,
    parkingType:String,
    vehicletype:String,
    desc:String,
    mobile:String,
    features:String,
    email:String
});

module.exports = mongoose.model("Rent", rentSchema, "rent-space");