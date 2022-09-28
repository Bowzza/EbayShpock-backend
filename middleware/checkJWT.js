const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('auth-token');
    if(!token) return res.status(404).send('No token found.');

    try {
        req.user = jwt.verify(token, process.env.SECRET);
        next();
    } catch(err) {
        res.status(400).send(err);
    }
}