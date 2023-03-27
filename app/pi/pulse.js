function pulsePin(pin, value, delay = () => 1000) {
    if (value) {
        return { gpioOn: pin, gpioOff: 0, usDelay: delay(1, 1) };
    } else {
        return { gpioOn: 0, gpioOff: pin, usDelay: delay(1, 1) };
    }
}

module.exports = {
    pulsePin
}