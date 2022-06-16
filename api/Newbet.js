const express = require("express");
const router = express.Router();

// mongodb Newbet model
const Newbet = require("./../models/Newbet");

// unique string
const{v4: uuidv4} = require("uuid");

//env variables
require("dotenv").config();





// Newbet
router.post("/newbet", (req, res) => {
  let { name, newbet, stake } = req.body;
  name = name.trim();
  newbet = newbet.trim();
  stake = stake.trim();

  if (name == "" || newbet == "" || stake == "" ) {
    res.json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid name entered",
    });
  } else if (!/^[a-zA-Z ]*$/.test(newbet)) {
    res.json({
      status: "FAILED",
      message: "Invalid new bet entered",
    });
  } else {

              newBet
                .save()
                .then((result) => {
                  //handle account verification
                  sendVerifcationEmail(result,res);
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An error occurred while saving Bet!",
                  });
                });
            }

});

module.exports = router;