const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs =require('fs');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});


var upload = multer({
    storage: storage,
}).single("image");

// Insert user into database
router.post('/add', upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
        });

        await user.save(); // Save user using await and promises

        req.session.message = {
            type: 'success',
            message: 'User added successfully'
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

//get all user
router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render("index", {
            title: "Home Page",
            users: users,
            // message: {
            //     type: "info", // Set a default message type if needed
            //     message: "Data added Sucessfully", // Set a default message if needed
            // },
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

router.get("/add", (req, res) => {
    res.render("add_users.ejs", { title: 'Add user' });
});

//edit user
router.get("/edit/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).exec();
        if (user === null) {
            res.redirect('/');
        } else {
            res.render('edit_users', {
                title: "Edit User",
                user: user,
            });
        }
    } catch (err) {
        res.redirect('/');
    }
});

// update user route
router.post('/update/:id', upload, async (req, res) => {
    const id = req.params.id;
    let newImage = '';

    if (req.file) {
        newImage = req.file.filename;
        try {
            fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        newImage = req.body.old_image;
    }

    try {
        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: newImage,
        });

        if (!result) {
            res.json({ message: 'User not found', type: 'danger' });
        } else {
            req.session.message = {
                type: 'success',
                message: 'User updated successfully',
            };
            res.redirect('/');
        }
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});


//delete user 
// Delete user
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.json({ message: 'User not found' });
        }

        if (user.image !== '') {
            try {
                fs.unlinkSync('./uploads/' + user.image);
            } catch (err) {
                console.log(err);
            }
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.json({ message: 'Failed to delete user' });
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message });
    }
});

module.exports = router;

