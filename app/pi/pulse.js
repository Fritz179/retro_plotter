function pulsePin(pin, value, delay = () => 1000) {
    if (value) {
        return { gpioOn: pin, gpioOff: 0, usDelay: delay() };
    } else {
        return { gpioOn: 0, gpioOff: pin, usDelay: delay() };
    }
}

module.exports = {
    pulsePin
}