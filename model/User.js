const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
	    required: true
    },

    notifyEnabled: {
        type: Boolean,
        default: false
    },

    wishlist: [
        {
            productId: mongoose.ObjectId,
            articleNumber: String,
            productName: String,
            description: String,
            price: Number,
            img: String,
            link: String,
            shop: String,
            inWishlist: Boolean,
            notify: Boolean
        }
    ],

    notifyProducts: [
        {
            productId: mongoose.ObjectId,
            articleNumber: String,
            productName: String,
            description: String,
            price: Number,
            img: String,
            link: String,
            shop: String,
            inWishlist: Boolean,
            notify: Boolean
        }
    ],

    subs: [
        {
            endpoint: String,
            expirationTime: String,
            keys:{
               p256dh: String,
               auth: String
            }
         }
    ],

    hash: {
        type: String,
        unique: true
    },

    last_login: Date,

}, {timestamps: true});

module.exports = mongoose.model('users', UserSchema);