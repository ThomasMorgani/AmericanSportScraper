const utils = require('./utils')
const parsers = require('./parsers')
module.exports = {
  /*

    METHODS FOR PAGE SCRAPING AND AJAX RESPONSES

  */
  async gameResponse(response, gameData) {
    const json = await response.json().catch(() => console.log('no json'))
    const data = await parsers.gameResponse(json)
    if (data) {
      const dataSet = Object.keys(data)['0']
      if (await utils.isEmpty(gameData[dataSet])) {
        parsedData = await parsers.gameDataset(dataSet, data[dataSet], gameData)
        return { [dataSet]: parsedData }
      }
    }
    return
  },
  async gameTriggerStats(page) {
    //ClICK ON "STATS TAB" TO TRIGGER AJAX CALLS (live, teamPlayerStats, teamGameStats)
    await page.waitFor(3000)
    console.log('DONE WAITING 3000')
    try {
      await page.$eval(`[data-testid="gamecenter-tabs-container"]`, elem => {
        console.log(elem)
        elem.children.forEach(ch => {
          console.log(ch)
          if (ch.innerText === 'STATS') {
            ch.click()
          }
        })
      })
    } catch (err) {
      console.log('failed finding tab div, waiting 5 more seconds')
      await page.waitFor(5000)
      await page.$eval(`[data-testid="gamecenter-tabs-container"]`, elem => {
        console.log(elem)
        elem.children.forEach(ch => {
          console.log(ch)
          if (ch.innerText === 'STATS') {
            ch.click()
          }
        })
      })
    }
    return 'done'
  },
  async scheduleUrls() {
    //NOTE:
    //.nfl-c-matchup-strip__game-info
    //gametime, networks
    const results = []
    let games = document.querySelectorAll('.nfl-c-matchup-strip__left-area')
    games.forEach(game => {
      let gameData = {}
      gameData.gameUrl = game.getAttribute('href')
      results.push(gameData)
    })

    console.log('ONLY RETURNING 2 RESULTS FOR TESTING`')

    return results
  },
}
