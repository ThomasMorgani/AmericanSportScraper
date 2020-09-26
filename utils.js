module.exports = {
  async isEmpty(obj) {
    return typeof obj === 'object' && Object.keys(obj).length === 0
  },
  playerIdHash({ firstName, lastName, position, team }) {
    //NOTE: position used to be number. Updated this function to use position instead
    //number is not included in live data
    //also may as well standardize the incoming strings
    //VALIDATE EACH VALUE
    const id = Buffer.from(`${firstName.toLowerCase()}${lastName.toLowerCase()}${position.toUpperCase()}${team.toLowerCase()}`, 'utf8').toString('hex')
    return id
  },
  playerIdHashOld({ firstName, lastName, number, team }) {
    //VALIDATE EACH VALUE
    const id = Buffer.from(`${firstName}${lastName}${number}${team}`, 'utf8').toString('hex')
    return id
  },
}
