const { Client } = require('@elastic/elasticsearch');
require('dotenv/config');

const client = new Client( {
    cloud: {
        id: process.env.ELASTIC_URL
    },
    auth: {
        username: process.env.ELASTIC_USER,
        password: process.env.ELASTIC_PWD
    }
});

client.info()
  .then(response => console.log('Connected to elasticdb'))
  .catch(error => console.error(error));


module.exports = client;