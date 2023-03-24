module.exports = (...msgs) => {
    console.error(...msgs)
    console.trace()
    throw msgs[0]
}