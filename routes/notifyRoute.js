const express = require('express');
const router = express.Router();
const User = require('../model/User');
const checkJWT = require('../middleware/checkJWT');
const notificate = require('../sendNotification');


router.get('/', checkJWT, async (req, res) => {
    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    res.json(findUser.notifyEnabled);
});


router.post('/enableNotify', checkJWT, async (req, res) => {
    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    findUser.notifyEnabled = !findUser.notifyEnabled;
    try {
        await findUser.save();
    } catch (err) { console.log(err.message); }
    res.json({ message: 'Notify status set to '+findUser.notifyEnabled });
});


router.get('/notifyProducts', checkJWT, async (req, res) => {
    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    res.json(findUser.notifyProducts);
});


router.post('/addToNotifyProduct', checkJWT, async (req, res) => {
    const product = req.body.product;
    if(!product) return res.status(404).json({ message: 'Product not found.' });

    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    let inList = false;
    findUser.notifyProducts.forEach(el => {
        if(el.articleNumber === product.articleNumber) { inList = true; } 
    });
    if(inList) return res.status(400).json({ message: 'Product is already in the list.' });

    findUser.notifyProducts.push(product);
    try {
        await findUser.save();
        res.json({ message: 'Product has been added.' });
    } catch (err) {
        console.log(err.message);
    }
});


router.delete('/deleteFromNotifyProduct/:productId', checkJWT, async (req, res) => {
    const productId = req.params.productId;
    if(!productId) return res.status(404).json({ message: 'Product not found.' });

    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    let inList = false;
    findUser.notifyProducts.forEach((el, index) => {
        if(el._id == productId) {
            findUser.notifyProducts.splice(index, 1);
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


router.post('/addSub', checkJWT, async (req, res) => {
    const sub = req.body.sub;
    if(!sub) return res.status(404).json({ message: 'Product not found.' });

    const findUser = await User.findById(req.user.id);
    if(!findUser) return res.status(404).json({ message: 'User not found.' });

    let inList = false;
    findUser.subs.forEach(el => {
        if(el.endpoint === sub.endpoint) { inList = true; } 
    });
    if(inList) return res.status(400).json({ message: 'Sub is already in the list.' });

    findUser.subs.push(sub);
    try {
        await findUser.save();
        res.json({ message: 'Sub has been added.' });
    } catch (err) {
        console.log(err.message);
    }
});


router.get('/testNotify', checkJWT, async (req, res) => {
    const foundUser = await User.findById(req.user.id);
    if(!foundUser) return res.status(401).json({ message: 'User not found.' });
    if(!foundUser.notifyEnabled) return res.status(404).json({ message: 'Notification is not enabled.' });
    if(foundUser.notifyProducts.length === 0) return res.status(404).json({ message: 'No products are in the notify list.' });

    foundUser.notifyProducts.forEach(product => {
        notificate.sendNotifications(foundUser, product, product.price);
    });

    res.json({ message: 'All users have been notified.' });
});


module.exports = router;


