module.exports = {
  async isEmpty(obj) {
    return typeof obj === 'object' && Object.keys(obj).length === 0
  },
  playerIdHash({ firstName, lastName, number, team }) {
    //VALIDATE EACH VALUE
    const id = Buffer.from(`${firstName}${lastName}${number}${team}`, 'utf8').toString('hex')
    return id
  },
}
