const Gpio = require('pigpio').Gpio;

const assert = require('./assert.js')
const {pulsePin} = require('./pulse.js')

const steppingMS = {
    1:  [0, 0, 0],
    2:  [1, 0, 0],
    4:  [0, 1, 0],
    8:  [1, 1, 0],
    16: [1, 1, 1],
}

const EMI_REPEAT = 3
class Axis {
    constructor({dirPin, stepPin, positivePin, neagtivePin, invertDir, endPosition, ms1, ms2, ms3}) {
        this.direction = new Gpio(dirPin, {mode: Gpio.OUTPUT})
        this.step = new Gpio(stepPin, {mode: Gpio.OUTPUT})
        this.direction.digitalWrite(invertDir ? 0 : 1)
        this.lastDirection = 1
        this.step.digitalWrite(0)

        this.dirPin = dirPin
        this.stepPin = stepPin

        this.positivePin = new Gpio(positivePin, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_DOWN, edge: Gpio.EITHER_EDGE })
        this.neagtivePin = new Gpio(neagtivePin, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_DOWN, edge: Gpio.EITHER_EDGE })

        this.ms = 1
        this.ms1 = new Gpio(ms1, {mode: Gpio.OUTPUT})
        this.ms2 = new Gpio(ms2, {mode: Gpio.OUTPUT})
        this.ms3 = new Gpio(ms3, {mode: Gpio.OUTPUT})
        this.setMS(this.ms)
        
        this.position = null
        this.invertDir = invertDir
        this.endPosition = endPosition
    }

    pulsePositiveDirection(delay) {
        return pulsePin(this.dirPin, !this.invertDir, delay)
    }

    pulseNegativeDirection(delay) {
        return pulsePin(this.dirPin, this.invertDir, delay)
    }

    *genPulseDirection(direction, delay = () => 1000) {
        assert(direction == -1 || direction == 1 || direction == 0, `Invalid direction: ${direction}`)

        if (direction == 0) return

        if (direction == this.lastDirection) return
        this.lastDirection = direction
        
        if (direction == 1) {
            yield this.pulsePositiveDirection(delay)
        } else {
            yield this.pulseNegativeDirection(delay)
        }
    }

    setMS(speed) {
        const data = steppingMS[speed]
        assert(data, 'Invalid MS speed: ' + speed)

        this.ms1.digitalWrite(data[0])
        this.ms2.digitalWrite(data[1])
        this.ms3.digitalWrite(data[2])
    }

    // Due to HMI some calls to digitalRead can be wrong
    getPositive() {
        for (let i = 0; i < EMI_REPEAT; i++) {
            if (!this.positivePin.digitalRead()) {
                return false
            }
        }

        return true
    }

    getNegative() {
        for (let i = 0; i < EMI_REPEAT; i++) {
            if (!this.neagtivePin.digitalRead()) {
                return false
            }
        }

        return true
    }

    getEnd() {
        return this.getNegative() || this.getPositive()
    }
}

const x = new Axis({
    dirPin: 14,
    stepPin: 15,
    positivePin: 16,
    neagtivePin: 21,
    endPosition: -1000,
    invertDir: true,
    ms1: 2,
    ms2: 3,
    ms3: 4
})

const y = new Axis({
    dirPin: 24,
    stepPin: 23,
    positivePin: 26,
    neagtivePin: 20,
    endPosition: -1000,
    invertDir: true,
    ms1: 17,
    ms2: 27,
    ms3: 22
})

const last = {}
const unsafeCallbacks = false
x.positivePin.on('interrupt', level => {
    if (last.xp == level) {
        return
    }

    last.xp = level

    if (level && (unsafeCallbacks || x.getPositive())) callback('X+')
})
x.neagtivePin.on('interrupt', level => {
    if (last.xn == level) {
        return
    }

    last.xn = level
    if (level && (unsafeCallbacks || x.getNegative())) callback('X-')
})

y.positivePin.on('interrupt', level => {
    if (last.yp == level) {
        return
    }

    last.yp = level
    if (level && (unsafeCallbacks || y.getPositive())) callback('Y+')
})
y.neagtivePin.on('interrupt', level => {
    if (last.yn == level) {
        return
    }

    last.yn = level
    if (level && (unsafeCallbacks || y.getNegative())) callback('Y-')
})

let callback = () => {}

function setCallback(fn) {
    callback = fn
}

function setMS(n) {
    x.setMS(n)
    y.setMS(n)
}

function* genPulseDirection(xp, yp) {
    yield* x.genPulseDirection(xp)
    yield* y.genPulseDirection(yp)
}

module.exports = {
    x,
    y,
    setCallback,
    setMS,
    genPulseDirection
}