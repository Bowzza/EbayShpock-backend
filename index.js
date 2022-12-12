const express = require('express');
const serverless = require("serverless-http");
const app = express();
const cors = require('cors');
const bodyparser = require('body-parser');
app.use(cors());
app.use(bodyparser.json());
const mongoose = require('mongoose');
const cron = require('node-cron');
const cronjob = require('./cronjobs');
require('dotenv').config();

const userRoute = require('./routes/userRoute');
const searchRoute = require('./routes/searchRoute');
const notifyRoute = require('./routes/notifyRoute');
const auth = require('./middleware/auth');

//app.use(auth);
app.use('/api/users', userRoute);
app.use('/api/search', searchRoute);
app.use('/api/notify', notifyRoute);

mongoose.connect(process.env.MONGODB_URL, () => {
  console.log('Connected to mongodb');
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log('Server listens in port '+port);
});

cron.schedule('0 8,12,16,20,22 * * *', () => {
  cronjob();
});