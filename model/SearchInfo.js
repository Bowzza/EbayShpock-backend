const mongoose = require('mongoose');

const SearchInfoSchema = mongoose.Schema({

    searchTerm: String,
    ebayPage: {
        type: Number,
        default: 2
    }

}, {timestamps: true});

module.exports = mongoose.model('searchInfo', SearchInfoSchema);