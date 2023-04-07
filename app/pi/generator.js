const pigpio = require('pigpio')
const axis = require('./axis.js')

const targetDelay = 1000 * 1000
const targetSize = 1000

let lastId = null
let deleteId = null

function createWave() {
    const data = []
    let time = 0
    
    while (true) {
        let next = generator.next()

        if (next.value == empty) break

        // always create a CB for the delay so that the wave can reuse an old one
        if (!next.value.usDelay) next.value.usDelay = 1
        
        data.push(next.value)
        time += next.value.usDelay

        if (time >= targetDelay) break
        if (data.length >= targetSize) break
    }

    if (time == 0) return

    // TODO: Pad stoppable
    while (data.length < targetSize) {
        data.push(empty)
    }

    pigpio.waveAddGeneric(data);

    const position = {
        x: axis.x.position,
        y: axis.y.position
    }

    sendMessage('position', JSON.stringify(position))

    const Cbs = pigpio.waveGetCbs()
    const pulses = pigpio.waveGetPulses()

    const waveId = pigpio.waveCreate();

    if (time != 0) {
        // console.log(`Created wave: ${waveId}, length: ${data.length}, time: ${time}, Cbs: ${Cbs}, Pulses: ${pulses}`)
    }
    

    return waveId
}

function sendWave() {
    const waveId = createWave()
    if (typeof waveId != 'number') {
        pigpio.waveClear()
        lastId = null
        deleteId = null
        return
    }

    if (pigpio.waveTxBusy()) {
        // console.log('Sending wave as SYNC')
        pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_ONE_SHOT_SYNC)
    } else {
        // console.log('Sending wave as SHOT')
        pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_ONE_SHOT)
    }

    if (deleteId != null) {
        // console.log(`Deliting wave: ${deleteId}`)
        pigpio.waveDelete(deleteId)
    }
    
    deleteId = lastId
    lastId = waveId
}

function consume() {
    try {
        if (!pigpio.waveTxBusy()) {
            sendWave()
            return
        }
    
        if (pigpio.waveTxAt() == lastId) {
            sendWave()
        }
    } catch(e) {
        // Ignore this error
        if (e.message == 'pigpio error 9999 in gpioWaveTxAt') {
            console.log(e.message)
            return
        }

        console.error('Consume error')
        console.log(e.message)
        console.log(e)

        sendMessage('alert', e.toString())

        throw e
    }
}

setInterval(consume, 10)

const empty = { gpioOn: 0, gpioOff: 0, usDelay: 0 }
const breakable = { gpioOn: 0, gpioOff: 0, usDelay: 0 }
function* emptyGenerator() {
    while (true) {
        yield empty
    }
}

let generator = emptyGenerator()

function setGenerator(newGenerator) {
    generator = newGenerator
}

function getGenerator() {
    return generator
}

let sendMessage = () => {}

function setMessager(msgr) {
    sendMessage = msgr
}

// Potentially leaking some memory => buy some more ;-)
function clearGenerator() {
    lastId = null
    deleteId = null
    generator = emptyGenerator()
}

module.exports = {
    setGenerator,
    empty,
    breakable,
    setMessager,
    clearGenerator,
    getGenerator
}