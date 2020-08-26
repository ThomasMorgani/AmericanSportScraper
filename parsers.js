module.exports = {
  async game(rawData) {
    //EXAMPLES
    const game = {
      id: rawData.id,
      gameTime: rawData.gameTime, //2019-09-08T17:00:00.000Z
      gsisId: rawData.gsisId,
      slug: 'titans-at-browns-2019-reg-1',
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
  async gameDetails(gameData = null, rawData) {
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
      weather: rawData.weather.shortDescription, //{
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
  standings(rawData) {
    if (typeof rawData !== 'object') return
    const standings = rawData.edges ? rawData.edges['0'].node.teamRecords : rawData['0'].node.teamRecords
    return standings
  },
}
