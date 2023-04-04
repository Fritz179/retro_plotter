const socket = io();
const mm = 80
const maxWidth = 210 * mm
const maxHeight = 197 * mm

const marginsInput = document.querySelector('#margins')
const textSizingInput = document.querySelector('#textSizing')
const position = document.querySelector('#position')
socket.on('position', data => {
    const d = JSON.parse(data)

    position.innerHTML = `X: ${Math.round(d.x).toString().padEnd(5)}, Y: ${Math.round(d.y).toString().padEnd(5)}`
})

socket.on('alert', info => {
    alert(info)
})

const chose = document.querySelector('#chose')
chose.addEventListener('input', choiceHandler)

const imageChoice = document.querySelector('#imageChoice')
const textChoice = document.querySelector('#textChoice')
const gcodeChoice = document.querySelector('#gcodeChoice')
const realtimeChoice = document.querySelector('#realtimeChoice')
const soundChoiche = document.querySelector('#soundChoiche')
const yChoice = document.querySelector('#yChoice')
const xyChoice = document.querySelector('#xyChoice')
const equationChoice = document.querySelector('#equationChoice')
const codeAlgChoice = document.querySelector('#codeAlgChoice')
const graphParameters = document.querySelector('#graphParameters')
let initialized = false

function choiceHandler() {
    imageChoice.style.display = 'none'
    textChoice.style.display = 'none'
    gcodeChoice.style.display = 'none'
    realtimeChoice.style.display = 'none'
    soundChoiche.style.display = 'none'
    yChoice.style.display = 'none'
    xyChoice.style.display = 'none'
    equationChoice.style.display = 'none'
    codeAlgChoice.style.display = 'none'
    graphParameters.style.display = 'none'

    switch (chose.value) {
        case 'imageChoice': imageChoice.style.display = 'block'; codeAlgChoice.style.display = 'block'; break;
        case 'textChoice': textChoice.style.display = 'block'; break;
        case 'gcodeChoice': gcodeChoice.style.display = 'block'; break;
        case 'realtimeChoice': realtimeChoice.style.display = 'block'; break;
        case 'soundChoiche': soundChoiche.style.display = 'block'; break;
        case 'yChoice': yChoice.style.display = 'block'; graphParameters.style.display = 'block'; break;
        case 'xyChoice': xyChoice.style.display = 'block'; graphParameters.style.display = 'block'; break;
        case 'equationChoice': equationChoice.style.display = 'block'; codeAlgChoice.style.display = 'block'; graphParameters.style.display = 'block'; break;
    
        default:
            throw `Invalid choice: ${chose.value}`
    }

    setSound(chose.value == 'soundChoiche')
    setRealtime(chose.value == 'realtimeChoice')
}

const usDelay = document.getElementById('delay')
usDelay.addEventListener('input', updateExec)

choiceHandler()

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
    ctx = canvas.getContext('2d', { willReadFrequently: true })
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

        const h = canvas.width / ir
        const y = (canvas.height - h) / 2  

        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h)
    }
}

function drawImageCover(image, canvas, ctx) {
    const ir = image.width / image.height
    const dr = canvas.width / canvas.height

    if (ir > dr) {
        // source is wider

        const w = canvas.height * ir
        const x = (canvas.width - w) / 2

        const h = canvas.height
        const y = 0 

        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h)
    } else {
        // source is taller

        const w = canvas.width
        const x = 0

        const h = canvas.width / ir
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
    drawImageContain(image, imageCanvas, imageCtx)

    updateGray()
}


function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, l ];
}


function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, v ];
}

const grayAlg = document.querySelector('#grayAlg')
grayAlg.addEventListener('input', updateGray)

function updateGray() {
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

    const src = grayCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height)
    const data = src.data

    const grayFunction = createFunction('r', 'g', 'b', 'hsv_h', 'hsv_s', 'hsv_v', 'hsl_h', 'hsl_s', 'hsl_l', `return ${grayAlg.value}`)
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i + 0]
        const g = data[i + 1]
        const b = data[i + 2]

        // const gray = Math.round((r + g + b) / 3)
        const [hsv_h, hsv_s, hsv_v] = rgbToHsv(r, g, b)
        const [hsl_h, hsl_s, hsl_l] = rgbToHsl(r, g, b)

        const gray = grayFunction(r / 255, g / 255, b / 255, hsv_h, hsv_s, hsv_v, hsl_h, hsl_s, hsl_l) * 255

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
const gInfo = document.querySelector('#g-info')
let currCode, sendableCode

function generateCode() {
    const src = dotCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height)
    const data = [...src.data.filter((v, i) => i % 4 == 0)]
    src.data.forEach((v, i) => {
        // all the transparet pixels should be white
        if (i % 4 == 3 && v == 0) {
            data[(i - 3) / 4] = 255
        }
    })
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
    let code = 'P 1\n'

    for (point of points) {
        code += `M ${point[0] * mm}, ${point[1] * mm}\n`
        code += 'P 0\n'
        code += 'P 1\n'
    }

    return code
}

function generateLinear(points) {
    let code = ['P 1']
    
    let prevX
    let wasSame = false

    for (point of points) {

        if (prevX + 1 == point[0]) {
            if (wasSame) code.pop()
            wasSame = true

            code.push(`M ${point[0] * mm}, ${point[1] * mm}`)

        } else {
            wasSame = false

            code.push('P 1')
            code.push(`M ${point[0] * mm}, ${point[1] * mm}`)
            code.push('P 0')
        }

        prevX = point[0]
    }

    return code.join('\n')
}

function generateFritz(points) {
    let code = 'P 1\n'

    return generateLinear(points)

    // return code
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
    generateCode()
}

codeAlgChange()

function updateExec() {
    if (!currCode) return

    const delay = Number(usDelay.value)
    if (typeof delay != 'number' || delay == NaN) delay = 500
    sendableCode = ['P 1', `D ${delay}`]

    execCtx.clearRect(0, 0, execCanvas.width, execCanvas.height)
    const len = currCode.split('\n').length
    gInfo.innerHTML = `Number of commands: ${len}\nCode lengh: NOT_IMPLEMENTED`
    g.innerHTML = currCode

    const data = []
    const width = execCanvas.width
    const height = execCanvas.height

    for (let y = 0; y < execCanvas.height; y++) {
        for (let x = 0; x < width; x++) {
            data[y * width + x] = 255   
        }
    }

    let pos = [0, 0]
    let pointing = false

    const margins = marginsInput.value.split(',').map(n => Number(n) * mm);

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
                for (let x = Math.floor(x1 / mm); x <= Math.ceil(x2 / mm); x++) {
                    y = Math.round((y2 - dy * (x2 - x * mm) / dx) / mm)
                    data[y * width + x] = 0
                }
            } else {

                if (y1 > y2) {
                    [x1, x2] = [x2, x1];
                    [y1, y2] = [y2, y1]
                }

                const dx = x2 - x1
                const dy = y2 - y1

                if (dy != 0) {
                    // moves more on the y axis
                    for (let y = Math.floor(y1 / mm); y <= Math.ceil(y2 / 80); y++) {
                        x = Math.round((x2 - dx * (y2 - y * mm) / dy) / mm)
                        data[y * width + x] = 0
                    }
                }                
            }

            pos = params
        }

        function map(n, min1, max1, min2, max2) {
            return (n - min1) / (max1 - min1) * (max2 - min2) + min2
        }

        // Top left = 150, 860
        // Bottom right = 16700, 24350  

        function mapX(x) {
            // return map(x, 0, width * mm, margins[3] + 150, width * mm - margins[1])
            return map(x, 0, width * mm, margins[3] + 150, 16700 - margins[1])
        }

        function mapY(y) {
            // return map(y, 0, height * mm, margins[0] + 860, height * mm - margins[2])
            return map(y, 0, height * mm, margins[0] + 860, 24350 - margins[2])
        }
        
        // TODO: Should break long lines into smaller ones for clearing generator
        function moveTo() {
            assert(2)

            const x = mapX(params[0])
            const y = mapY(params[1])

            sendableCode.push(`M ${Math.round(x)}, ${Math.round(y)}`)
            if (pointing) {
                lineTo()
            } else {
                pos = params
            }
        }

        function pen() {
            assert(1)
            pointing = params[0] == 0
            if (pointing) data[pos[1] * width + pos[0]] = 0

            sendableCode.push(`P ${params[0]}`)
        }

        function delay() {
            assert(1)

            sendableCode.push(`D ${params[0]}`)
        }

        function frequency() {
            assert(3)

            sendableCode.push(`F ${params[0]}, ${params[1]}, ${params[2]}`)
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
            case 'P': pen(); break;
            case 'M': moveTo(); break;
            case 'D': delay(); break;
            case 'F': frequency(); break;
            // case 'C': cubicBaiser(); break;
            // case 'Q': quadraticBaiser(); break;
        
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

    sendableCode = sendableCode.join('\n')
}

function drawCharAt(char, x, y, scale = 1) {
    const data = font[char]

    if (!data) {
        console.error(`Invalid character: ${char} = ${char.charCodeAt(0)}`)
        return
    }

    const s = n => n * scale * mm
    
    data.lines.forEach(line => {
        code.push(`M ${Math.round(s(line[0][0]) + x)}, ${Math.round(y - s(line[0][1]))}`)
        code.push(`P 0`)

        for (let i = 1; i < line.length; i++) {
            const [xx, yy] = line[i]
            code.push(`M ${Math.round(s(xx) + x)}, ${Math.round(y - s(yy))}`)
        }

        code.push(`P 1`)
    })
}

// let str = ''

// for (let i = 32; i <= 126; i++) {
//     str += String.fromCharCode(i)
// }

// console.log(str)

//  !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~

// const textHeight = 32 * mm 
// Replaced by textSizingH

function drawText(text) {
    const textSizing = textSizingInput.value.split(',').map(n => Number(n))
    const textSizingX = textSizing[0] * mm
    const textSizingY = textSizing[1] * mm
    const textSizingW = textSizing[2] * mm
    const textSizingS = textSizing[3]
    const textSizingH = textSizing[4] * mm

    code = ['P 1']
    let dx = textSizingX
    let h = textSizingH * textSizingS + textSizingY

    text.split('').forEach(char => {
        if (char == '\n') {
            dx = textSizingX
            h += textSizingH * textSizingS
            return
        }

        const data = font[char]

        if (!data) {
            console.error(`Invalid character: ${char} = ${char.charCodeAt(0)}`)
            return
        }

        if (dx + data.spacing * mm > textSizingW) {
            dx = textSizingX
            h += textSizingH * textSizingS
        }
        
        drawCharAt(char, dx, h, textSizingS)

        dx += data.spacing * mm * textSizingS
    })

    currCode = code.join('\n')
    updateExec()
}

const text = document.querySelector('#text')
text.addEventListener('input', textListener)
textSizingInput.addEventListener('input', textListener)

function textListener() {
    drawText(text.value)
}

const gcodeinput = document.querySelector('#gcode')

gcodeinput.addEventListener('input', () => {
    console.log(gcodeinput.value)
    try {
        currCode = gcodeinput.value
        updateExec()
    } catch(e) {
        console.error(e)
        drawText(e.toString())
    }
})

const gcodeSend = document.querySelector('#gcodeSend')
gcodeSend.onclick = () => gcodeListener()
function gcodeListener(code) {
    if (code) sendableCode = code

    if (!sendableCode) {
        alert('No sendable code')
        return
    }

    console.log('Sending code', sendableCode)

    socket.emit('draw', sendableCode)
}

const manualUp = document.querySelector('#manual-penup')
const manualDown = document.querySelector('#manual-pendown')
const manualPaper = document.querySelector('#manual-paper')
const manualRecalibrate = document.querySelector('#manual-calibrate')

manualUp.onclick = () => gcodeListener('P 1')
manualDown.onclick = () => gcodeListener('P 0')
manualPaper.onclick = () => gcodeListener('P 1\nD 500\nM 8000, 20')
manualRecalibrate.onclick = () => socket.emit('recalibrate')

function setRealtime(active) {
    if (!initialized) {
        initialized = true
        return
    }

    if (active) {
        execCanvas.addEventListener('mousemove', realTimeHandlerMouse)
        window.addEventListener('mousedown', realTimeHandlerClick)
        window.addEventListener('mouseup', realTimeHandlerClickUp)
    } else {
        window.removeEventListener('mouseup', realTimeHandlerClickUp)
        window.removeEventListener('mousedown', realTimeHandlerClick)
        execCanvas.removeEventListener('mousemove', realTimeHandlerMouse)
    }
}

function realTimeHandlerMouse(e) {
    let x = (e.x - execCanvas.offsetLeft) / execCanvas.scrollWidth
    let y = (e.y - execCanvas.offsetTop) / execCanvas.scrollHeight

    function map(n, min1, max1, min2, max2) {
        return (n - min1) / (max1 - min1) * (max2 - min2) + min2
    }

    // Top left = 150, 860
    // Bottom right = 16700, 24350  
    const width = execCanvas.width
    const margins = marginsInput.value.split(',').map(n => Number(n) * mm);
    const height = execCanvas.height

    function mapX(x) {
        return map(x, 0, 1, margins[3] + 150, 16700 - margins[1])
    }

    function mapY(y) {
        return map(y, 0, 1, margins[0] + 860, 24350 - margins[2])
    }

    const delay = Number(usDelay.value)
    if (typeof delay != 'number' || delay == NaN) delay = 500

    gcodeListener(`D ${delay}\nM ${Math.round(mapX(x))}, ${Math.round(mapY(y))}`)
}

function realTimeHandlerClick(e) {
    gcodeListener('P 0')
}

function realTimeHandlerClickUp(e) {
    gcodeListener('P 1')
}

let soundActive = false
function setSound(value) {
    if (!initialized) return
    soundActive = value
}

const paramA = document.querySelector('#paramA')
const paramB = document.querySelector('#paramB')
const paramALabel = document.querySelector('#paramALabel')
const paramBLabel = document.querySelector('#paramBLabel')
const activeSound = document.querySelector('#activeSound')
function playSound() {
    if (!soundActive) return

    const frequency = paramA.value
    const repeatOneDirection = paramB.value
    const times = Math.max(Math.round(100000 / (frequency * repeatOneDirection)), 10)

    // console.log(frequency * repeatOneDirection * times)
    paramALabel.innerHTML = 'Frequency: ' + frequency
    paramBLabel.innerHTML = 'Strength: ' + repeatOneDirection

    if (!activeSound.checked) return

    gcodeListener(`F ${frequency}, ${times}, ${repeatOneDirection}`)
}

setInterval(playSound, 10)

const funY = document.querySelector('#funY')
const funXY_X = document.querySelector('#funXY-X')
const funXY_Y = document.querySelector('#funXY-Y')
const funT = document.querySelector('#funT')
const funE = document.querySelector('#funE')

funY.addEventListener('input', updateFunctions)
funXY_X.addEventListener('input', updateFunctions)
funXY_Y.addEventListener('input', updateFunctions)
funT.addEventListener('input', updateFunctions)
funE.addEventListener('input', updateFunctions)

function updateFunctions() {
    try {
        calculateFunction()
    } catch (error) {
        console.error(error)
        drawText(error.toString())
    }
}



const epsilon = document.querySelector('#epsilon')
epsilon.addEventListener('input', updateFunctions)

const epsilonLabel = document.querySelector('#epsilonLabel')

function createFunction(...args) {
    const funBody = `${args.pop()}`

    const fun = new Function('noise', 'noiseSeed', ...args, funBody)

    return (...args) => {
        return fun(noise, noiseSeed, ...args)
    }
}

const centerXInput = document.querySelector('#centerX')
const centerYInput = document.querySelector('#centerY')
const graphScale = document.querySelector('#graphScale')

centerXInput.addEventListener('input', calculateFunction)
centerYInput.addEventListener('input', calculateFunction)
graphScale.addEventListener('input', calculateFunction)

function setGraph(x, y, w) {
    centerXInput.value = x
    centerYInput.value = y
    graphScale.value = w

    calculateFunction()
}

function calculateFunction() {
    const data = []

    execCtx.clearRect(0, 0, execCanvas.width, execCanvas.height)
    const width = execCanvas.width

    for (let y = 0; y < execCanvas.height; y++) {
        for (let x = 0; x < width; x++) {
            data[y * width + x] = 255   
        }
    }

    const w = grayCanvas.width
    const h = grayCanvas.height

    function isIn(x, y) {
        if (x < 0 || x > w) return false
        if (y < 0 || y > h) return false

        return true
    }

    function map(x1, x2, x3, x4, n) {
        const t = (n - x1) / (x2 - x1)
        const ret = t * (x4 - x3) + x3
        return Math.round(ret)
    }

    const code = ['P 1']
    let down = false

    function addPoint(x, y) {
        if (isIn(x, y)) {
            code.push(`M ${Math.round(x * mm)}, ${Math.round(y * mm)}`)

            if (!down) {
                code.push('P 0')
                down = true
            }
        } else {
            if (down) {
                code.push('P 1')
                down = false
            }
        }
    }

    // update data    
    const centerX = Number(centerXInput.value)
    const centerY = Number(centerYInput.value)
    const scale = Number(graphScale.value)

    if (isNaN(centerX) || isNaN(centerY) || isNaN(scale)) {
        throw `Invalid graph parameters`
    }

    const resolution = 1 / 100

    const startX = centerX - scale
    const endX = centerX + scale

    const yLen = h / w * (endX - startX)

    const startY = centerY - yLen / 2
    const endY = centerY + yLen / 2

    const minWH = w < h ? w : h

    // draw the x axis
    const yPlane = map(endY, startY, 0, h, 0)
    for (let x = 0; x < width; x++) {
        addPoint(x, yPlane)
        if (isIn(x, yPlane)) {
            data[yPlane * width + x] = 0
        }
    }
    code.push('P 1')
    down = false

    // draw the y axis
    const xPlane = map(startX, endX, 0, w, 0)

    for (let y = 0; y < h; y++) {
        addPoint(xPlane, y)
        if (isIn(xPlane, y)) {
            data[y * width + xPlane] = 0
        }
    }
    code.push('P 1')
    down = false

    // draw the expression for y =
    function updateYFunction() {
        const newFun = createFunction(`x`, `return ${funY.value}`)

        for (let x = startX; x <= endX; x += resolution) {
            const y = newFun(x)
            
            const xx = map(startX, endX, 0, w, x)
            const yy = map(startY, endY, 0, h, y)

            addPoint(xx, h - yy)
        }

        currCode = code.join('\n')

        updateExec()
    }

    // draw the expression for y = and x =
    function updateXYFunction() {
        const newXFun = createFunction(`t`, `return ${funXY_X.value}`)
        const newYFun = createFunction(`t`, `return ${funXY_Y.value}`)

        for (let t = 0; t <= funT.value; t += resolution) {
            const y = newYFun(t)
            const x = newXFun(t)
            
            const xx = map(startX, endX, 0, w, x)
            const yy = map(startY, endY, 0, h, y)

            addPoint(xx, h - yy)
        }

        currCode = code.join('\n')

        updateExec()
    }

    // draw the queation with x & y
    function updateEFunction() {
        epsilonLabel.innerHTML = `Chose and epsilon: ${epsilon.value.toString().padEnd(4, '0')}`

        let funBody = funE.value
        
        if (funBody.includes('==')) {
            const [lhs, rhs] = funBody.split('==')
            funBody = `Math.abs((${lhs}) - (${rhs})) < ${epsilon.value}`
        }


        const newFun = createFunction(`x`, 'y', `return ${funBody}`)

        for (let x = startX; x <= endX; x += 1 / 16) {
            for (let y = Math.floor(startY); y <= endY; y += 1 / 32) {
                const satisfiesEquation = newFun(x, y)
                
                const xx = map(startX, endX, 0, w, x)
                const yy = h - map(startY, endY, 0, h, y)
    
                if (satisfiesEquation && isIn(xx, yy)) {
                    data[yy * width + xx] = 0
                }
            }
        }

        // put memory back into dotCtx to generate code
        const src = dotCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height)

        for (let i = 0; i < src.data.length; i++) {
            src.data[i * 4 + 0] = data[i]
            src.data[i * 4 + 1] = data[i]
            src.data[i * 4 + 2] = data[i]
            src.data[i * 4 + 3] = 255
        }

        dotCtx.putImageData(src, 0, 0)

        generateCode()
    }

    if (chose.value == 'xyChoice') {
        updateXYFunction()
    } else if (chose.value == 'yChoice') {
        updateYFunction()
    } else  if (chose.value == 'equationChoice') {
        updateEFunction()
    } else {
        console.error('El giüst?')
    }
}

const defaultText = document.querySelector('#defaultText')
const textTable = {
    all: [` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`, '10,10,200,0.9,32'],
    lorem: [`Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore voluptas sapiente sit expedita debitis quisquam, odio, quaerat consequatur dicta iure laborum consequuntur quas aut eaque facere. Pariatur quam veniam quidem!`, '10,10,200,0.5,32'],
    dante: [`Nel mezzo del cammin di nostra vita
mi ritrovai per una selva oscura,
che la diritta via era smarrita.

Ahi quanto a dir qual era e cosa dura,
esta selva selvaggia e aspra e forte,
che nel pensier rinova la paura!

Tant'e amara che poco e piu morte;
ma per trattar del ben ch'i' vi trovai,
diro de l'altre cose ch'i' v'ho scorte.

Io non so ben ridir com'i' v'intrai,
tant'era pien di sonno a quel punto
che la verace via abbandonai.`, '10,10,200,0.35,32'],
    faust: [`Faust.
Misshor' mich nicht, du holdes Angesicht!
Wer darf ihn nennen?
Und wer bekennen:
Ich glaub' ihn.
Wer empfinden?
Und sich unterwinden
Zu sagen: ich glaub' ihn nicht.
Der Allumfasser,
Der Allerhalter,
Fasst und erhalt er nicht
Dich, mich, sich selbst?
Wolbt sich der Himmel nicht dadroben?
Liegt die Erde nicht hierunten fest?
Und steigen freundlich blickend
Ewige Sterne nicht herauf?
Schau' ich nicht Aug' in Auge dir,
Und drangt nicht alles
Nach Haupt und Herzen dir,
Und webt in ewigem Geheimniss
Unsichtbar sichtbar neben dir?
Erfull' davon dein Herz, so gross es ist,
Und wenn du ganz in dem Gefuhle selig bist,
Nenn' es dann wie du willst,
Nenn's Gluck! Herz! Liebe! Gott!
Ich habe keinen Nahmen
Dafur! Gefuhl ist alles;
Name ist Schall und Rauch,
Umnebelnd Himmelsgluth.

Margarete.
Das ist alles recht schon und gut;
Ungefahr sagt das der Pfarrer auch,
Nur mit ein Bischen andern Worten.

Faust.
Es sagen's aller Orten
Alle Herzen unter dem himmlischen Tage,
Jedes in seiner Sprache;
Warum nicht ich in der meinen?

Margarete.
Wenn man's so hort, mocht's leidlich scheinen,
Steht aber doch immer schief darum;
Denn du hast kein Christenthum.

Faust.
Lieb's Kind!`, '10,10,200,0.28,32']
}

defaultText.addEventListener('change', () => {
    const value = textTable[defaultText.value]
    text.value = value[0]
    textSizingInput.value = value[1]
    drawText(value[0])
})

drawText(textTable.all[0])


// Top left = 150, 860
// Bottom right = 16700, 24350

/*

Faust.
Misshor' mich nicht, du holdes Angesicht!
Wer darf ihn nennen?
Und wer bekennen:
Ich glaub' ihn.
Wer empfinden?
Und sich unterwinden
Zu sagen: ich glaub' ihn nicht.
Der Allumfasser,
Der Allerhalter,
Fasst und erhalt er nicht
Dich, mich, sich selbst?
Wolbt ſich der Himmel nicht dadroben?
Liegt die Erde nicht hierunten feſt?
Und ſteigen freundlich blickend
Ewige Sterne nicht herauf?
Schau' ich nicht Aug' in Auge dir,
Und drangt nicht alles
Nach Haupt und Herzen dir,
Und webt in ewigem Geheimniss
Unſichtbar ſichtbar neben dir?
Erfull' davon dein Herz, ſo gross es iſt,

///////////////////////////////////////

Und wenn du ganz in dem Gefuhle selig bist,
Nenn' es dann wie du willst,
Nenn's Gluck! Herz! Liebe! Gott!
Ich habe keinen Nahmen
Dafur! Gefuhl ist alles;
Name ist Schall und Rauch,
Umnebelnd Himmelsgluth.

Margarete.
Das ist alles recht schon und gut;
Ungefahr sagt das der Pfarrer auch,
Nur mit ein Bischen andern Worten.
Faust.

Es sagen's aller Orten
Alle Herzen unter dem himmlischen Tage,
Jedes in seiner Sprache;
Warum nicht ich in der meinen?
Margarete.

Wenn man's so hort, mocht's leidlich scheinen,
Steht aber doch immer schief darum;
Denn du hast kein Christenthum.

Faust.
Lieb's Kind!

10,10,200,0.28,32


*/