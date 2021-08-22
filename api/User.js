const express = require('express');
const User = require('./../models/User');
const router = express.Router();

//mongoose user module

const user = require('./../models/User')

//password handler

const bcrypt = require('bcrypt');

//signup

router.post('/signup', (req, res) => {
    let{name, email, password, dateOfBirth}= req.body;
    name = name.trim();
    email=email.trim();
    password=password.trim();
    dateOfBirth=dateOfBirth.trim();

    if(name == "" || email == "" || password == "" || dateOfBirth == "") {
        res.jason({
            status: "FAILED",
            message: "Empty input fields"
        });
    } else if (!/^[a-zA-Z ]*$/.test(name)) {
        res.json({
            status: "FAILED",
            message: "Invalid name"
        })
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid password"
        })
    } else if (!new Date(dateOfBirth).getTime()) {
        res.json({
            status: "FAILED",
            message: "Invalid date"
        })
    } else if (password.length < 8) {
        res.json({
            status: "FAILED",
            message: "password too short"
        })
    } else {
        //check user exsits
        User.find({email}).then(result => {
            if (result.length) {
                //user exsits
                res.json({
                    status: "FAILED",
                    message: "user exsits"
                })
            } else {
                //Try to create new User

                //password handling
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User ({
                        name,
                        email,
                        password: hashedPassword,
                        dateOfBirth
                    });
                    newUser.save().then(result => {
                        res.json({
                            status: "SUCCESS",
                            message: "signup successful",
                            data: result,
                        })
                    })
                    .catch(err => {
                        res.json({
                            status: "FAILED",
                            message: "an error occured while saving user account"
                        })
                    })

                })
                .catch(err => {
                    res.json({
                        status: "FAILED",
                        message: "an error occured while hashing"
                    })
                })
            }

        }).catch(err => {
            console.log(err);
            res.json({
                status: "FAILED",
                message: "An errorer occured while checking for user"
            })
        })
    }

})

//signin

router.post('/signin', (req, res) => {
    let{email, password} = req.body;
    email = email.trim();
    password = password.trim();

    if (email == "" || password == "") {
        res.json({
            status: "FAILED",
            message: "Empty field"
        })
    } else { 
        //check user exsits
        User.find({email})
        .then(data => {
            if (data.length) {
                //User exsits
                const hashedPassword = data[0].password;
                bcrypt.compare(password, hashedPassword).then(result => {
                    if (result) {
                        //password match
                        res.json({
                            status: "SUCCESS",
                            message: "Signin Succecful",
                            data: data
                        })
                    } else {
                        res.json({
                            status: "FAILED",
                            message: "Invalid Password"
                        })

                    }
                })
                .catch(err => {
                    res.json({
                        status: "FAILED",
                        message: "An error occured while comparing passwords"
            })
        })
} else  {
    res.json({
        status: "FAILED",
        message: "Invalid Credentials"
})
}
        })
        .catch(err => {
            res.json({
                status: "FAILED",
                message: "An error occured while checking for exsisting user" 
            })
        })

    }
        
})

module.exports=router;