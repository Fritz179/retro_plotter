const axis = require('./axis.js')
const Chain = require('./Chain.js')
const pigpio = require('pigpio')

const assert = require('./assert.js')

function pulseMoveOne(delay) {
    const delay1 = Math.floor(delay / 2)
    const delay2 = Math.ceil(delay / 2)

    const xPin = axis.x.stepPin
    const yPin = axis.y.stepPin

    return [
        { gpioOn: xPin, gpioOff: 0, usDelay: delay1 },
        { gpioOn: yPin, gpioOff: 0, usDelay: delay1 },
        { gpioOn: 0, gpioOff: xPin, usDelay: delay2 },
        { gpioOn: 0, gpioOff: yPin, usDelay: delay2 }
    ]
}

const penPin = new pigpio.Gpio(19, {mode: pigpio.Gpio.OUTPUT})

function calibrateSync(delay = 200) {
    console.log('Calibration started: ' + delay)

    // Pen up
    penPin.digitalWrite(0)
    // Uncomment to skip calibration
    // axis.x.position = 0
    // axis.y.position = 0
    // return
    
    // get most precise calibration
    axis.setMS(16)

    const chain = new Chain()

    // set negative direction
    chain.addPulses([...axis.genPulseDirection(-1, -1)])

    // go diagonal forewer
    chain.repeatStart()
    chain.addPulses(pulseMoveOne(delay))
    chain.repeatForever()

    chain.start()

    //xy axis
    while (true) {

        // x axis
        if (axis.x.getEnd()) {
            chain.stop()

            console.log(`Calibrated on X axis`)
            assert(axis.x.getNegative(), 'Calibrated on wrong end!')

            chain.delete()

            chain.repeatStart()
            chain.addPulses([
                { gpioOn: axis.y.stepPin, gpioOff: 0, usDelay: delay },
                { gpioOn: 0, gpioOff: axis.y.stepPin, usDelay: delay }
            ])
            chain.repeatForever()

            chain.start()

            while (!axis.y.getEnd()) {

            }

            console.log(`Calibrated on Y axis`)
            assert(axis.y.getNegative(), 'Calibrated on wrong end!')
            break
        }   

        // y axis
        if (axis.y.getEnd()) {
            chain.stop()

            console.log(`Calibrated on Y axis`)
            assert(axis.y.getNegative(), 'Calibrated on wrong end!')

            chain.delete()

            chain.repeatStart()
            chain.addPulses([
                { gpioOn: axis.x.stepPin, gpioOff: 0, usDelay: delay },
                { gpioOn: 0, gpioOff: axis.x.stepPin, usDelay: delay }
            ])
            chain.repeatForever()

            chain.start()

            while (!axis.x.getEnd()) {
                
            }

            console.log(`Calibrated on X axis`)
            assert(axis.x.getNegative(), 'Calibrated on wrong end!')
            break
        }
    }

    // go to 0/0
    chain.delete()

    // set positive direction
    chain.addPulses([...axis.genPulseDirection(1, 1)])

    chain.repeatStart()
    chain.addPulses(pulseMoveOne(delay))
    chain.repeatFor(1000)

    chain.start()

    while (true) {
        assert(!axis.x.getPositive(), 'To much X axis')
        assert(!axis.y.getPositive(), 'To much Y axis')

        if (!chain.isBusy()) break
    }

    chain.delete()

    axis.x.position = 0
    axis.y.position = 0
    console.log('Calibration done: ' + delay + '\n')

    // calibrate again with more precision
    if (delay != 1000) {
        calibrateSync(1000)
    }
}

module.exports = calibrateSync