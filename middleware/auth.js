module.exports = (req, res, next) => {
    const auth = req.header('Authorization');
    if(!auth) return res.status(403).send('No access allowed!');
    if(auth) {
        if(auth === process.env.auth) {
            next();
        } else {
            return res.status(403).send('No access allowed!');
        }
    }
}