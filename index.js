const puppeteer = require('puppeteer')

const parsers = require('./parsers')
const scrapers = require('./scrapers')

const baseurl = 'https://www.nfl.com'
const apiUrl = 'https://api.nfl.com/v3/shield'
//w query
// const apiUrl = 'https://api.nfl.com/v3/shield/?query='

function dumpFrameTree(frame, indent) {
  console.log(indent + frame.url())
  for (const child of frame.childFrames()) {
    dumpFrameTree(child, indent + '  ')
  }
}

async function getpage(url, scraper) {
  try {
    //testing diff chrome versions
    // const browserFetcher = puppeteer.createBrowserFetcher()
    // const revisionInfo = await browserFetcher.download('801254')

    // const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: false })
    const browser = await puppeteer.launch({ headless: true })
    //get games for season week
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitFor(2000)
    let content = await page.evaluate(scraper)
    console.log('content url list', content)

    //FOLLOW EACH GAME AND PARSE
    //TESTING
    const scheduleData = []
    content = [content['3']]
    console.log('fetching: ' + content)
    content.forEach(async element => {
      const gameData = {
        game: {},
        details: {},
        league: {},
        // standings: {}, currently using standings data as league data ^
        teams: [],
      }
      let isComplete = false
      await page.goto(`${baseurl}${element.gameUrl}`)
      // await page.reload() //i think remove this...ensure we are still catching these ajax requests reliably
      await page.on('response', async response => {
        if (response.request().method() !== 'GET') return // Ignore all requests not GET
        if (!response.url().includes(apiUrl)) return // we're only interested in calls to nfl api
        // console.log('\n 🚀MATCH: ', response.url()) //debugging
        const json = await response.json().catch(() => console.log('no json'))
        if (json && json.data && json.data.viewer && !json.data.viewer.mediaToken) {
          const data = json.data.viewer
          const dataSet = Object.keys(json.data.viewer)['0']

          // console.log(dataSet)
          // console.log('=====================')
          switch (dataSet) {
            case 'game':
              console.log('dataset === game')
              //TODO: GET TEAMS FROM HERE TEMPORARILY, SEPARATE TEAM SCRAPER
              if (await isEmpty(gameData.game)) {
                console.log('is EMPTY')
                console.log(gameData.game)
                gameData.teams.push(await parsers.gameTeams(data.game.awayTeam))
                // console.log(gameData.teams)

                gameData.teams.push(await parsers.gameTeams(data.game.homeTeam))
                gameData.game = await parsers.game(data.game)
              }
              // parsedData.push(data)
              break
            case 'league':
              ///CURRENTLY ONLY RETURNS milestonePlayers: []
              ///WATCH AFTER SEASON STARTS FOR CHANGE
              console.log('dataset === league')
              // gameData.league = await data.league
              // parsedData.push(data)
              break
            case 'standings':
              console.log('dataset === standings')
              if (isEmpty(gameData.league)) {
                gameData.league = await parsers.standings(data.standings)
              }
              // parsedData.push(data)
              break
            case 'gameDetail':
              console.log('dataset === gameDetail')
              if (isEmpty(gameData.details)) {
                gameData.details = await parsers.gameDetails(gameData.game, data.gameDetail)
              }
              break
            default:
              console.log('dataset === default reached')
              // parsedData.push(data)
              break
          }

          //TODO: TEST IF THIS IS NEEDED
          //IF ALL REQUIRED DATA IS RECEIVED; MOVE ON TO NEXT
          let retrievedCount = 0
          Object.values(gameData).forEach(d => (Object.keys(d).length > 0 ? retrievedCount++ : null))
          console.log('isComplete? ', retrievedCount === Object.keys(gameData).length)
          if (retrievedCount === Object.keys(gameData).length) {
            console.log('ALL GAME DATA RETRIEVED, PARSE, NEXT URL')
            scheduleData.push(gameData)
            console.log(scheduleData)
            //IF LAST ITEM OF URL LIST, CLOSER BROWSER, UPDATE DB
            await browser.close()
          }
        }
      })
    })
    // await browser.close()
    return scheduleData
  } catch (err) {
    console.log('error caught')
    console.log(err)
    // await browser.close()
  }
}

async function isEmpty(obj) {
  console.log(typeof obj)
  console.log(Object.keys(obj).length)
  console.log(Object.keys(obj).length === 0)
  console.log(typeof obj === 'object' && Object.keys(obj).length === 0)
  return typeof obj === 'object' && Object.keys(obj).length === 0
}

const sesonData = {
  week: 1,
  year: 2019,
  type: 'REG',
}

const endpoints = {
  scheduleWeek: `https://www.nfl.com/schedules/${sesonData.year}/${sesonData.type}${sesonData.week}/`,
  scheduleWeekLazy: `https://www.nfl.com/api/lazy/load?json={%22Name%22:%22Schedules%22,%22Module%22:{%22seasonFromUrl%22:2020,%22SeasonType%22:%22REG1%22,%22WeekFromUrl%22:1,%22PreSeasonPlacement%22:0,%22RegularSeasonPlacement%22:0,%22PostSeasonPlacement%22:0,%22TimeZoneID%22:%22America/New_York%22}}`,
}

const week1 = getpage(endpoints.scheduleWeek, scrapers.scheduleUrls)
// const scheduleParsed =
console.log('ww')
console.log(week1)
// console.log(scheduleParsed)
