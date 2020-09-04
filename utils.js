module.exports = {
  async isEmpty(obj) {
    return typeof obj === 'object' && Object.keys(obj).length === 0
  },
  async playerIdHash({ firstName, lastName, number, team }) {
    //VALIDATE EACH VALUE
    console.log(`${firstName}==${lastName}==${number}==${team}`)
    const id = Buffer.from(`${firstName}${lastName}${number}${team}`, 'utf8').toString('hex')
    console.log(id)
    return id
  },
}
