const express = require("express");
const router = express.Router();

// mongodb user model
const User = require("./../models/User");

// user verification
const UserVerification = require("./../models/UserVerification")

//email handler
const nodemailer = require("nodemailer");

// unique string
const {v4: uuidv4} = require("uuid");

//env variables
require("dotenv").config();

// Password handler
const bcrypt = require("bcrypt");
const { get } = require("mongoose");

//path for static email page
const path = require("path");

//nodemailer
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS
  },
  tls: {
    rejectUnauthorized: false
}
});

//testing success
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

// Signup
router.post("/signup", (req, res) => {
  let { name, email, password, dateOfBirth } = req.body;
  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  if (name == "" || email == "" || password == "" || dateOfBirth == "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid name entered",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid email entered",
    });
  } else if (!new Date(dateOfBirth).getTime()) {
    res.json({
      status: "FAILED",
      message: "Invalid date of birth entered",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password is too short!",
    });
  } else {
    // Checking if user already exists
    User.find({ email })
      .then((result) => {
        if (result.length) {
          // A user already exists
          res.json({
            status: "FAILED",
            message: "User with the provided email already exists",
          });
        } else {
          // Try to create new user

          // password handling
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newUser = new User({
                name,
                email,
                password: hashedPassword,
                dateOfBirth,
                verified: false,
              });

              newUser
                .save()
                .then((result) => {
                  //handle account verification
                  sendVerificationEmail(result, res);
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An error occurred while saving user account!",
                  });
                });
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "An error occurred while hashing password!",
              });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing user!",
        });
      });
  }
});

// send verification email
const sendVerificationEmail = ({_id, email}, res) => {
  //url to be used in the email
  const currenturl = 'http://localhost:5000/';

  const uniqueString = uuidv4() + _id;

  //mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "verify your email",
    html: `<p>Verify your email address to complete the signup and login< into your account.</p><p> This link expires in 6 hours.</p> Press <a href=${currenturl + "User/verify/" + _id + "/" + uniqueString}> here</a> to proceed.</p>`,
  };

  // hash the unique string
  const saltRounds = 10;
  bcrypt
  .hash(uniqueString, saltRounds)
  .then((hashedUniqueString)=>{
    // set values in userverification collection
    const newVerification = UserVerification({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000,

    });
    newVerification
    .save()
    .then(()=>{
      transporter.sendMail(mailOptions)
      .then(() => {
        //email sent and verification saved
        res.json({
          status: "PENDING",
          message: "Email sent",
        });
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: "FAILED",
          message: "Verification email failed",
        });
      })
    })
    .catch((error) => {
      console.log(error);
      res.json({
        status: "FAILED",
        message: "Couldn't save verification email data",
      });
    })
  })
  .catch(() => {
    res.json({
      status: "FAILED",
      message: "An error occured while hashing email data",
    });
  })
};

//Verify email
router.get("/verify/:userId/:uniqueString", (req, res) =>{

  let{userId, uniqueString} = req.params;

  UserVerification
  .find({userId})
  .then((result) => {
    if (result.length > 0) {
      //user verifcation exists and we can proceed 

      const {expiresAt} = result[0];
      const hashedUniqueString =result[0].uniqueString;

      //checking for expired link

      if (expiresAt < Date.now()) {
        UserVerification
        .deleteOne({ userId})
        .then(result => {
          User
          .deleteOne({_id: userId})
          .then(()=> {
              let message = "link has expired, please sign up again";
              res.redirect(`/User/Verified/error=true&message = ${message}`);
    
          })
          .catch((error) => {
            let message = "clearing user with expired unique string error";
            res.redirect(`/User/Verified/error=true&message = ${message}`);
          })
        })
        .catch((error) => {
          let message = "An error occured while clearing expired user verification record";
          res.redirect(`/User/Verified/error=true&message = ${message}`);

        })
      } else { 
        // valid verification and valid string
        //first compute unique string

        bcrypt
        .compare(uniqueString, hashedUniqueString)
        .then(result => {
          if (result) {
            //strings match
            User.updateOne({_id: userId}, {verified: true})
            .then(() => {
              UserVerification
              .deleteOne({userId})
              .then(() => {
                res.sendFile(path.join(__dirname, './../Views/Verified.html'));
              })
              .catch((error) => {
                let message = "An error occured while finalising successful verification";
                res.redirect(`/User/Verified/error=true&message = ${message}`);
      
              })
            })
            .catch((error) => {
              let message = "An error occured while updating record to true";
              res.redirect(`/User/Verified/error=true&message = ${message}`);
    
            })


          } else {
            //exsisting
              let message = "Invalid verification details passed, check your inbox.";
              res.redirect(`/User/Verified/error=true&message = ${message}`);
          }
        })
        .catch((error) => {
          let message = "An error occured while comparing strings";
          res.redirect(`/User/Verified/error=true&message = ${message}`);

        })
      }
      
    } else {
      let message = "Account record doesn't exist or has been verified already. Please sign up or log in";
      res.redirect(`/User/Verified/error=true&message = ${message}`);
    }
  })
  .catch((error) =>{
    console.log(error);
    let message = "An error occured while checking for verification record";
    res.redirect(`/User/Verified/error=true&message = ${message}`);
  })
});

//Verified page route

router.get("/Verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./../Views/Verified.html"));
})

// Signin
router.post("/signin", (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty credentials supplied",
    });
  } else {
    // Check if user exist
    User.find({ email })
      .then((data) => {
        if (data.length) {
          // User exists

          //check verification is true

          if (!data[0],verified) {
            res.json({
              status: 'FAILED',
              message: ' Email has not been verified'
            });
          } else {
            const hashedPassword = data[0].password;
            bcrypt
              .compare(password, hashedPassword)
              .then((result) => {
                if (result) {
                  // Password match
                  res.json({
                    status: "SUCCESS",
                    message: "Signin successful",
                    data: data,
                  });
                } else {
                  res.json({
                    status: "FAILED",
                    message: "Invalid password entered!",
                  });
                }
              })
              .catch((err) => {
                res.json({
                  status: "FAILED",
                  message: "An error occurred while comparing passwords",
                });
              });

          }


         
        } else {
          res.json({
            status: "FAILED",
            message: "Invalid credentials entered!",
          });
        }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing user",
        });
      });
  }
});

module.exports = router;