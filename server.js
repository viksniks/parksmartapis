const express = require("express");
const bodyParser = require("body-parser");
const api = require("./routes/api");
const cors = require("cors");
const PORT = 3000;

// initializing express
const app = express();

// middlewares
app.use(cors());
app.use(bodyParser.json());
app.use("/api", api);


app.listen(PORT, () => {
  console.log("Server is running on port:" + PORT);
});
