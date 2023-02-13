const input = document.querySelector('#imageInput');
const scaleSlider = document.querySelector('#scaleSlider');
const scaleLabel = document.querySelector('#scaleLabel');

scaleSlider.addEventListener('input', updateScale)

function updateScale() {
    scaleLabel.innerHTML = 'Choose a scaling: ' + scaleSlider.value
    document.documentElement.style.setProperty('--scale', scaleSlider.value);
}

updateScale()

const dotAlg = document.querySelector('#dotAlg')
dotAlg.addEventListener('change', updateDotAlg)

let currDotAlg = null
function updateDotAlg() {
    currDotAlg = dotAlg.value.toString()
    if (input.files.length) updateDot()
}

updateDotAlg()

const pxToMm = 1
const a4width = Math.floor(210 / pxToMm)
const a4height = Math.floor(297 / pxToMm)

const image = document.createElement('img');

function getCanvas(id) {
    const canvas = document.querySelector(id)
    canvas.width = a4width
    canvas.height = a4height
    ctx = canvas.getContext('2d')
    return [canvas, ctx]
}

const [imageCanvas, imageCtx] = getCanvas('#imageCanvas');
const [grayCanvas, grayCtx] = getCanvas('#grayCanvas');
const [dotCanvas, dotCtx] = getCanvas('#dotCanvas');
const [execCanvas, execCtx] = getCanvas('#execCanvas');


input.addEventListener('change', updateImage);
function updateImage() {
    const file = input.files[0]
    
    if (!file) return 

    image.src = URL.createObjectURL(file);
}

function drawImageFill(image, canvas, ctx) {
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)
}

function drawImageContain(image, canvas, ctx) {
    const ir = image.width / image.height
    const dr = canvas.width / canvas.height

    if (ir < dr) {
        // source is wider

        const w = canvas.width * ir
        const x = (canvas.width - w) / 2

        const h = canvas.height
        const y = 0 

        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h)
    } else {
        // source is taller

        const w = canvas.width
        const x = 0

        const h = canvas.height * ir
        const y = (canvas.height - h) / 2  

        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h)
    }
}

function drawImageCover(image, canvas, ctx) {
    const ir = image.width / image.height
    const dr = canvas.width / canvas.height

    if (ir > dr) {
        // source is wider

        const w = canvas.height / ir
        const x = (canvas.width - w) / 2

        const h = canvas.height
        const y = 0 

        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h)
    } else {
        // source is taller

        const w = canvas.width
        const x = 0

        const h = canvas.width * ir
        const y = (canvas.height - h) / 2  

        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h)
    }
}

function drawImageNone(image, canvas, ctx) {
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width, image.height)
}

const scaleAlg = document.querySelector('#scaleAlg')

scaleAlg.addEventListener('change', updateIamge)
image.addEventListener('load', updateIamge)
function updateIamge() {
    imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height)
    drawImageFill(image, imageCanvas, imageCtx)

    const currScaleAlg = scaleAlg.value

    grayCtx.clearRect(0, 0, grayCanvas.width, grayCanvas.height)
    switch (currScaleAlg) {
        case 'Fill': drawImageFill(image, grayCanvas, grayCtx); break;
        case 'Contain': drawImageContain(image, grayCanvas, grayCtx); break;
        case 'Cover': drawImageCover(image, grayCanvas, grayCtx); break;
        case 'None': drawImageNone(image, grayCanvas, grayCtx); break;
    
        default:
            throw 'Unkonwn alg'
    }

    

    updateGray()
}

function updateGray() {
    const src = grayCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height)
    const data = src.data
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i + 0]
        const g = data[i + 1]
        const b = data[i + 2]

        const gray = Math.round((r + g + b) / 3)

        data[i + 0] = gray
        data[i + 1] = gray
        data[i + 2] = gray
    }

    grayCtx.putImageData(src, 0, 0)

    updateDot()
}

function updateDot() {
    dotCtx.clearRect(0, 0, dotCtx.width, dotCtx.height)
    const src = grayCtx.getImageData(0, 0, grayCanvas.width, grayCanvas.height)
    const data = [...src.data.filter((v, i) => i % 4 == 0)]
    const w = grayCanvas.width
    const h = grayCanvas.height

    function isIn(x, y) {
        if (x < 0 || x > w) return false
        if (y < 0 || y > h) return false

        return true
    }

    function get(x, y) {
        if (!isIn(x, y)) return 255

        return data[x + y * w]
    }

    function add(x, y, value) {
        set(x, y, get(x, y) + value)
    }

    function set(x, y, value) {
        if (!isIn) return

        data[x + y * w] = value
    }

    switch (currDotAlg) {
        case 'Floyd-Steinberg': ditherFloyd(get, set, add, isIn); break;
        case 'Threshold': ditherThreshold(get, set, add, isIn); break;
        case 'Random': ditherRandom(get, set, add, isIn); break;
        case 'Threshold4': ditherThreshold4(get, set, add, isIn); break;
        case 'Ordered4': ditherOrdered4(get, set, add, isIn); break;
        case 'Ordered8': ditherOrdered4(get, set, add, isIn); break;
        case 'Ordered16': ditherOrdered4(get, set, add, isIn); break;
        case 'OrderedBlock4': ditherOrderedBlock4(get, set, add, isIn); break;
        case 'OrderedBlock8': ditherOrderedBlock4(get, set, add, isIn); break;
        case 'OrderedBlock16': ditherOrderedBlock4(get, set, add, isIn); break;
        case 'Jarvis': ditherJarvis(get, set, add, isIn); break;
        case '1D': dither1D(get, set, add, isIn); break
        case '2D': dither2D(get, set, add, isIn); break
        case 'Atkinson': ditherAtkinson(get, set, add, isIn); break
        case 'Fritz': ditherFritz(get, set, add, isIn); break
            
        default:
            throw `Invalid DotAlg: ${currDotAlg}`;
    }
    
    for (let i = 0; i < data.length; i++) {
        src.data[i * 4 + 0] = data[i]
        src.data[i * 4 + 1] = data[i]
        src.data[i * 4 + 2] = data[i]
    }

    dotCtx.putImageData(src, 0, 0)

    generateCode()
}

function ditherThreshold(get, set) {
    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)
        }
    }
}

function ditherRandom(get, set) {
    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > Math.random() * 255 ? 255 : 0

            set(x, y, newP)
        }
    }
}

const orderedData = {
    Ordered4: {
        matrix: [
            [0, 2],
            [3, 1]
        ],
        total: 4
    },
    Ordered8: {
        matrix: [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ],
        total: 16
    },
    Ordered16: {
        matrix: [
            [0, 32, 8, 40, 2, 34, 10, 42],
            [48, 16, 56, 24, 50, 18, 58, 26],
            [12, 44,  4, 36, 14, 46,  6, 38],
            [60, 28, 52, 20, 62, 30, 54, 22],
            [3, 35, 11, 43,  1, 33,  9, 41],
            [51, 19, 59, 27, 49, 17, 57, 25],
            [15, 47,  7, 39, 13, 45,  5, 37],
            [63, 31, 55, 23, 61, 29, 53, 21]
        ],
        total: 64
    },
    OrderedBlock4: {
        matrix: [
            [0, 2],
            [3, 1]
        ],
        total: 4
    },
    OrderedBlock8: {
        matrix: [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ],
        total: 16
    },
    OrderedBlock16: {
        matrix: [
            [0, 32, 8, 40, 2, 34, 10, 42],
            [48, 16, 56, 24, 50, 18, 58, 26],
            [12, 44,  4, 36, 14, 46,  6, 38],
            [60, 28, 52, 20, 62, 30, 54, 22],
            [3, 35, 11, 43,  1, 33,  9, 41],
            [51, 19, 59, 27, 49, 17, 57, 25],
            [15, 47,  7, 39, 13, 45,  5, 37],
            [63, 31, 55, 23, 61, 29, 53, 21]
        ],
        total: 64
    }
}

function ditherOrdered4(get,set, add, isIn) {
    const curr = orderedData[currDotAlg]

    for (let y = 0; y < imageCanvas.height; y += curr.matrix.length) {
        for (let x = 0; x < imageCanvas.width; x += curr.matrix[0].length) {
            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    const xx = x + xp
                    const yy = y + yp
                    if (!isIn(xx, yy)) continue

                    const value = get(xx, yy)
                    const test = 255 * (curr.matrix[yp][xp] + 0.5) / curr.total

                    set(xx, yy, value > test ? 255 : 0)
                }
            }
        }
    }
}

function ditherOrderedBlock4(get,set, add, isIn) {
    const curr = orderedData[currDotAlg]

    for (let y = 0; y < imageCanvas.height; y += curr.matrix.length) {
        for (let x = 0; x < imageCanvas.width; x += curr.matrix[0].length) {
            let totalValue = 0

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    const xx = x + xp
                    const yy = y + yp
                    if (!isIn(xx, yy)) continue

                    totalValue += get(xx, yy)
                }
            }

            totalValue /= curr.total

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    const xx = x + xp
                    const yy = y + yp
                    if (!isIn(xx, yy)) continue

                    const value = totalValue
                    const test = 255 * (curr.matrix[yp][xp] + 0.5) / curr.total

                    set(xx, yy, value > test ? 255 : 0)
                }
            }
        }
    }
}

function ditherThreshold4(get, set, add, isIn) {
    const curr = {
        matrix: [
            [0, 2],
            [3, 1]
        ],
        x: 0,
        y: 0,
        total: 4
    }


    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            let totalValue = 0

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    const xx = x + xp - curr.x
                    const yy = y + yp - curr.y
                    if (!isIn(xx, yy)) continue

                    const factor = curr.matrix[yp][xp]
                    totalValue += get(xx, yy) * factor
                }
            }

            const value = totalValue / curr.total
            set(x, y, value > 127 ? 255 : 0)
        }
    }
}

function dither1D(get, set, add, isIn) {
    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)

            const error = (oldP - newP)

            add(x + 1, y, error)
        }
    }
}

function dither2D(get, set, add, isIn) {
    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)

            const error = (oldP - newP) / 2

            add(x + 1, y, error)
            add(x, y + 1, error)
        }
    }
}

function ditherFloyd(get, set, add) {
    const curr = {
        matrix: [
            [0, 0, 7],
            [3, 5, 1]
        ],
        total: 16,
        x: 1,
        y: 0
    }

    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)

            const error = (oldP - newP) / curr.total

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    add(x + xp - curr.x, y + yp - curr.y, error * curr.matrix[yp][xp])
                }
            }
        }
    }
}

function ditherJarvis(get, set, add, isIn) {
    const curr = {
        matrix: [
            [0, 0, 0, 7, 5],
            [3, 5, 7, 5, 3],
            [1, 3 ,5, 3, 1]
        ],
        total: 48,
        x: 2,
        y: 0
    }

    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)

            const error = (oldP - newP) / curr.total

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    add(x + xp - curr.x, y + yp - curr.y, error * curr.matrix[yp][xp])
                }
            }
        }
    }
}

function ditherAtkinson(get, set, add, isIn) {
    const curr = {
        matrix: [
            [0, 0, 0, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0 ,1, 0, 0]
        ],
        total: 8,
        x: 2,
        y: 0
    }

    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)

            const error = (oldP - newP) / curr.total

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    add(x + xp - curr.x, y + yp - curr.y, error * curr.matrix[yp][xp])
                }
            }
        }
    }
}

function ditherFritz(get, set, add, isIn) {
    const curr = {
        matrix: [
            [0, 0, 0, 2, 1],
            [0, 1, 2, 2, 1],
            [0, 0 ,1, 1, 0]
        ],
        total: 12,
        x: 2,
        y: 0
    }

    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {
            const oldP = get(x, y)
            const newP = oldP > 127 ? 255 : 0

            set(x, y, newP)

            const error = (oldP - newP) / curr.total

            for (let yp = 0; yp < curr.matrix.length; yp++) {
                for (let xp = 0; xp < curr.matrix[0].length; xp++) {
                    add(x + xp - curr.x, y + yp - curr.y, error * curr.matrix[yp][xp])
                }
            }
        }
    }
}

// Lattice-Boltzmann Dithering

const g = document.querySelector('#g')
let currCode

function generateCode() {
    const src = dotCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height)
    const data = [...src.data.filter((v, i) => i % 4 == 0)]
    const w = imageCanvas.width
    const h = imageCanvas.height

    const points = []
    for (let i = 0; i < data.length; i++) {
        if (data[i]) continue // skip white

        const x = i % w 
        const y = (i - x) / w

        points.push([x, y])
    }

    switch (currCodeAlg) {
        case 'Basic': currCode = generateBasic(points); break;
        case 'Linear': currCode = generateLinear(points); break;
        case 'Fritz': currCode = generateFritz(points); break;
    
        default: throw `Invalid code alg ${currCodeAlg}`
    }

    updateExec()
}

function generateBasic(points) {
    let code = 'P 1\nM 0, 0\n'

    for (point of points) {
        code += `M ${point[0]}, ${point[1]}\n`
        code += 'P 0\n'
        code += 'P 1\n'
    }

    return code
}

function generateLinear(points) {
    let code = ['P 1', 'M 0, 0']
    
    let prevX
    let wasSame = false

    for (point of points) {

        if (prevX + 1 == point[0]) {
            if (wasSame) code.pop()
            wasSame = true

            code.push(`M ${point[0]}, ${point[1]}`)

        } else {
            wasSame = false

            code.push('P 1')
            code.push(`M ${point[0]}, ${point[1]}`)
            code.push('P 0')
        }

        prevX = point[0]
    }

    return code.join('\n')
}

function generateFritz(points) {
    let code = 'P 1\nM 0, 0\n'

    for (point of points) {
        code += `M ${point[0]}, ${point[1]}\n`
        code += 'P 0\n'
        code += 'P 1\n'
    }

    return code
}

let active = false
const showCode = document.querySelector('#showCode')
showCode.addEventListener('click', showCodePressed)

function showCodePressed() {
    showCode.innerHTML = active ? 'Hide Code' : 'Show Code'
    g.style.display = active ? 'block' : 'none'
    active = !active
}

showCodePressed()

const codeAlg = document.querySelector('#codeAlg')
codeAlg.addEventListener('change', codeAlgChange)

let currCodeAlg = null
function codeAlgChange() {
    currCodeAlg = codeAlg.value
    if (input.files.length) generateCode()
}

codeAlgChange()

function updateExec() {
    if (!currCode) return

    execCtx.clearRect(0, 0, execCanvas.width, execCanvas.height)
    const len = currCode.split('\n').length
    g.innerHTML = `Code lengh: ${len}\n\n${currCode}`

    const data = []
    const width = execCanvas.width

    for (let y = 0; y < execCanvas.height; y++) {
        for (let x = 0; x < width; x++) {
            data[y * width + x] = 255   
        }
    }

    let pos = [0, 0]
    let pointing = false

    currCode.split('\n').filter(l => l).forEach((code, index) => {
        let [type, ...params] = code.split(/,? +/)
        params = params.map(n => Number(n))

        function assert(count) {
            if (count != params.length) throw `Invalid code: ${code}, expected: ${count} params but got: ${params.length}`
        }

        function lineTo() {
            assert(2)
            let [x1, y1] = pos
            let [x2, y2] = params

            if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {

                if (x1 > x2) {
                    [x1, x2] = [x2, x1];
                    [y1, y2] = [y2, y1]
                }

                const dx = x2 - x1
                const dy = y2 - y1

                // moves more on the x axis
                for (let x = x1; x <= x2; x++) {
                    y = Math.round(y2 - dy * (x2 - x) / dx)
                    data[y * width + x] = 0
                }
            } else {

                if (y1 > y2) {
                    [x1, x2] = [x2, x1];
                    [y1, y2] = [y2, y1]
                }

                const dx = x2 - x1
                const dy = y2 - y1

                if (dy == 0) throw '0 Error'

                // moves more on the y axis
                for (let y = y1; y <= y2; y++) {
                    x = Math.round(x2 - dx * (y2 - y) / dy)
                    data[y * width + x] = 0
                }
            }

            pos = params
        }

        function moveTo() {
            assert(2)
            if (pointing) {
                lineTo()
            } else {
                pos = params
            }
        }

        function point() {
            assert(1)
            pointing = params[0] == 0
            if (pointing) data[pos[1] * width + pos[0]] = 0
        }

        function cubicBaiser() {
            throw 'Not implemented: cubicBaiser'
        }

        function quadraticBaiser() {
            assert(4)

            const [x1, y1] = pos 
            const [x2, y2, x3, y3] = params

            const resolution = 1000
            for (let i = 0; i < resolution; i++) {
                const t = i / resolution

                const xa = x1 * (1 - t) + x2 * t 
                const xb = x2 * (1 - t) + x3 * t 
                const x = xa * (1 - t) + xb * t  

                const ya = y1 * (1 - t) + y2 * t 
                const yb = y2 * (1 - t) + y3 * t 
                const y = ya * (1 - t) + yb * t 

                data[Math.round(y) * width + Math.round(x)] = 0
            }

            pos = [x3, y3]
        }

        switch (type) {
            case 'P': point(); break;
            case 'M': moveTo(); break;
            case 'C': cubicBaiser(); break;
            case 'Q': quadraticBaiser(); break;
        
            default:
                console.log(code, index)
                throw `Unknown svg type: ${type}, with params: ${params}`
        }
    })

    // put memory back to image
    const src = execCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height)

    for (let i = 0; i < src.data.length; i++) {
        src.data[i * 4 + 0] = data[i]
        src.data[i * 4 + 1] = data[i]
        src.data[i * 4 + 2] = data[i]
        src.data[i * 4 + 3] = 255
    }

    execCtx.putImageData(src, 0, 0)
}

function drawText(text) {
    code = ['M 0, 0', 'P 1']
    let dx = 0
    let h = 30

    text.split('').forEach(char => {
        const data = font[char]

        if (!data) {
            console.error(`Invalid character: ${char}`)
            return
        }
        
        data.lines.forEach(line => {
            code.push(`M ${line[0][0] + dx}, ${h - line[0][1]}`)
            code.push(`P 0`)

            for (let i = 1; i < line.length; i++) {
                const [x, y] = line[i]
                code.push(`M ${x + dx}, ${h - y}`)
            }

            code.push(`P 1`)
        })

        dx += data.spacing
    })

    currCode = code.join('\n')
    updateExec()
}

const text = document.querySelector('#text')
text.addEventListener('input', textListener)

function textListener() {
    drawText(text.value)
}

currCode = 'M 10 80\nQ 95 10 180 30'
updateExec()