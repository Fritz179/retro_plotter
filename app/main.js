require('dotenv').config();

//setup express
const app = require('express')()
const path = require('path')
require('./setup/express.js')(app, __dirname);

// connect the error page to all remaining requests (404)
app.get('*', (req, res) => {
  res.render('./home/index.html')
})

//connect Server to localhost
const server = app.listen(process.env.PORT || 1234, () => {
  console.log(`Server online on: http://localhost:${server.address().port} !!`);
})
