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
    await page.waitForTimeout(3000)
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
      await page.waitForTimeout(5000)
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
  async plays() {
    //css-view-1dbjc4n //WHOLE PLAY DIV
    //css-view-1dbjc4n //INNER ITEMS AS WELL USE THIS
    //h3 is play title ('Touchdown', 'Field Goal')
  },
  async player(player) {
    //nfl-c-player-header__info
    return new Promise((resolve, reject) => {
      //THIS IS NOT RELIABLE
      //TODO: REMOVE WHEN CONFIRMED
      // const info = document.querySelector('.nfl-c-player-header__info')
      // if (info?.children.length > 0) {
      //   const childs = info.children
      //   //childs['0']class of career status,  hidden
      //   const name = childs['1'].innerText
      //   const posNum = childs['2'].innerText.split(' • #')
      //   const team = childs['3'] ? childs['3'].innerText.split(' ') : ''
      //   const status = childs['4'] ? childs['4'].innerText.toLowerCase() : 'active'
      const statusMap = {
        active: 'ACT',
      }

      const name = document.querySelector('.nfl-c-player-header__title').innerText
      const posNum = document.querySelector('.nfl-c-player-header__player-data').innerText
      const teamFull = document.querySelectorAll('.nfl-c-player-header__team').innerText
      const team = teamFull ? team.split(' ') : ['']
      const statusText = document.querySelectorAll('.nfl-c-player-header__roster-status').innerText
      const status = statusText ? statusText.toLowerCase() : 'active' //TODO: PROPERLY DETERMINE OLD POSSIBLE STATUSES
      const imgs = document.querySelectorAll('.img-responsive')
      const headshot = imgs['1'].getAttribute('src')

      const playerData = {
        id: '',
        headshot,
        name,
        number: posNum['1'],
        pos: posNum['0'],
        status: statusMap[status],
        team: team[team.length - 1].toLowerCase(),
      }
      // height: rawData.height : '',
      // weight: rawData.weight : '',
      // birthdate: rawData.birthdate : '',
      // experience: rawData.experience : '',
      // college: rawData.college : '',

      console.log(playerData)
      resolve(playerData)
    })
  },
  async playersRoster() {
    console.log('FROM PLAYER ROSTER SCRAPER ')
    return new Promise((resolve, reject) => {
      const data = []
      //SCROLL INTO VIEW SO LAZY CONTENT LOADS
      const footer = document.querySelector('footer')
      footer.scrollIntoView()
      setTimeout(() => {
        const tbody = document.querySelectorAll('tbody')
        for (tr of tbody['0'].children) {
          const img = tr.cells['0'].querySelector('img')
          const headshot = img ? img.getAttribute('src') : ''
          console.log(img)
          data.push({
            headshot: headshot,
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
        console.log(data)
        resolve(data)
      }, 5000)
    })
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
    return results
  },
  async teamUrls() {
    //NOTE:
    //parent div: .d3-o-media-object__cta nfl-c-custom-promo__cta
    //child0 a: teamurl
    //child1 a:  team official website
    const els = document.querySelectorAll(`.d3-o-media-object__link`)
    //document.querySelectorAll(`[aria-label="View Profile"]`)//THIS IS NOT RELIABLE, TODO: DELETE WHEN CONFIRMED
    const slugs = []
    els.forEach(el => {
      if (el.innerText.toLowerCase().includes('profile')) {
        slugs.push({ teamUrl: el.getAttribute('href') })
      }
    })
    return slugs
  },
}
