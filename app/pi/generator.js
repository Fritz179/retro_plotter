const pigpio = require('pigpio')
const axis = require('./axis.js')

const targetDelay = 1000 * 1000

let lastId = null
let deleteId = null

function createWave() {
    const data = []
    let time = 0
    
    while (true) {
        let next = generator.next()
        
        data.push(next.value)
        time += next.value.usDelay

        if (time > targetDelay) break
        if (data.length > 10000) break
    }

    console.log(time, data.length)

    pigpio.waveClear();
    pigpio.waveAddGeneric(data);

    const position = {
        x: axis.x.position,
        y: axis.y.position
    }

    sendMessage('position', JSON.stringify(position))
    const waveId = pigpio.waveCreate();
    // console.log(`Created wave: ${waveId}, length: ${data.length}, time: ${time}`)

    return waveId
}

function sendWave() {
    const waveId = createWave()
    if (typeof waveId != 'number') return

    if (pigpio.waveTxBusy()) {
        pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_ONE_SHOT_SYNC)
    } else {
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
            pigpio.waveClear()
            sendWave()
            return
        }
    
        if (pigpio.waveTxAt() == lastId) {
            // sendWave()
        }
    } catch(e) {
        // Ignore this error
        if (e.message == 'pigpio error 9999 in gpioWaveTxAt' || e.message == 'pigpio error 9998 in gpioWaveTxAt') {
            // console.log(e.message)
            return
        }

        console.error('Consume error')
        console.log(e.message)
        console.log(e)

        sendMessage('alert', e.toString())

        throw e
    }
}

setInterval(consume)

const empty = { gpioOn: 0, gpioOff: 0, usDelay: targetDelay + 1 }
function* emptyGenerator() {
    while (true) {
        yield empty
    }
}

let generator = emptyGenerator()

function setGenerator(newGenerator) {
    generator = newGenerator
}

let sendMessage = () => {}

function setMessager(msgr) {
    sendMessage = msgr
}

module.exports = {
    setGenerator,
    empty,
    setMessager
}