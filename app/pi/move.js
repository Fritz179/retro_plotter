const pigpio = require('pigpio');

const error = require('./error.js')
const axis = require('./axis.js')

const {generateWaveSetBit, generateWaveDoStep, repeatStart, repeatForever, getStepChain} = require('./waves.js')

const penWaveOn = generateWaveSetBit(5, 1)
const penWaveOff = generateWaveSetBit(5, 0)

function getPenWave() {
    return [
        penWaveOn, penWaveOff,
        penWaveOn, penWaveOff,
    ]
}

let moving = false
function moveBy(x, y, delay = 200) {
    if (moving) error('Already moving')
    moving = true

    axis.setCallback(axis => {
        console.log(`Endschalter reached!! ${axis}`)
        error(axis)
    })

    if (axis.x.position == null || axis.y.position == null) {
        error('Not calibrated!')
    }

    const chain = []

    chain.push(x > 0 ? axis.x.positiveWave: axis.x.neagtiveWave)
    chain.push(y > 0 ? axis.y.positiveWave: axis.y.neagtiveWave)

    x = Math.abs(x)
    y = Math.abs(y)

    chain.push(...getStepChain(Math.abs(x), Math.abs(y), delay))

    pigpio.waveChain(chain);

    return new Promise(resolve => {
        function test() {
            if (pigpio.waveTxBusy()) {
                setTimeout(test, 10)
                return
            }

            moving = false
            resolve()
        }

        test()
    })
}


function calibrate(delay = 200) {

    // Uncomment to skip calibration
    // axis.x.position = 0
    // axis.y.position = 0
    // return
    
    // get most precise calibration
    axis.x.setMS(16)
    axis.y.setMS(16)

    const chain = []

    // set negative direction
    chain.push(axis.x.neagtiveWave)
    chain.push(axis.y.neagtiveWave)

    // go diagonal forewer
    chain.push(...repeatStart())
    chain.push(generateWaveDoStep(1, 1, delay))
    chain.push(...repeatForever())

    pigpio.waveChain(chain);

    //xy axis
    while (true) {

        // x axis
        if (axis.x.getEnd()) {
            pigpio.waveTxStop()

            console.log(`Calibrated on X axis`)
            if (!axis.x.getNegative()) error('Calibrated on wrong end!')

            let chain = []

            chain.push(...repeatStart())
            chain.push(generateWaveDoStep(0, 1, delay))
            chain.push(...repeatForever())

            pigpio.waveChain(chain);

            while (!axis.y.getEnd()) {

            }

            console.log(`Calibrated on Y axis`)
            if (!axis.y.getNegative()) error('Calibrated on wrong end!')
            break
        }   

        // y axis
        if (axis.y.getEnd()) {
            pigpio.waveTxStop()

            console.log(`Calibrated on Y axis`)
            if (!axis.y.getNegative()) error('Calibrated on wrong end!')

            let chain = []

            chain.push(...repeatStart())
            chain.push(generateWaveDoStep(1, 0, delay))
            chain.push(...repeatForever())

            pigpio.waveChain(chain);

            while (!axis.x.getEnd()) {
                
            }

            console.log(`Calibrated on X axis`)
            if (!axis.x.getNegative()) error('Calibrated on wrong end!')
            break
        }
    }

    // go to 0/0
    const zeroChain = []

    // set positive direction
    zeroChain.push(axis.x.positiveWave)
    zeroChain.push(axis.y.positiveWave)

    zeroChain.push(...getStepChain(-axis.x.endPosition, -axis.y.endPosition, delay))

    pigpio.waveChain(zeroChain);

    while (true) {
        if (axis.x.getPositive()) error('To much X axis')
        if (axis.y.getPositive()) error('To much Y axis')

        if (!pigpio.waveTxBusy()) break
    }

    axis.x.position = 0
    axis.y.position = 0

    // calibrate again with more precision
    if (delay != 1000) {
        calibrate(1000)
    }
}
calibrate()

module.exports = {
    calibrate,
    moveBy
}