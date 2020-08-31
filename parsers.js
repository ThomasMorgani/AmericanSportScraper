module.exports = {
  /*

    METHODS FOR PARSING SCRAPED DATA

  */
  async gameDataset(name, data, gameData) {
    let parsedData = {}
    switch (name) {
      case 'game':
        //PAST MATCHUP RESPONSE IS LABELLED WITH GAME KEY, IGNORE THIS
        console.log('processing dataset:::game')
        if (data.slug === gameData.slug) {
          parsedData = await this.game(data)
        }
        break
      case 'gameDetail':
        console.log('processing dataset:::gameDetail')
        //PAST MATCHUP RESPONSE IS LABELLED WITH GAMEDETAIL KEY, IGNORE THIS
        if (data && Object.keys(data).length > 3) {
          parsedData = await this.gameDetails(data, gameData.game)
        }
        break
      case 'league':
        ///CURRENTLY ONLY RETURNS milestonePlayers: []
        ///WATCH AFTER SEASON STARTS FOR ANY CHANGE
        console.log('processing dataset:::league')
        return { placeHolder: '19' }
        break
      case 'live':
        console.log('processing dataset:::live')
        return await this.live(data)
        break
      case 'playerStats':
        console.log('processing dataset:::playerStats')
        return await this.playerStats(data)
        break
      case 'standings':
        console.log('processing dataset:::standings')
        parsedData = await this.standings(data)
        break
      case 'teams':
        console.log('processing dataset:::teams')
        parsedData = await this.teams(data)
        break
      case 'teamStats':
        console.log('processing dataset:::teamStats')
        parsedData = await this.teamStats(data)
        break
      default:
        console.log('PARSING ERROR: :::default reached')
        console.log(name, data, gameData)
        console.log('==============================')
        return false
        break
    }
    return parsedData
  },

  async game(rawData) {
    //EXAMPLES
    const game = {
      id: rawData.id,
      gameTime: rawData.gameTime, //2019-09-08T17:00:00.000Z
      gsisId: rawData.gsisId,
      slug: rawData.slug, //'titans-at-browns-2019-reg-1',
      awayTeam: rawData.awayTeam.id, //CONFIRM THIS ID IS STANDARD THROUGHOUT OTHER DATA
      homeTeam: rawData.homeTeam.id, //CONFIRM THIS ID IS STANDARD THROUGHOUT OTHER DATA
      seasonValue: rawData.week.seasonValue,
      //   weekId: '00020120-1920-5245-4719-400b50b3c04a', //CONFIRM THIS ID IS STANDARD
      seasonType: rawData.week.seasonType,
      weekValue: rawData.week.weekValue,
      weekType: rawData.week.weekType,
      venue: JSON.stringify(rawData.venue),
      gameDetailId: rawData.gameDetailId,
    }
    return game
  },

  async gameDetails(rawData, gameData = null) {
    if (gameData === null) {
      console.log('game details error... missing gameData')
      return
    }
    const details = {
      id: rawData.id, //THIS IS NOT GAME ID
      distance: rawData.distance,
      down: rawData.down,
      gameClock: rawData.gameClock, //'00:37'
      gameid: gameData.id,
      goalToGo: rawData.goalToGo, //Bool
      homePointsOvertime: rawData.homePointsOvertime,
      homePointsTotal: rawData.homePointsTotal,
      homePointsQ1: rawData.homePointsQ1,
      homePointsQ2: rawData.homePointsQ2,
      homePointsQ3: rawData.homePointsQ3,
      homePointsQ4: rawData.homePointsQ4,
      homeTeam: gameData.homeTeam,
      homeTimeoutsUsed: rawData.homeTimeoutsUsed,
      homeTimeoutsRemaining: rawData.homeTimeoutsRemaining,
      period: rawData.homeTimeoutsRemaining,
      phase: rawData.homeTimeoutsRemaining, //'FINAL'
      playReview: rawData.homeTimeoutsRemaining, //Bool
      possessionTeam: JSON.stringify(rawData.possessionTeam), //{ abbreviation: 'TEN', nickName: 'Titans' },
      redzone: rawData.redzone, //boolean
      // scoringSummaries: [
      //   [Object], [Object],
      //   [Object], [Object],
      //   [Object], [Object],
      //   [Object], [Object],
      //   [Object], [Object]
      // ],
      stadium: rawData.stadium, //'First Energy Stadium',
      visitorPointsTotal: rawData.visitorPointsTotal,
      startTime: rawData.startTime, //'13:00:00', //LOCALE DEPENDANT, EXCLUDE?
      visitorPointsOvertime: rawData.visitorPointsOvertime, //TODO: determine difference between this and total
      visitorPointsOvertimeTotal: rawData.visitorPointsOvertimeTotal,
      visitorPointsQ1: rawData.visitorPointsQ1,
      visitorPointsQ2: rawData.visitorPointsQ2,
      visitorPointsQ3: rawData.visitorPointsQ3,
      visitorPointsQ4: rawData.visitorPointsQ4,
      visitorPointsTotal: rawData.visitorPointsTotal,
      visitorTeam: gameData.awayTeam,
      visitorTimeoutsUsed: rawData.visitorTimeoutsUsed,
      visitorTimeoutsRemaining: rawData.visitorTimeoutsRemaining,
      homePointsOvertimeTotal: rawData.homePointsOvertimeTotal,
      weather: rawData.weather.shortDescription || '', //{
      //   currentFahrenheit: null,
      //   location: null,
      //   longDescription: null,
      //   shortDescription: 'Partly Cloudy Temp: 71° F, Humidity: 55%, Wind: NE 10 mph',
      //   currentRealFeelFahrenheit: null
      // },
      yardLine: rawData.yardLine,
      yardsToGo: rawData.yardsToGo,
    }

    return details
  },
  async gameResponse(json) {
    // console.log(json)
    if (json && json.data && json.data.viewer) {
      const viewer = json.data.viewer
      // console.log(viewer)
      //teamStats
      if (viewer.stats && viewer.stats.teamGameStats && viewer.stats.teamGameStats.edges && viewer.stats.teamGameStats.edges['0'] && viewer.stats.teamGameStats.edges['0'].node) {
        return { teamStats: viewer.stats.teamGameStats.edges['0'].node }
      }
      //playerStats //playerGameStats includes much more data.
      //TODO: monitor to ensure we can rely on playerGameStats
      if (viewer.live && viewer.live.playerGameStats) {
        // return   viewer.live
      }
      //playerGameStats
      if (viewer.playerGameStats && viewer.playerGameStats.edges) {
        const pos = ['QB', 'RB', 'FB', 'HB', 'TE', 'WR', 'K']
        return { playerStats: viewer.playerGameStats.edges.filter(e => e.node && pos.includes(e.node.player.position)).map(e => e.node) }
      }
      return json.data.viewer
    }
    return false
  },
  async gameTeams(gameData = null) {
    const { abbreviation, fullName, id, nickName, cityStateRegion } = gameData
    return { abbreviation, fullName, id, nickName, cityStateRegion }

    //TEAM DATA WILL BE MOVED TO SEPARATE SCRAPER
    //PLACE HOLDER FUNCTION
    if (gameData === null) {
      console.log('game Teams error... missing gameData')
      return
    }
    const teams = { awayTeam: {}, homeTeam: {} }

    return teams
  },
  async live(rawData) {
    if (typeof rawData !== 'object') return
    rawData = rawData.playerGameStats ? rawData.playerGameStats : rawData
    const liveData = {}
    return liveData
  },
  async logValue(data) {
    console.log('========  LOGGED VALUE ==========')
    console.log(data)
    return data
  },
  player(rawData, team = '') {
    //TODO: DETERMINE HOW TO ADD PLAYER TEAM AND GET OR GENERATE A UNIQUE ID
    //SEE NOTES file
    const name = rawData.name.split(' ')
    const nameAbv = `${name['0'].substring(0, 1)}. ${name['1']}`
    const player = {
      abv_name: nameAbv,
      first_name: name['0'],
      pid: '',
      last_name: name['1'],
      posiiton: rawData.pos,
      team: team,
      number: rawData.number,
      status: rawData.status,
      height: rawData.height,
      weight: rawData.weight,
      birthdate: rawData.birthdate,
      experience: rawData.experience,
      college: rawData.college,
    }
    // console.log(player)

    return player
  },
  async playerStats(data) {
    return data
  },
  standings(rawData) {
    if (typeof rawData !== 'object') return
    const standings = rawData.edges && rawData.edges['0'] ? rawData.edges['0'].node.teamRecords : []
    return standings
  },
  teamnameFromSlug(slug) {
    const segments = slug.split('-')
    const name = segments[segments.length - 1]
    //account for washington team (washington-football-team)
    return name === 'team' ? 'washington' : name
  },
  teamSlug(slug) {
    console.log(slug)
    if (!slug) return
    // /teams/baltimore-ravens/
    const split = slug.split('/')

    return split.filter(str => str.includes('-'))['0']
  },
  async teams(data) {
    if (data && data.edges) {
      return data.edges.map(i => i.node)
    }
    return []
  },
  async teamStats(data) {
    return data
  },
}
