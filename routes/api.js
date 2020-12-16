const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Image = require("../models/parking-areas");
const Parking = require("../models/parking-area-new");
const passwordResetToken = require("../models/resettoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db =
  "mongodb+srv://Abdurrazack:Abdurrazack@cluster0-qfh8b.mongodb.net/ParksmardDB?retryWrites=true&w=majority";
//  const db = "mongodb+srv://localhost/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

mongoose.connect(
  db,
  { useNewUrlParser: true, useUnifiedTopology: true },
  error => {
    if (error) {
      console.error("Error:" + error);
    } else {
      console.log("Connection to Database Succeeded..");
    }
  }
);

// register api
router.post("/register", (req, res) => {
  let userData = req.body;
  let newUser = new User(userData);
  User.findOne({ email: userData.email }, (err, user) => {
    if (err) {
      console.log(err);
      res.send(err);
    }
    //if a user was found, that means the user's email matches the entered email
    if (user) {
      res.status(400).send("This email has already been registered");
    } else {
      bcrypt.hash(userData.password, 10, (err, hash) => {
        newUser.password = hash;
        newUser.save((err, registeredUser) => {
          if (err) {
            res.status(500).send("Error in registering new user");
          } else {
            res
              .status(200)
              .send(registeredUser.fullName + " " + "registered successfully");
          }
        });
      });
    }
  });
});

// login api
router.post("/login", (req, res) => {
  let userData = req.body;
  User.findOne({ email: userData.email }, (error, user) => {
    if (error) {
      console.log(error);
    } else {
      if (!user) {
        res.status(401).send("Email you have entered is incorrect");
      } else {
        bcrypt.compare(userData.password, user.password, (err, loggedIn) => {
          if (loggedIn) {
            let payload = { subject: user._id };
            let token = jwt.sign(payload, "secretKey");
            res.status(200).send({ token });
          } else {
            res.sendStatus(403);
          }
        });
      }
    }
  });
});

router.put("/updateUser", (req, res) => {
  var token = req.headers["x-access-token"];
  if (!token)
    return res.status(401).send({ auth: false, message: "No token provided" });
  jwt.verify(token, "secretKey", function(err, decoded) {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "failed to auth token" });
    User.findByIdAndUpdate(
      { _id: decoded.subject },
      req.body,
      (err, updatedUser) => {
        if (err) {
          res.send(err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  });
});

let UPLOAD_PATH = "./public/images";
// Multer Settings for file upload
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
});

let upload = multer({ storage: storage });

// Upload a new image
router.post("/upload/image", upload.single("imageFile"), (req, res, next) => {
   console.log(req.file);
  if (!req.file) {
    res.status(422).send('No image found to upload');
  }
  res.status(200).send('File uploaded successfully! -> filename = ' + req.file.filename)
});
  
// Get all uploaded images
router.get("/images", (req, res, next) => {
  // use lean() to get a plain JS object
  // remove the version key from the response
  Image.find({}, "-__v")
    .lean()
    .exec((err, images) => {
      if (err) {
        res.sendStatus(400);
      }

      // Manually set the correct URL to each image
      for (let i = 0; i < images.length; i++) {
        var img = images[i];
        img.url = req.protocol + "://" + req.get("host") + "/images/" + img._id;
      }
      res.json(images);
    });
});

// Get one image by its ID
router.get("/images/:id", (req, res, next) => {
  let imgId = req.params.id;

  Image.findById(imgId, (err, image) => {
    if (err) {
      res.sendStatus(400);
    }
    // stream the image back by loading the file
    res.setHeader("Content-Type", "image/jpeg");
    fs.createReadStream(path.join(UPLOAD_PATH, image.filename)).pipe(res);
  });
});

// Getting user details api
router.get("/getUserDetails/:email", (req, res) => {
  let email = req.params.email;
  User.findOne({ email: email }, (error, user) => {
    if (error) {
      res.status(404).send("User Not Found");
    } else {
      res.status(200).send(user);
    }
  });
});

router.get("/getAllUsers", (req, res) => {
  User.find({}, (err, users) => {
    res.status(200).send(users);
  });
});

router.delete("/deleteUser/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id, err => {
    if (err) {
      res.status(500).send();
    }
    return res.status(200).send();
  });
});

router.post("/req-reset-password", (req, res) => {
  if (!req.body.email) {
    return res.status(500).json({ message: "Email is required" });
  }
  User.findOne({ email: req.body.email }, (error, user) => {
    if (!user) {
      res.status(409).send("Email does not exist");
    }
    var resettoken = new passwordResetToken({
      _userId: user._id,
      resettoken: crypto.randomBytes(16).toString("hex")
    });
    resettoken.save(err => {
      if (err) {
        res.status(500).send({ msd: err.message });
      }
      passwordResetToken
        .find({ _userId: user._id, resettoken: { $ne: resettoken.resettoken } })
        .remove()
        .exec();
      res.status(200).json({ message: "Reset Password successfully." });
      var transporter = nodemailer.createTransport({
        service: "Gmail",
        port: 465,
        auth: {
          user: "user",
          pass: "password"
        }
      });
      var mailOptions = {
        to: user.email,
        from: "abdurrazack13@gmail.com",
        subject: "Password Reset",
        text:
          "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          "http://localhost:8100/login/set-password/" +
          resettoken.resettoken +
          "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n"
      };
      transporter.sendMail(mailOptions, (err, info) => {});
    });
  });
});

router.post("/valid-password-token", (req, res) => {
  if (!req.body.resettoken) {
    return res.status(500).json({ message: "Token is required" });
  }
  const user = passwordResetToken.findOne({
    resettoken: req.body.resettoken
  });
  if (!user) {
    return res.status(409).json({ message: "Invalid URL" });
  }
  User.findOneAndUpdate({ _id: user._userId })
    .then(() => {
      res.status(200).json({ message: "Token verified successfully." });
    })
    .catch(err => {
      return res.status(500).send({ msg: err.message });
    });
});

router.post("/new-password", (req, res) => {
  passwordResetToken.findOne(
    { resettoken: req.body.resettoken },
    (err, userToken, next) => {
      if (!userToken) {
        return res.status(409).json({ message: "Token has expired" });
      }
      User.findOne({ _id: userToken._userId }, (err, userEmail, next) => {
        if (!userEmail) {
          return res.status(409).json({ message: "User does not exist" });
        }
        return bcrypt.hash(req.body.newPassword, 10, (err, hash) => {
          if (err) {
            return res.status(400).json({ message: "Error hashing password" });
          }
          userEmail.password = hash;
          userEmail.save(err => {
            if (err) {
              return res
                .status(400)
                .json({ message: "Password can not reset." });
            } else {
              userToken.remove();
              return res
                .status(201)
                .json({ message: "Password reset successfully" });
            }
          });
        });
      });
    }
  );
});
router.post("/insertParkingArea", (req, res) => {

  let parking = new Parking(req.body);
  parking.save().then((result)=>{
    res.send(result);
  },(err)=>{
    res.send(err);
  })

  
  
})



  router.get("/getParkingArea", (req, res) => {
    Parking.find({}, (err, parkings) => {
      res.status(200).send(parkings);
    });
  });

  
  

module.exports = router;
