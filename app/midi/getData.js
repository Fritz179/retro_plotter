const fs = require('fs')
const parseMidi = require('./midi.js')

const map = {}
function getNote(n) {
    if (!map[n]) {
        map[n] = {
            note: 180 - n * 2,
            strength: 8
        }
    }

    return map[n]
}

function getSingle2(data) {
    const out = []
    const active = []
    let time = 0

    data.forEach(e => {
        if (e.type == 'on') {
            active[e.note] = e.velocity
        } else {
            delete active[e.note]
        }

        let record = 0
        let holder = 0
        active.forEach((speed, note) => {
            if (speed > record) {
                record = speed
                holder = note
            }
        })

        time += e.time

        if (!out.length || out[out.length - 1].note != holder) {
            if (time == 0 && out.length) {
                const last = out.pop()
                time += last.time
            }

            out.push({note: holder, time})
            time = 0
        }
    })

    return out
}

function getSingle(data) {
    console.log(data.length)

    const out = []
    const active = []

    const readers = data.map(data => ({
        data,
        time: 0
    }))

    const sampleRate = 10000
    for (let curr = 0; ; curr += sampleRate) {
        if (!readers.length) break

        for (let i = readers.length - 1; i >= 0; i--) {
            const reader = readers[i]

            while (reader.time < curr || (reader.data.length && reader.data[0].time == 0)) {
                if (!reader.data.length) break
    
                const next = reader.data.shift()
                reader.time += reader.data.length ? reader.data[0].time : next.time
    
                if (next.type == 'on') {
                    active[next.note] = next.velocity
                } else {
                    delete active[next.note]
                }
            }

            if (!reader.data.length) {
                readers.splice(i, 1)
            }
        }

        // let record = 0
        // let holder = 0
        let actives = []
        active.forEach((speed, note) => {
            actives.push({note: getNote(note).note, speed, strength: getNote(note).strength})
        })

        actives.sort((a, b) => b.speed - a.speed)

        out.push({
            notes: actives, 
            time: sampleRate
        })
    }

    return out
}

function getData2(file, multiplier, trackId) {
    // Read MIDI file into a buffer
    const path = './app/midi/tracks/' + file
    const input = fs.readFileSync(path + '.mid');

    // Convert buffer to midi object
    const parsed = parseMidi(input);

    // multiplier = parsed.header.ticksPerBeat / 2

    const data = parsed.tracks[trackId || Math.min(parsed.tracks.length - 1, 1)]
        .filter(e => e.type == 'noteOn' || e.type == 'noteOff')
        .map(e => ({type: e.type == 'noteOn' ? 'on' : 'off', time: e.deltaTime, note: e.noteNumber, velocity: e.velocity}))

    const out = getSingle2(data)

    const ret = out.map((e, i) => {
        const next = out[i + 1] ? out[i + 1].time : 0
        
        const time = next * multiplier
        if (e.note) {
            return `F ${getNote(e.note)}, ${time}, 8`
        } else {
            return `F 0, ${time}, 0`
        }
    })

    const track = ret.join('\n')

    // because paramenters might have changed
    if (!fs.existsSync(path + '.txt') || true) {
        fs.writeFileSync(path + '.txt', track)
        console.log(`Saved: ${path}.txt`)
    }

    return track
}

function getData(file, multiplier) {
    const path = './app/midi/tracks/' + file

    // if (fs.existsSync(path + '.txt')) {
    //     const input = fs.readFileSync(path + '.txt', 'utf-8');
    //     console.log(JSON.parse(input))
    //     return JSON.parse(input)
    // }

    // Read MIDI file into a buffer
    const input = fs.readFileSync(path + '.mid');

    // Convert buffer to midi object
    const parsed = parseMidi(input);

    // multiplier = parsed.header.ticksPerBeat / 2

    const data = parsed.tracks
        .map(track => track
            .filter(e => e.type == 'noteOn' || e.type == 'noteOff')
            .map(e => ({type: e.type == 'noteOn' ? 'on' : 'off', time: e.deltaTime * multiplier, note: e.noteNumber, velocity: e.velocity}))
        ).filter(track => track.length > 10)
        
    const out = getSingle(data)

    // because paramenters might have changed
    if (!fs.existsSync(path + '.txt') || true) {
    
        const track = JSON.stringify(out)
        
        fs.writeFileSync(path + '.txt', track)
        console.log(`Saved: ${path}.txt`)
    }

    return out
}

const magic = 1024 * 560


const doom = []
for (let i = 1; i <= 9; i++) {
    doom[i] = getData('doom/level' + i, magic / 560 * 2)
}

module.exports = {
    mario: getData('smb', 1024, 0),
    wii: getData('wii', 1024 * 560 / 1024, 1),
    // play: getData('eiffel', magic / 120),
    // play: getData('uni', 800, 23),
    // play: getData('sim', magic / 240), // 10
    // play: getData('doom', magic / 480)
    doom
    // play: getData('test', magic / 1024),

}

// console.log(map)