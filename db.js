const fs = require('fs')
module.exports = {
  async save(data) {
    await fs.writeFile('weekData.json', JSON.stringify(data), err => {
      if (err) {
        return console.error('error writing file: ', err)
      }
    })
  },
}
