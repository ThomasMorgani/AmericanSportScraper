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
  async playersRoster() {
    console.log('FROM PLAYER ROSTER SCRAPER ')
    const data = []
    const tbody = document.querySelectorAll('tbody')
    for (tr of tbody['0'].children) {
      data.push({
        name: tr.cells['0'].innerText,
        number: tr.cells['1'].innerText,
        pos: tr.cells['2'].innerText,
        status: tr.cells['3'].innerText,
        height: tr.cells['4'].innerText,
        weight: tr.cells['5'].innerText,
        birthdate: tr.cells['6'].innerText,
        experience: tr.cells['7'].innerText,
        college: tr.cells['8'].innerText,
      })
    }
    return data
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
  async teamUrls() {
    //NOTE:
    //parent div: .d3-o-media-object__cta nfl-c-custom-promo__cta
    //child0 a: teamurl
    //child1 a:  team official website
    const results = []
    let teams = document.querySelectorAll(`[aria-label="View Profile"]`)
    teams.forEach(team => {
      let data = {}
      data.teamUrl = team.getAttribute('href')
      results.push(data)
    })

    console.log('ONLY RETURNING 2 RESULTS FOR TESTING`')

    return results
  },
}
