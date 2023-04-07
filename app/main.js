require('dotenv').config();

//setup express
const app = require('express')()
require('./setup/express.js')(app, __dirname);

// socket
const { Server } = require("socket.io");
const { calibrateSync } = require('./pi/calibrate.js');
calibrateSync()

// connect the raspberry
const {draw, setMessager} = require('./pi/pi.js')

// connect everything to the index page
app.get('*', (req, res) => {
    res.render('./home/index.html')
})

// connect Server to localhost
const server = app.listen(process.env.PORT || 1234, () => {
    console.log(`Server online on: http://localhost:${server.address().port} !!`);
    console.log(`If on py use: http://raspberrypi.local:${server.address().port} !!/`)
})

// attach sockets
const io = new Server(server);

// Update users on plotter position
function sendMessage(name, data) {
    io.emit(name, data)
}

// console.log(midi)
draw('X')

setMessager(sendMessage)

io.on('connection', (socket) => {
    console.log('Socket connection established');

    socket.on('draw', code => {
        console.log('New drawing issued')
        console.log(code)
        draw(code)
    })

    socket.on('recalibrate', () => {
        console.log('New calibration issued')
        calibrateSync()
    })

    socket.on('disconnect', () => {
        console.log('Socket connection terminated');
    });

});