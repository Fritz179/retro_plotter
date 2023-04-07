const assert = require('./assert.js')

// Perform syncronous calibration
const {calibrateSync, goUntilEndAndLog} = require('./calibrate.js')

// while (true) {
//     console.log('x axis')
//     goUntilEndAndLog(500,  1, 0)
//     goUntilEndAndLog(500, -1, 0)
// }

// goUntilEndAndLog(500, 0, -1)
// while (true) {
//     console.log('y axis')
//     goUntilEndAndLog(500, 0,  1)
//     goUntilEndAndLog(500, 0, -1)
// }

const {setGenerator, empty, setMessager: setGeneratorMessager, getGenerator} = require('./generator.js')

//////////////

const axis = require('./axis')

function* combineGenerators(...generators) {
    const gens = []

    for (let i = 0; i < generators.length; i++) {
        const gen = generators[i]
        curr = gen.next()

        // pesky bug :-)
        if (curr.done) continue

        gens.push({
            curr,
            gen,
        })
    }

    while (gens.length) {
        let record = Infinity
        let holder = -1

        // search for the record
        for (let i = 0; i < gens.length; i++) {
            const gen = gens[i]

            if (gen.curr.value.usDelay < record) {
                record = gen.curr.value.usDelay
                holder = i
            }
        }

        // update the others
        for (let i = 0; i < gens.length; i++) {
            if (i == holder) continue

            gens[i].curr.value.usDelay -= record
        }

        // send the record
        yield gens[holder].curr.value
        const next = gens[holder].gen.next()

        if (next.done) {
            gens.splice(holder, 1)
        } else {
            gens[holder].curr = next
        }
    }
}

function* moveByAxis(n, pin, delay = () => 1000) {
    for (let i = 0; i < n; i++) {
        let time = Math.round(delay(i + 1, n))

        if (time <= 0) throw 'Invalid time'

        const on  = { gpioOn: pin, gpioOff: 0, usDelay: time }
        const off = { gpioOn: 0, gpioOff: pin, usDelay: time }
        yield on
        yield off
    }
}

function* moveBy(x, y, delay = () => 1000) {
    assert(x >= 0 && y >= 0, `Invalid moveBy, x: ${x}, y: ${y}`)

    let xEvery = y / x
    let yEvery = x / y

    if (xEvery < 1) xEvery = 1
    if (yEvery < 1) yEvery = 1

    let len = Math.sqrt(x*x + y*y)

    const xGenerator = moveByAxis(x, axis.x.stepPin, (n, t) => delay(n / t * len, len) * xEvery)
    const yGenerator = moveByAxis(y, axis.y.stepPin, (n, t) => delay(n / t * len, len) * yEvery)

    yield* combineGenerators(xGenerator, yGenerator)
}

function* goTo(x, y, delay = () => 1000) {
    assert(axis.x.position != null && axis.y.position != null, 'Not calibrated!')

    let xd = x - axis.x.position
    let yd = y - axis.y.position

    let len = Math.sqrt(Math.abs(xd) * Math.abs(yd))

    // split long lines
    if (len > 100) {
        const times = Math.ceil(len / 100)
        xd = Math.ceil(xd / times)
        yd = Math.ceil(yd / times)
        actions.unshift(['M', x, y])

        console.log(len, times, xd, yd)
    }

    yield* axis.genPulseDirection(Math.sign(xd), Math.sign(yd))

    axis.x.position += xd
    axis.y.position += yd

    xd = Math.abs(xd)
    yd = Math.abs(yd)

    yield* moveBy(xd, yd, delay)
}

function* playSound(frequency, times, repeat) {
    const on  = { gpioOn: axis.x.stepPin, gpioOff: 0, usDelay: Math.round(frequency / 2) }
    const off = { gpioOn: 0, gpioOff: axis.x.stepPin, usDelay: Math.round(frequency / 2) }
    
    if (!frequency) {
        // yield { gpioOn: axis.x.stepPin, gpioOff: 0, usDelay: 1 }
        yield { gpioOn: 0, gpioOff: axis.x.stepPin, usDelay: Math.round(times) }
        return
    }

    times = Math.max(Math.round(times / (frequency * repeat)), 1)

    function* spam() {
        for (let i = 0; i < repeat; i++) {
            yield on
            yield off
        }
    }
    for (let i = 0; i < times / 2; i++) {
        yield axis.x.pulsePositiveDirection(() => 1)
        yield* spam()
        yield axis.x.pulseNegativeDirection(() => 1)
        yield* spam()
    }

    return
}

const midi = require('../midi/getData.js')

function* playSong() {
    const song = midi.play

    for (let i = 0; i < song.length; i++) {
        const piece = song[i]
        
        if (!piece.notes.length) {
            yield { gpioOn: 0, gpioOff: axis.x.stepPin, usDelay: Math.round(piece.time) }
            continue
        }

        // const times = Math.max(Math.round(piece.time / (frequency * piece.strength)), 1)

        const totalTime = Math.round(piece.time / piece.strength)
        let runningTime = 0

        let index = 0
        function* spam() {
            if (index >= piece.notes.length) index = 0
            const frequency = piece.notes[index++]
            const on  = { gpioOn: axis.x.stepPin, gpioOff: 0, usDelay: Math.round(frequency / 2) }
            const off = { gpioOn: 0, gpioOff: axis.x.stepPin, usDelay: Math.round(frequency / 2) }

            runningTime += frequency

            for (let time = 0; time < piece.strength; time++) {
                yield on
                yield off
            }
        }

        while (runningTime < totalTime) {
            yield axis.x.pulsePositiveDirection(() => 1)
            yield* spam()
            yield axis.x.pulseNegativeDirection(() => 1)
            yield* spam()
        }


    }
}

function* penUp() {
    const action = { gpioOn: 0, gpioOff: 19, usDelay: 1000 * 50 }
    yield action
}

function* penDown() {
    const action = { gpioOn: 19, gpioOff: 0, usDelay: 1000 * 50}
    yield action
}

/////////////

let actions = []

function parseValues(values) {
    return values.map(v => {
        const n = Number(v)
        assert(typeof n == 'number' && n != NaN, 'Invalid argument', values, v, n)

        return n
    })
}

let params = {
    delay: 1000
}

function* drawGnerator() {
    while (true) {
        const action = actions.shift()

        if (!action) {
            yield empty
            continue
        }

        const type = action.shift()
        const values = parseValues(action)

        function assertLen(n) {
            assert(values.length == n, `Invalid values for command type: ${type}, expected: ${n}, but got: ${values.length}`)
        }

        console.log(`parsing action: ${type}, values: ${values}`)

        function constAccDealy(baseDelay) {
            return (n, i) => {
                return baseDelay
            }
        }
        
        switch (type) {
            case 'M':
                assertLen(2)
                yield* goTo(...values, constAccDealy(params.delay))
                break;

            case 'm':
                assertLen(2)
                const x = axis.x.position + values[0]
                const y = axis.y.position + values[1]

                yield* goTo(x, y, constAccDealy(params.delay))
                break;

            case 'D':
                assertLen(1)
                params.delay = values[0]
                break;

            case 'X':
                assertLen(0)
                yield* playSong()
                break;

            case 'F':
                assertLen(3)
                yield* playSound(values[0], values[1], values[2])
                break;

            case 'P':
                assertLen(1)

                if (values[0]) {
                    yield* penUp()
                } else {
                    yield* penDown()
                }
                break;
        
            default:
                assert(false, `Unknown instruction: ${type}`)
                break;
        }
    }
}

function parseActions(text) {
    actions = text.split('\n')
        .map(t => t.trim())
        .filter(t => t.length)
        .map(action => action.split(/,?\s+/))
}

let generator = null
function draw(text) {

    // Set new generator if last was cleared
    if (getGenerator() != generator) {
        generator = drawGnerator()
        setGenerator(generator)
    }

    axis.setCallback(axis => {
        console.log(`Endschalter reached!! ${axis}`)
        assert(false, axis)
    })

    parseActions(text)
}

let sendMessage = () => {}

function setMessager(msger) {
    sendMessage = msger

    setGeneratorMessager(msger)
}

module.exports = {
    draw,
    setMessager,
}

// pulse => return a pulse
// set => sets
// gen => return a generator