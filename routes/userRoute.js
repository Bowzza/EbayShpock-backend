const express = require('express');
const router = express.Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const checkJWT = require('../middleware/checkJWT');


const registerSchema = Joi.object({
    email: Joi.string()
    .min(4)
    .max(100)
    .email()
    .required(),

    password: Joi.string()
    .min(8)
    .required()
})

const loginSchema = Joi.object({
    email: Joi.string()
    .min(4)
    .max(100)
    .email()
    .required(),

    password: Joi.string()
    .required()
})


router.post('/register', async (req, res) => {
    const {error} = registerSchema.validate(req.body);
    if(error) return res.status(401).json({ message: error.details[0].message });
    const language = req.header('Accept-Language');

    const email = req.body.email;

    const findEmail = await User.findOne({email: email});
    if(findEmail) {
        if(language === 'en-US') {
            return res.status(404).json({ message: 'This email already exists.' });
        } else {
            return res.status(404).json({ message: 'Diese Email Adresse existiert bereits.' });
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const rndString = crypto.randomBytes(32).toString('hex');

    const user = new User({
        email: req.body.email,
        password: hashedPassword,
        hash: rndString
    });
    try {
        await user.save();
    } catch(err) {
        res.status(404).send(err);
    }

    //await mail.sendVerifyMail(email, 'https://grocerycompare-backend.herokuapp.com/api/users/verify/' + user._id + '/' + user.hash);

    res.json({ message: 'registered' });
});


router.post('/login', async (req, res) => {
    const {error} = loginSchema.validate(req.body);
    if(error) return res.status(401).json({ message: error.details[0].message });
    const language = req.header('Accept-Language');
    console.log()
    const email = req.body.email;
    const password = req.body.password;
    const foundUser = await User.findOne({email});
    if(!foundUser) {
        if(language === 'de-AT') {
            return res.status(404).json({ message: 'Email Adresse oder Passwort ist falsch.' });
        } else {
            return res.status(404).json({ message: 'Email or password is wrong.' });
        }
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if(!validPassword) {
        if(language === 'de-AT') {
            return res.status(401).json({ message: 'Email Adresse oder Passwort ist falsch.' });
        } else {
            return res.status(404).json({ message: 'Email or password is wrong.' });
        }
    }

    foundUser.last_login = Date.now();
    try {
        await foundUser.save();
    } catch(err) {
        console.log(err.message);
    }


    const token = jwt.sign({id: foundUser._id}, process.env.SECRET, { expiresIn: '2h' });
    res.json({token, expiresIn: 7200, userId: foundUser._id, email: foundUser.email});
});


router.post('/changeEmail', checkJWT, async (req, res) => {
    const foundUser = await User.findById(req.user.id);
    const newEmail = req.body.email;
    const language = req.header('Accept-Language');

    if(!foundUser) return res.status(404).json({ message: 'User not found.' });
    if(!newEmail) return res.status(404).json({ message: 'No email has been sent.' });

    if(newEmail === foundUser.email) {
        if(language === 'de-AT') {
            return res.status(404).json({ message: 'Diese Email ist genau dieselbe wie die Alte.' });
        } else {
            return res.status(404).json({ message: 'This email is the same as the old one.' });
        }
    }

    const foundNewEmail = await User.findOne({ email: newEmail });
    if(foundNewEmail) {
        if(language === 'de-AT') {
            return res.status(404).json({ message: 'Diese Email wird bereits verwendet.' });
        } else {
            return res.status(404).json({ message: 'This email is already being used.' });
        }
    }

    foundUser.email = newEmail;

    try {
        await foundUser.save();
    } catch (err) { console.log(err); }

    res.json({ message: 'Email has been changed' });
});


router.post('/changePassword', checkJWT, async (req, res) => {
    const foundUser = await User.findById(req.user.id);
    const newPassword = req.body.password;
    const language = req.header('Accept-Language');

    if(newPassword.length < 8) {
        if(language === 'de-At') {
            return res.status(404).json({ message: 'Das Passwort muss aus mindestens 8 Zeichen bestehen.' });
        } else {
            return res.status(404).json({ message: 'The password must be at least 8 characters long.' });
        }
    }
    if(!newPassword) return res.status(404).json({ message: 'No password has been sent.' });

    const validPassword = await bcrypt.compare(newPassword, foundUser.password);
    if(validPassword) {
        if(language === 'de-AT') {
            return res.status(404).json({ message: 'Das neue Passwort darf mit dem Alten nicht ??bereinstimmen.' });
        } else {
            return res.status(404).json({ message: 'The new password may not be the same like the old password.' });
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    foundUser.password = hashedPassword;

    try {
        await foundUser.save();
    } catch (err) { console.log(err); }

    res.json({ message: 'Password has been changed' });
});


router.get('/product', checkJWT, async (req, res) => {
    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    res.json(findUser.wishlist);
});


router.post('/addProduct', checkJWT, async (req, res) => {
    const product = req.body.product;
    if(!product) return res.status(404).json({ message: 'Product not found.' });

    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    let inList = false;
    findUser.wishlist.forEach(el => {
        if(el.articleNumber == product.articleNumber) { inList = true; } 
    });
    if(inList) return res.status(400).json({ message: 'Product is already in the list.' });

    findUser.wishlist.push(product);
    try {
        await findUser.save();
        res.json({ message: 'Product has been added.' });
    } catch (err) {
        console.log(err.message);
    }
});


router.delete('/:productId', checkJWT, async (req, res) => {
    const articleNumber = req.params.productId;
    if(!articleNumber) return res.status(404).json({ message: 'Product not found.' });
    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    let inList = false;
    findUser.wishlist.forEach((el, index) => {
        findUser.notifyProducts.forEach((product, i) => {
            if(product.articleNumber == articleNumber) findUser.notifyProducts.splice(i, 1);
        });
        if(el.articleNumber == articleNumber) {
            findUser.wishlist.splice(index, 1);
            inList = true;
        }
    });
    if(!inList) return res.status(400).json({ message: 'Product is not in the list.' });
    try {
        await findUser.save();
        res.json({ message: 'Product has been removed.' });
    } catch (err) {
        console.log(err.message);
    }
});


module.exports = router;