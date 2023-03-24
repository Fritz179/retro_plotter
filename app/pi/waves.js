const pigpio = require('pigpio');

const error = require('./error.js')
const axis = require('./axis.js')

function generateWaveSetBit(pin, value, delay = 10000) {
    const waveform = [];

    if (value) {
        waveform.push({ gpioOn: pin, gpioOff: 0, usDelay: delay });
    } else {
        waveform.push({ gpioOn: 0, gpioOff: pin, usDelay: delay });
    }
    

    pigpio.waveAddGeneric(waveform);

    const waveId = pigpio.waveCreate();
    if (waveId > 255) {
        error('To many wave ids!')
    }

    return waveId
}

const generateWaveDoStepCache = {}
function generateWaveDoStep(x, y, delay = 1000) {
    const id = `${x}, ${y}, ${delay}`

    if (x < 0 || y < 0) error(`generateWaveDoStep, x: ${x}, y: ${y}`)

    if (typeof generateWaveDoStepCache[id] != 'number') {
        const waveform = [];

        if (x && y) {
            delay1 = Math.floor(delay / 2)
            delay2 = Math.ceil(delay / 2)
            
            const xPin = axis.x.stepPin
            const yPin = axis.y.stepPin

            waveform.push({ gpioOn: xPin, gpioOff: 0, usDelay: delay1 });
            waveform.push({ gpioOn: yPin, gpioOff: 0, usDelay: delay1 });
            waveform.push({ gpioOn: 0, gpioOff: xPin, usDelay: delay2 });
            waveform.push({ gpioOn: 0, gpioOff: yPin, usDelay: delay2 });
        } else {
            if (!x && !y) {
                error('Invalid waveform')
            }

            const pin = axis[x ? 'x' : 'y'].stepPin

            waveform.push({ gpioOn: pin, gpioOff: 0, usDelay: delay });
            waveform.push({ gpioOn: 0, gpioOff: pin, usDelay: delay });
        }

        pigpio.waveAddGeneric(waveform);

        const waveId = pigpio.waveCreate();
        if (waveId > 200) {
            error('To many wave ids!')
        }

        generateWaveDoStepCache[id] = waveId
    }

    return generateWaveDoStepCache[id]
}

function getStepChain(x, y, delay = 500) {
    const chain = []

    if (!x && !y) {
        error('Not moving')
    }

    // diagonal part
    chain.push(...repeatStart())
    chain.push(generateWaveDoStep(Math.sign(x), Math.sign(y), delay))
    const times = Math.min(x, y)
    chain.push(...repeatFor(times))
    x -= times
    y -= times

    // lienar
    if (x || y) {
        chain.push(...repeatStart())
        chain.push(generateWaveDoStep(Math.sign(x), Math.sign(y), delay))
        const times = Math.max(x, y)
        chain.push(...repeatFor(times))
    }

    return chain
}

function repeatStart() {
    return [255, 0]
}

function repeatFor(n) {
    const x = n % 256
    const y = (n - x) / 256

    if (y > 255) error('To much repeat')

    return [255, 1, x, y]
}

function repeatForever() {
    return [255, 3]
}

module.exports = {
    generateWaveSetBit,
    generateWaveDoStep,
    repeatFor,
    repeatStart,
    repeatForever,
    getStepChain
}

///////