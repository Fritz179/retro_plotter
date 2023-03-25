const pigpio = require('pigpio')

const targetDelay = 1000 * 100

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
        if (data.length > 2000) break
    }

    pigpio.waveAddGeneric(data);

    
    const waveId = pigpio.waveCreate();
    console.log(`Created wave: ${waveId}, length: ${data.length}, time: ${time}`)

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

        throw e
    }
}

setInterval(consume, 10)

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

module.exports = {
    setGenerator,
    empty
}