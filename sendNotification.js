const webpush = require('web-push');
// const User = require('./model/User');
// const axios = require('axios');
// const mongoose = require('mongoose');
require('dotenv').config();


const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;

webpush.setVapidDetails('mailto:example@yourdomain.com', publicKey, privateKey);


async function sendNotifications(user, product, price) {
    const payload = {
        notification: {
            data: {
                url: product.link,
                onActionClick: {
                    default: { operation: 'openWindow', url: product.link },
                    foo: { operation: 'openWindow', url: product.link }
                },
            },
            body: product.productName,
            icon: product.img,
            title: "Price has been changed! New price: € "+price,
            vibrate: [100, 50, 100],
            actions: [
                {
                    action: 'foo',
                    title: 'Click here'
                }
            ]
        }
    }
    user.subs.forEach((sub, index) => {
        webpush.sendNotification(sub, JSON.stringify(payload)).catch(async err => {
            console.log(err);
            user.subs.splice(index, 1);
            try {
                await user.save();
            } catch(err) { console.log(err); }
        });
    });
}

module.exports = {
    sendNotifications
}


