require('dotenv').config();

//setup express
const app = require('express')()
const path = require('path');
const { inflateRaw } = require('zlib');
require('./setup/express.js')(app, __dirname);

// connect the raspberry
// const {draw} = require('./pi/draw.js')
// draw()

function* t() {
  return
}

function* iter() {
  yield 4
  yield* t()
  yield 5
}

for (a of iter()) {
  console.log(a)
}

/*

// connect the error page to all remaining requests (404)
app.get('*', (req, res) => {
  res.render('./home/index.html')
})

//connect Server to localhost
const server = app.listen(process.env.PORT || 1234, () => {
  console.log(`Server online on: http://localhost:${server.address().port} !!`);
})

*/