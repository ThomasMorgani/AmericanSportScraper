require('dotenv').config()
const puppeteer = require('puppeteer')

const db = require('./db')
const parsers = require('./parsers')
const scrapers = require('./scrapers')

module.exports = {
  async gameDataGame(url, browserIn = null) {
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
    fullUrl = process.env.baseUrl + url
    //SET GAME SLUG, IT NEEDS TO BE PASSED TO PARSER TO DETECT CORRECT GAME IS BEING SET
    gameData.slug = url.split('/games/')['1']
    try {
      const browser = browserIn ? browserIn : await puppeteer.launch({ headless: false })
      const page = await browser.newPage()
      console.log('FETCHING: ', url)
      await page.goto(fullUrl)
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
        const parsedData = await scrapers.gameResponse(response, gameData)
        if (parsedData) Object.keys(parsedData).forEach(dataSet => (gameData[dataSet] = { ...parsedData[dataSet] }))
      })
      await scrapers.gameTriggerStats(page)
      await page.waitFor(5000) //await a few seconds to ensure we captured requests
      return gameData
    } catch (err) {
      console.log('error caught', err)
      return gameData
    }
  },
  async gameDataSeason() {},
  async gameDataWeek(sesonData) {
    const browser = await puppeteer.launch({ headless: false })
    const scheduleData = []
    const weekScheduleUrls = await this.gameScheduleWeek({ ...sesonData }, browser)
    console.log('WEEK SCHEDULE URLS: ')
    console.log(weekScheduleUrls)
    count = 1 //DEBUG, SEE LOOP
    for (let url of weekScheduleUrls) {
      gameData = await this.gameDataGame(url.gameUrl, browser)
      scheduleData.push(gameData)
      //DEBUGGING: LIMIT GAMES PULLED
      count++
      if (count > 2) break
    }
    console.log('+++++++++++++++++++++++++++++=')
    // console.log(scheduleData)
    await browser.close()
    db.save(scheduleData, `week_${sesonData.type}${sesonData.week}_${sesonData.year}`)
  },
  async gameScheduleWeek({ type, week, year }, browser = null) {
    const endpoints = {
      scheduleWeek: `${process.env.baseUrl}/schedules/${year}/${type}${week}/`,
      scheduleWeekLazy: `https://www.nfl.com/api/lazy/load?json={%22Name%22:%22Schedules%22,%22Module%22:{%22seasonFromUrl%22:2020,%22SeasonType%22:%22REG1%22,%22WeekFromUrl%22:1,%22PreSeasonPlacement%22:0,%22RegularSeasonPlacement%22:0,%22PostSeasonPlacement%22:0,%22TimeZoneID%22:%22America/New_York%22}}`,
      //scheduleWeekLazy not being used.. keeping to checkout in the future
    }
    const url = endpoints.scheduleWeek
    console.log('getting schedules from: ', url)
    if (!browser) {
      const browser = await puppeteer.launch({ headless: true })
      // browser = await puppeteer.launch({  headless: false })
    }
    //get games for season week
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitFor(2000)
    let content = await page.evaluate(scrapers.scheduleUrls)
    return content
  },
  async playerData() {},
  async playerDataLeague() {
    const teamsUrl = process.env.baseUrl + '/teams'
    let players = []

    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    //GET LIST OF TEAM URL SLUGS
    await page.goto(teamsUrl)
    await page.waitFor(2500)
    const teamSlugs = await page.evaluate(scrapers.teamUrls)
    console.log(teamSlugs)
    let count = 1 //DEBUGGING, SEE LOOP
    for (slug of teamSlugs) {
      roster = await this.playerDataRoster(slug.teamUrl, browser)
      players = [...players, ...roster]
      count++
      if (count > 4) break
    }
    db.save(players, 'playersLeague')
    console.log('DONE>>>>>')
    await browser.close()
  },
  async playerDataRoster(slug, browserIn = false, storeResults = true) {
    //STANDARDIZE SLUG
    slug = parsers.teamSlug(slug)
    console.log(slug)
    const fullUrl = `${process.env.baseUrl}/teams/${slug}/roster`
    console.log(fullUrl)
    //LIST OF POSITIONS WE'RE INTERESTED IN RETRIEVING
    const pos = ['QB', 'RB', 'FB', 'HB', 'TE', 'WR', 'K']
    const players = []
    try {
      const browser = browserIn ? browserIn : await puppeteer.launch({ headless: false })
      const page = await browser.newPage()
      console.log('FETCHING: ', fullUrl)
      await page.goto(fullUrl)
      await page.setRequestInterception(true)

      //ABORT ALL REQUESTS NOT RELEVANT  //TODO: CREATE COMPLETE BLACKLIST
      page.on('request', async request => {
        if (request.type === 'image') {
          request.abort()
        } else {
          request.continue()
        }
      })

      //SCRAPE PLAYERS, SET TEAM NAME SCRAPING, RETURN PLAYERS FILTERED BY POSITION AND FORMATTED
      const scrapedData = await page.evaluate(scrapers.playersRoster)
      const team = parsers.teamnameFromSlug(slug)
      const players = scrapedData.filter(player => pos.includes(player.pos)).map(player => parsers.player(player, team))
      console.log(players)

      if (storeResults) {
        await db.save(players, `players_${team}`)
      }
    } catch (err) {
      console.log('error caught', err)
    }
    if (!browserIn) {
      await browser.close
    }
    return players
  },
  async teamData() {},
  async weekData() {},
}
