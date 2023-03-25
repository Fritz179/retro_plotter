module.exports = (assertion, ...msgs) => {
    if (assertion) return

    console.error(...msgs)
    console.trace()
    throw msgs[0]
}