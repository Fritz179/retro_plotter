const axis = require('./axis.js')
const Chain = require('./Chain.js')
const pigpio = require('pigpio')

const assert = require('./assert.js')
const mm = 80

function pulseMoveOne(delay, x, y) {
    const delay1 = Math.floor(delay / 2)
    const delay2 = Math.ceil(delay / 2)

    const xPin = axis.x.stepPin
    const yPin = axis.y.stepPin

    if (x && y) {
        return [
            { gpioOn: xPin, gpioOff: 0, usDelay: delay1 },
            { gpioOn: yPin, gpioOff: 0, usDelay: delay1 },
            { gpioOn: 0, gpioOff: xPin, usDelay: delay2 },
            { gpioOn: 0, gpioOff: yPin, usDelay: delay2 }
        ]
    }

    if (x) {
        return [
            { gpioOn: xPin, gpioOff: 0, usDelay: delay },
            { gpioOn: 0, gpioOff: xPin, usDelay: delay }
        ]
    }

    if (y) {
        return [
            { gpioOn: yPin, gpioOff: 0, usDelay: delay },
            { gpioOn: 0, gpioOff: yPin, usDelay: delay }
        ]
    }

    assert(false, 'unreachable')
}

const penPin = new pigpio.Gpio(19, {mode: pigpio.Gpio.OUTPUT})

function calibrateSyncDiagonal(delay = 200) {
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
    chain.addPulses(pulseMoveOne(delay, 1, 1))
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
            chain.addPulses(pulseMoveOne(delay, 0, 1))
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
        
            chain.addPulses(pulseMoveOne(delay, 1, 0))
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
    chain.addPulses(pulseMoveOne(delay, 1, 1))
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
        // calibrateSyncDiagonal(1000)
        console.log('Deleteme')
    }
}

function calibrateSync(delay = 200) {
    console.log('Calibration started: ' + delay)

    // reset everithing else
    pigpio.waveTxStop()
    pigpio.waveClear()

    // Pen up
    penPin.digitalWrite(0)
    
    // get most precise calibration
    axis.setMS(16)

    const chain = new Chain()

    // y axis
    {
        // set negative direction
        console.log(`Calibrating on Y axis`)
        chain.addPulses([...axis.genPulseDirection(0, -1)])

        // go back forewer
        chain.repeatStart()
        chain.addPulses(pulseMoveOne(delay, 0, 1))
        chain.repeatForever()

        chain.start()

        while (!axis.y.getEnd()) { }

        chain.stop()
        chain.delete()

        assert(axis.y.getNegative(), 'Calibrated on wrong end!')
        console.log(`Calibrated on Y axis`)

        chain.addPulses([...axis.genPulseDirection(0, 1)])
        chain.repeatStart()
        chain.addPulses(pulseMoveOne(delay, 0, 1))
        chain.repeatFor(70 * mm)
        chain.start()

        while (chain.isBusy())

        chain.delete()
        axis.y.position = 70 * mm
    }

    // x axis
    {
        // set negative direction
        console.log(`Calibrating on X axis`)
        chain.addPulses([...axis.genPulseDirection(-1, 0)])

        // go left forewer
        chain.repeatStart()
        chain.addPulses(pulseMoveOne(delay, 1, 0))
        chain.repeatForever()

        chain.start()

        while (!axis.x.getEnd()) { }

        chain.stop()
        chain.delete()

        assert(axis.x.getNegative(), 'Calibrated on wrong end!')
        console.log(`Calibrated on X axis`)

        chain.addPulses([...axis.genPulseDirection(1, 0)])
        chain.repeatStart()
        chain.addPulses(pulseMoveOne(delay, 1, 0))
        chain.repeatFor(100 * mm)
        chain.start()

        while (chain.isBusy())

        chain.delete()
        axis.x.position = 100 * mm
    }
    
    console.log('Calibration done: ' + delay + '\n')

    // calibrate again with more precision
    if (delay != 1000) {
        // calibrateSync(1000)  
        console.log('Deleteme')
    }
}


function goUntilEndAndLog(delay, x, y) {

    assert(!(x && y), 'Only one dir at a time please')

    let reached
    if (x ==  1) reached = () => axis.x.getPositive()
    if (x == -1) reached = () => axis.x.getNegative()
    if (y ==  1) reached = () => axis.y.getPositive()
    if (y == -1) reached = () => axis.y.getNegative()

    assert(reached, 'invalid end')

    const chain = new Chain()

    // set positive direction
    chain.addPulses([...axis.genPulseDirection(x, y)])
    chain.start()

    while (chain.isBusy()) { }

    chain.delete()

    // set one pulse
    chain.addPulses(pulseMoveOne(delay, x ? 1 : 0, y ? 1 : 0))

    let count = 0
    while (!reached()) {
        chain.start()
        count++

        while (chain.isBusy()) { }
    }

    console.log(x, y, count)

    chain.delete()
}

module.exports = {
    calibrateSync,
    goUntilEndAndLog
}