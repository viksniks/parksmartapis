const express = require("express");
const bodyParser = require("body-parser");
const api = require("./routes/api");
const cors = require("cors");
const PORT = 3000;

// initializing express
const app = express();

// middlewares

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true 
}));
app.use(cors());
app.use("/api", api);
app.use('/public/images', express.static(__dirname + '/public/images'));
//app.use(bodyParser.json());




app.listen(PORT, () => {
  console.log("Server is running on port:" + PORT);
});
