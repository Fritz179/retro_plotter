require('dotenv').config();

//setup express
const app = require('express')()
const path = require('path');
const { inflateRaw } = require('zlib');
require('./setup/express.js')(app, __dirname);

// connect the raspberry
const {draw} = require('./pi/pi.js')
draw(`
    D 300
    M 100, 100
    M 5000, 5000
    P 0
    M 5000, 10000
    P 1
    M 5000, 5000
    m 0, 5000
    m 0, -5000
`)

// connect the error page to all remaining requests (404)
app.get('*', (req, res) => {
    res.render('./home/index.html')
})

//connect Server to localhost
const server = app.listen(process.env.PORT || 1234, () => {
    console.log(`Server online on: http://localhost:${server.address().port} !!`);
})