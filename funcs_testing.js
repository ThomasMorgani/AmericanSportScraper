require('dotenv').config()
const puppeteer = require('puppeteer')
const fs = require('fs') //USED FOR TESTING, REMOVE

const db = require('./db')
const parsers = require('./parsers')
const scrapers = require('./scrapers')
const utils = require('./utils')

//WILL BE PASSED TO BROWSER INSTANCE FOR DEBUGGING
const isHeadless = true

module.exports = {
  async gameDataGame(url, browserIn = null, pageIn = null, storeResults = true) {
    const gameData = {
      game: {},
      gameDetail: {},
      league: {},
      playerStats: [],
      slug: '',
      standings: {}, // currently using standings data as league data ^
      teams: [],
      teamStats: {},
    }
    const isSlug = !url.includes('/games/')
    fullUrl = isSlug ? process.env.baseUrl + '/games/' + url : process.env.baseUrl + url
    //SET GAME SLUG, IT NEEDS TO BE PASSED TO PARSER TO DETECT CORRECT GAME IS BEING SET
    gameData.slug = isSlug ? url : url.split('/games/')['1']

    try {
      const browser = browserIn ? browserIn : await puppeteer.launch({ headless: isHeadless })
      //TODO: Come back to this, pages dont load when passing in page or trying to set tab
      // const page = pageIn ? pageIn : await browser.newPage()
      const page = await browser.newPage()
      console.log('FETCHING: ', url)
      await page.goto(fullUrl)
      await page.setRequestInterception(true)

      //ABORT ALL REQUESTS NOT RELEVANT  //TODO: CREATE COMPLETE BLACKLIST
      // page.on('request', async request => {
      //   if (request.type === 'image') {
      //     request.abort()
      //   } else {
      //     request.continue()
      //   }
      //   return
      // })

      page.on('response', async response => {
        // console.log('on resp') //debugging
        if (response.request().method() !== 'GET') return // Ignore all requests not GET
        if (!response.url().includes(process.env.apiUrl)) return // we're only interested in calls to nfl api
        // console.log('\n 🚀MATCH: ', response.url()) //debugging
        const parsedData = await scrapers.gameResponse(response, gameData)
        // if (parsedData) Object.keys(parsedData).forEach(dataSet => (gameData[dataSet] = { ...parsedData[dataSet] }))
        if (parsedData) {
          for (let dataSet in parsedData) {
            console.log('====================DATA SET ===================')
            console.log(dataSet)
            gameData[dataSet] = parsedData[dataSet]
            if (dataSet === 'game') {
              //TODO: I DONT LIKE THIS
              //SEPARATE PARSERS OUT OF REPSONSE SCRAPER
              console.log('====================IS GAME ===================')
              const json = await response.json().catch(() => console.log('no json'))
              const teams = await parsers.teams(json)
              gameData.teams = [...gameData.teams, ...teams]
            }
          }
        }
      })
      await scrapers.gameTriggerStats(page)
      await page.waitForTimeout(3000) //await a few seconds to ensure we captured requests
      // if (gameData?.playerStats.length > 0) {
      //   gameData.teamStats = await teamStats(gameData)
      // }
      if (storeResults) {
        await db.save(gameData, gameData.slug)
      }
      if (!pageIn) {
        await page.close()
      }
      if (!browserIn) {
        await browser.close()
      }
      return gameData
    } catch (err) {
      console.log('error caught', err.message)

      if (!browserIn && browser !== undefined) {
        await browser.close()
      }
      return gameData
    }
  },
  async gameDataSeason() {},
  async gameDataWeek(seasonData) {
    const browser = await puppeteer.launch({ headless: isHeadless })
    // const page = await browser.newPage()

    // await page.setViewport({
    //   width: 5000,
    //   height: 3000,
    // })
    // await page.setUserAgent('Your user agent Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36')

    const scheduleData = []
    const weekScheduleUrls = await this.gameScheduleWeek({ ...seasonData }, browser)
    // const weekScheduleUrls = await this.gameScheduleWeek({ ...seasonData }, browser, page)
    console.log('WEEK SCHEDULE URLS: ')
    console.log(weekScheduleUrls)
    count = 1 //DEBUG, SEE LOOP
    for (let url of weekScheduleUrls) {
      gameData = await this.gameDataGame(url.gameUrl, browser)
      // gameData = await this.gameDataGame(url.gameUrl, browser, page)
      scheduleData.push(gameData)
      //DEBUGGING: LIMIT GAMES PULLED
      count++
      // if (count > 2) break
    }
    // console.log('+++++++++++++++++++++++++++++=')
    // console.log(scheduleData)
    await browser.close()
    db.save(scheduleData, `week_${seasonData.type}${seasonData.week}_${seasonData.year}`)
    return scheduleData
  },
  async gameScheduleWeek({ type, week, year }, browserIn = null, pageIn = null) {
    const endpoints = {
      scheduleWeek: `${process.env.baseUrl}/schedules/${year}/${type}${week}/`,
      scheduleWeekLazy: `https://www.nfl.com/api/lazy/load?json={%22Name%22:%22Schedules%22,%22Module%22:{%22seasonFromUrl%22:2020,%22SeasonType%22:%22REG1%22,%22WeekFromUrl%22:1,%22PreSeasonPlacement%22:0,%22RegularSeasonPlacement%22:0,%22PostSeasonPlacement%22:0,%22TimeZoneID%22:%22America/New_York%22}}`,
      //scheduleWeekLazy not being used.. keeping to checkout in the future
    }
    const url = endpoints.scheduleWeek
    console.log('getting schedules from: ', url)

    try {
      const browser = browserIn ? browserIn : await puppeteer.launch({ headless: isHeadless })
      const page = pageIn ? pageIn : await browser.newPage()

      //get games for season week
      await page.goto(url)
      await page.waitForTimeout(2000)
      let content = await page.evaluate(scrapers.scheduleUrls)

      if (!browserIn) {
        await browser.close()
      }
      return content
    } catch (err) {
      console.log('error caught', err.message)

      if (!browserIn && browser !== undefined) {
        await browser.close()
      }
      return gameData
    }
  },
  async playerDataLeague() {
    const teamsUrl = process.env.baseUrl + '/teams'
    let players = []

    const browser = await puppeteer.launch({ headless: isHeadless })
    const page = await browser.newPage()
    //GET LIST OF TEAM URL SLUGS
    await page.goto(teamsUrl)
    await page.waitForTimeout(2000)
    const teamSlugs = await page.evaluate(scrapers.teamUrls)
    console.log(teamSlugs)
    let count = 1 //DEBUGGING, SEE LOOP
    for (slug of teamSlugs) {
      roster = await this.playerDataRoster(slug.teamUrl, browser)
      players = [...players, ...roster]
      count++
      // if (count > 4) break
    }
    console.log('RAN ALL TEAMS, FINAL PLAYERS LENGTH: ', players.length)
    db.save(players, 'playersLeague')
    await browser.close()
  },
  async playerDataPlayer(slug, browserIn = false, storeResults = false) {
    //RETRIEVES FROM PLAYER'S PAGE
    const browser = browserIn ? browserIn : await puppeteer.launch({ headless: isHeadless })
    const page = await browser.newPage()
    //GET LIST OF TEAM URL SLUGS
    const url = 'https://www.nfl.com/players/' + slug
    await page.goto(url)
    await page.waitForTimeout(2000)
    const scrapedData = await page.evaluate(scrapers.player)
    // console.log(scrapedData)
    const playerData = await parsers.player(scrapedData, scrapedData.team)
    // console.log(JSON.stringify(playerData))
    if (storeResults) {
      await db.save(players, `player_${playerData.full_name}`)
    }
    if (!browserIn) {
      // await browser.close()
    }
    return playerData
  },
  async playerDataRoster(slug, browserIn = false, storeResults = true) {
    //RETRIEVES FROM TEAM'S ROSTER PAGE
    //STANDARDIZE SLUG
    slug = parsers.teamSlug(slug)
    const fullUrl = `${process.env.baseUrl}/teams/${slug}/roster`
    //LIST OF POSITIONS WE'RE INTERESTED IN RETRIEVING
    const pos = ['QB', 'RB', 'FB', 'HB', 'TE', 'WR', 'K']
    let players = []
    try {
      //IF BROWSER INSTANCE EXISTS, USE IT
      const browser = browserIn ? browserIn : await puppeteer.launch({ headless: false })
      //IF BROWSER INSTANCE HAS OPEN TABS, DONT SPAWN NEW TABS, USE FIRST OPEN
      const pages = await browser.pages()
      const page = pages.length > 0 ? pages['0'] : await browser.newPage()
      console.log('FETCHING: ', fullUrl)
      await page.goto(fullUrl).catch(err => console.log(err))
      //ABORT ALL REQUESTS NOT RELEVANT  //TODO: CREATE COMPLETE BLACKLIST
      //CURRENTLY DISABLING SINCE THIS SEEMS TO BE CAUSING A BUG
      //"REQUEST ALREADY HANDLED"
      //SEE: https://github.com/puppeteer/puppeteer/issues/5334
      // await page.setRequestInterception(true)
      // page
      //   .on('request', async request => {
      //     if (request.type === 'image') {
      //       request.abort()
      //     } else {
      //       request.continue()
      //     }
      //   })
      // .catch(err => console.log(err))

      //SCRAPE PLAYERS, SET TEAM NAME SCRAPING, RETURN PLAYERS FILTERED BY POSITION AND FORMATTED
      const scrapedData = await page.evaluate(scrapers.playersRoster)
      const team = parsers.teamnameFromSlug(slug)
      players = scrapedData.filter(player => pos.includes(player.pos)).map(player => parsers.player(player, team))
      players = scrapedData.filter(player => !pos.includes(player.pos)).map(player => parsers.player(player, team))

      if (storeResults) {
        await db.save(players, `players_${team}`)
      }
      if (!browserIn) {
        await browser.close()
      }
    } catch (err) {
      console.log('error caught', err.message)
    }
    return players
  },
  async teamData(uri, browserIn = null) {
    const url = process.env.baseUrl + uri
    const slug = uri.split('/games/')['1'] //GAME SLUG REQUIRED TO CONFIRM WE PARSE CORRECT GAME RESPONSE
    let teams = []
    try {
      const browser = browserIn ? browserIn : await puppeteer.launch({ headless: isHeadless })
      const page = await browser.newPage()
      console.log('FETCHING: ', url)
      await page.goto(url)
      await page.setRequestInterception(true)

      //ABORT ALL REQUESTS NOT RELEVANT  //TODO: CREATE COMPLETE BLACKLIST
      page.on('request', async request => {
        if (request.type === 'image') {
          request.abort()
        } else {
          request.continue()
        }
        return
      })

      page.on('response', async response => {
        // console.log('on resp') //debugging
        if (response.request().method() !== 'GET') return // Ignore all requests not GET
        if (!response.url().includes(process.env.apiUrl)) return // we're only interested in calls to nfl api
        // console.log('\n 🚀MATCH: ', response.url()) //debugging
        const json = await response.json().catch(() => console.log('no json'))
        if (json?.data?.viewer?.game) {
          const game = json.data.viewer.game
          if (game.slug === slug) {
            teams = parsers.teams([game.awayTeam, game.homeTeam])
            // teams = [game.awayTeam, game.homeTeam]
          }
        }
      })
      await scrapers.gameTriggerStats(page)
      await page.waitForTimeout(5000) //await a few seconds to ensure we captured requests
      return teams
    } catch (err) {
      console.log('error caught', err.message)
    }
  },
  async teamDataLeague(seasonData) {
    //WILL SCRAPE ALL TEAM DATA FROM PROVIDED SEASON YEAR
    //RETURNS ALL TEAMS WITH id, abbrv, cityStateRegion, fullname, nickname
    const browser = await puppeteer.launch({ headless: isHeadless })
    let teams = []
    const weekScheduleUrls = await this.gameScheduleWeek({ ...seasonData }, browser)
    console.log('WEEK SCHEDULE URLS: ')
    console.log(weekScheduleUrls)
    count = 1 //DEBUG, SEE LOOP
    for (let url of weekScheduleUrls) {
      data = await this.teamData(url.gameUrl, browser)
      teams = [...teams, ...data]
      //DEBUGGING: LIMIT GAMES PULLED
      count++
      // if (count > 2) break
    }
    await browser.close()
    db.save(teams, `teams_${seasonData.year}`)
    return teams
  },
  async testing() {
    let rawdata = fs.readFileSync('./store/REPSONSES/LIVE_GAMES/dolphins-at-jaguars-2020-reg-3.json')
    let json = JSON.parse(rawdata)
    // console.log(json)
    let data = await parsers.gameResponse(json)
    const name = Object.keys(data)['0']
    // console.log(data)
    let playerData = {}
    playerData['playerStats'] = await parsers.gameDataset(name, data[name])
    db.save(playerData, 'test_live_game_data')
  },

  async updatePlayerIds(playerJson = null) {
    //Live game data does not include player jersey number
    //This function pulls all players and returns an array of
    //players with the old id and the new one
    //new one hashes firstName, lastName, position (replaces number), team
    //poor choice of values to use in the first place,
    //REMINDER: when players change teams, playerid needs to be updated across all tables
    //help function server side (requires originalId, newId)
    // let rawdata = fs.readFileSync('./store/playersMissing.json')
    let rawdata = fs.readFileSync('./store/' + playerJson + '.json')
    let json = JSON.parse(rawdata)
    const ids = json.map(player => {
      const { first_name: firstName, last_name: lastName, number, position, team } = player
      return {
        original: utils.playerIdHashOld({ firstName, lastName, number, team }),
        new: utils.playerIdHash({ firstName, lastName, position, team }),
      }
    })
    db.save(ids, 'playersMissingIdsUpdate')
  },
  async weekData() {},
}