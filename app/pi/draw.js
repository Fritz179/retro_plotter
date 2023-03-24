const {moveBy} = require('./move.js')
const axis = require('./axis.js')
const pigpio = require('pigpio')

function wait(n) {
    return new Promise(solve => {
        setTimeout(() => solve(), n)
    })
}

function waitSyncMicro(micro = 0) {
    const start = process.hrtime.bigint()
    const delay = micro * 1000
    while (delay > process.hrtime.bigint() - start) {
      
    }
}

const {generateWaveDoStep} = require('./waves.js')

async function draw() {
    // await moveBy(5000, 5000)
    
    // for (let i = 0; i < 4; i++) {
    //     await moveBy(1000, 1000)
    //     await moveBy(1000, -1000)
    //     await moveBy(-1000, -1000)
    //     await moveBy(-1000, 1000)
    // }

    axis.y.setMS(16)

    const waves = []

    function moveForward(n = 1, delay = 500) {
        for (let i = 0; i < n; i++) {
            waves.push({ gpioOn: axis.y.stepPin, gpioOff: 0, usDelay: delay });
            waves.push({ gpioOn: 0, gpioOff: axis.y.stepPin, usDelay: delay });
        }
    }

    function movePositive()  {
        waves.push({ gpioOn: 0, gpioOff: 24, usDelay: 1000 })
    }

    function moveNegative()  {
        waves.push({ gpioOn: 24, gpioOff: 0, usDelay: 1000 })
    }

    function changePen(delay) {
        waves.push({ gpioOn: 5, gpioOff: 0, usDelay: delay });
        waves.push({ gpioOn: 0, gpioOff: 5, usDelay: delay });
    }

    // for (let i = 0; i < 10000; i++) {
    //     changePen(1000 * 100)
    // }

    const penPin = new pigpio.Gpio(19, {mode: pigpio.Gpio.OUTPUT})

    while (true) {
        
        console.log("0")
        penPin.digitalWrite(0)
        waitSyncMicro(1000 * 1000)

        console.log("turning to 1")
        penPin.digitalWrite(1)
        waitSyncMicro(1000 * 1000)
    }

    penPin.digitalWrite(0)

    console.log('Hello')

    // movePositive()
    // moveForward(3000, 200)

    // function doMove(s) {
    //     moveForward(1000, s * 4)
    //     moveForward(1000, s * 2)
    //     moveForward(2000, s)
    //     moveForward(1000, s * 2)
    //     moveForward(1000, s * 4)
    // }

    // for (let i = 50; i > 10; i--) {
    //     movePositive()
    //     doMove(i)
    //     moveNegative()
    //     doMove(i)
    // }

    let lastWaveId = -1
    let lastLastWaveId = -1

    // waveTxBusy()
    // waveTxAt()

    function createWave() {
        const data = waves.splice(0, 1000)

        if (!data.length) {
            return
        }
        // console.log(data)

        pigpio.waveAddGeneric(data);
        const waveId = pigpio.waveCreate();

        return waveId
    }

    function sendWave() {
        const waveId = createWave()
        if (!waveId) return

        if (pigpio.waveTxBusy()) {
            pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_ONE_SHOT_SYNC)
        } else {
            pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_ONE_SHOT)
        }

        if (lastLastWaveId != -1) {
            pigpio.waveDelete(lastLastWaveId)
        }
        
        lastLastWaveId = lastWaveId
        lastWaveId = waveId
    }

    function checkWave() {
        if (!pigpio.waveTxBusy()) {
            sendWave()
            return
        }

        if (pigpio.waveTxAt() == lastWaveId) {
            sendWave()
        }
    }

    setInterval(checkWave)

    console.log(waves.length)

    // while (pigpio.waveTxBusy()) {}

    // for (let delay = 100; delay > 10; delay-=5) {
    //     console.log(delay)
    //     await moveBy(0, 7000,  delay)
    //     await wait(200)
    //     await moveBy(0, -7000, delay)
    //     await wait(200)
    // }

    console.log('Done')
}

module.exports = {
    draw
}