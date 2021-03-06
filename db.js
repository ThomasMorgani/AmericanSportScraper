const fs = require('fs')
module.exports = {
  async save(data, filename = 'data') {
    await fs.writeFileSync(`store/${filename}.json`, JSON.stringify(data), err => {
      if (err) {
        return console.error('error writing file: ', err)
      } else {
        console.log(`Wrote to store/${filename}.json`)
        return true
      }
    })
  },
}
