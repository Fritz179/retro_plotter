const pigpio = require('pigpio')

class Chain {
    constructor() {
        this.chain = []
        this.waves = []
    }

    addWave(waveId) {
        this.chain.push(waveId)
        this.waves.push(waveId)
    }

    addPulses(wave) {
        pigpio.waveAddGeneric(wave);
        const id = pigpio.waveCreate();
        this.addWave(id)
    }

    repeatStart() {
        this.chain.push(255, 0)
    }
    
    repeatFor(n) {
        const x = n % 256
        const y = (n - x) / 256
    
        if (y > 255) error('To much repeat')
    
        this.chain.push(255, 1, x, y)
    }
    
    repeatForever() {
        this.chain.push(255, 3)
    }

    start() {
        pigpio.waveChain(this.chain);
    }

    stop() {
        pigpio.waveTxStop()
    }

    isBusy() {
        return pigpio.waveTxBusy()
    }
    
    delete() {
        this.waves.forEach(id => {
            pigpio.waveDelete(id)
        })
        this.waves = []
        this.chain = []
    }
}

module.exports = Chain