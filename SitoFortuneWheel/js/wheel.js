function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setup() {
    createCanvas(800, 800)
    textSize(16)

    button = createButton('spin <i class="fa-solid fa-arrows-rotate"></i>')
    button.mousePressed(spin)
}

var gimmics = data
var n = gimmics.length
var spinAngle = 0
var spinVelocity = 0
var button
var spinning = false

function spin() {
    a = 0
    spinVelocity = 20 + Math.random() * 5
    spinning = true
}

function mod(x, y) {
    return x - y * Math.floor(x / y)
}

function updateAngle() {
    if (!spinning) {
        return
    }
    spinVelocity -= 0.051
    if (spinVelocity < 0) {
        spinVelocity = 0
    }
    spinAngle += spinVelocity * 1 / 60
    if (spinVelocity == 0) {
        let angle = mod(Math.PI / n - Math.PI / 2 + 2 * Math.PI - spinAngle, 2 * Math.PI)
        let idx = Math.floor(angle / (2 * Math.PI / n))
        console.log(gimmics[idx], idx)
        spinning = false
        result = idx
        showResult()
    }
}

var wheelSize = 500

function drawWheel() {
    push()
    colorMode(HSB)
    translate(width / 2, height / 2)
    rotate(spinAngle)
    let angle = 2 * Math.PI / n
    for (let i = 0; i < n; i++) {
        fill(i * 255 / n, 204, 100)
        arc(0, 0, wheelSize, wheelSize, -angle / 2, angle / 2)
        fill(i * 255 / n + 128, 255, 0)
        textSize(18)
        txtWidth = textWidth(gimmics[i])
        fontSize = 18 * (wheelSize * 0.4 - 40) / txtWidth
        textSize(fontSize)
        text(gimmics[i], 40, fontSize * 0.3)
        rotate(angle)
    }
    colorMode(RGB)
    pop()
}

function showResult() {
    let f = () => {
        if (a <= 200 && !spinning) {
            a += 10
            setTimeout(f, 100)
        }
    }
    f()
}

var a = 0
var result = 0
function displayResult() {
    fill(255, 255, 255, a)
    rect(0, 0, width, height)
    textSize(70)
    fill(0, 0, 0, a)
    text(gimmics[result], width / 2 - textWidth(gimmics[result]) / 2, height / 2)
}

function draw() {
    drawWheel()
    updateAngle()
    displayResult()
}