const utils = require('./utils.js')
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
        return //disabled for now
        return data.map(player => this.playerStats(player))
        break
      case 'standings':
        console.log('processing dataset:::standings')
        return //DISABLE FOR NOW
        parsedData = await this.standings(data)
        break
      case 'teams':
        console.log('processing dataset:::teams')
        parsedData = await this.teams(data)
        break
      case 'teamStats':
        console.log('processing dataset:::teamStats')
        if (gameData.game) {
          parsedData = await this.teamStats(data, gameData.game)
        } else {
          console.log('no gameData')
        }
        // console.log(...gameData.teamStats)
        // console.log(...parsedData)
        // parsedData = { ...gameData.teamStats, ...parsedData }
        // parsedData = { ...parsedData }
        break
      default:
        console.log('PARSING ERROR: :::default reached')
        // console.log(name, data, gameData)
        console.log('==============================')
        return false
        break
    }
    return parsedData
  },

  async game(rawData) {
    const { awayTeam, homeTeam, week } = rawData
    const game = {
      away_abv: awayTeam.abbreviation,
      away_team: awayTeam.id, //CONFIRM THIS ID IS STANDARD THROUGHOUT OTHER DATA
      game_id: rawData.id,
      gameDetailId: rawData.gameDetailId,
      gameTime: rawData.gameTime, //2019-09-08T17:00:00.000Z
      gsis_id: rawData.gsisId,
      home_abv: homeTeam.abbreviation,
      home_team: homeTeam.id, //CONFIRM THIS ID IS STANDARD THROUGHOUT OTHER DATA
      season_value: week.seasonValue,
      season_type: week.seasonType,
      slug: rawData.slug, //'titans-at-browns-2019-reg-1',
      venue: JSON.stringify(rawData.venue),
      week: week.weekValue,
      week_id: week.id, //CONFIRM THIS ID IS STANDARD
      week_type: week.weekType,
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
    if (json && json.data && json.data.viewer) {
      const viewer = json.data.viewer
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
  playerStats(rawData) {
    console.log('playerStats PARSER~~~~~~~~~~~~~~')
    const { id, game, player, season, week } = rawData
    const { currentTeam: team } = player
    //MAP STATS TO EXISTING PLAYER_PLAY STRUCTURE
    //ADDITIONAL AVAILABLE SLOTS AT END OF METHOD

    //TODO: PREFIX ID IF DST?
    const playerId = utils.playerIdHash({
      firstName: player.person.firstName,
      lastName: player.person.lastName,
      number: player.jerseyNumber,
      team: team.abbreviation,
    })
    //TODO: ANALYZE DATA LAYOUT, WHAT TO KEEP/REMOVE
    //COMBINE PLAYER & DST STATS?
    const stats = {
      game_id: game.id || 0,
      play_id: id || 0,
      player_id: playerId || 'ERR',
      team: player.currentTeam.abbreviation || 0,
      season_id: season.id || 0,
      week_id: week.id || 0,
      defense_ast: rawData.defensiveAssists || 0,
      defense_ffum: rawData.defensiveForcedFumble || 0,
      defense_fgblk: rawData.xxxx || 0,
      defense_frec: rawData.xxxx || 0,
      defense_frec_tds: rawData.xxxx || 0,
      defense_frec_yds: rawData.xxxx || 0,
      defense_int: rawData.defensiveInterceptions || 0,
      defense_int_tds: rawData.xxxx || 0,
      defense_int_yds: rawData.defensiveInterceptionsYards || 0,
      defense_misc_tds: rawData.xxxx || 0,
      defense_misc_yds: rawData.xxxx || 0,
      defense_pass_def: rawData.defensivePassesDefensed || 0,
      defense_puntblk: rawData.xxxx || 0,
      defense_qbhit: rawData.xxxx || 0,
      defense_safe: rawData.defensiveSafeties || 0,
      defense_sk: rawData.defensiveSacks || 0,
      defense_sk_yds: rawData.xxxx || 0,
      defense_tkl: rawData.defensiveTotalTackles || 0,
      defense_tkl_loss: rawData.defensiveTacklesForALoss || 0,
      defense_tkl_loss_yds: rawData.xxxx || 0,
      defense_tkl_primary: rawData.xxxx || 0,
      defense_xpblk: rawData.xxxx || 0,
      fumbles_forced: rawData.xxxx || 0,
      fumbles_lost: rawData.fumblesLost || 0,
      fumbles_notforced: rawData.xxxx || 0,
      fumbles_oob: rawData.xxxx || 0,
      fumbles_rec: rawData.xxxx || 0,
      fumbles_rec_tds: rawData.xxxx || 0,
      fumbles_rec_yds: rawData.xxxx || 0,
      fumbles_tot: rawData.fumblesTotal || 0,
      kicking_all_yds: rawData.xxxx || 0,
      kicking_downed: rawData.xxxx || 0,
      kicking_fga: rawData.kickingFgAtt || 0,
      kicking_fgb: rawData.xxxx || 0,
      kicking_fgm: rawData.kickingFgMade || 0,
      kicking_fgm_yds: rawData.xxxx || 0,
      kicking_fgmissed: rawData.xxxx || 0,
      kicking_fgmissed_yds: rawData.xxxx || 0,
      kicking_i20: rawData.xxxx || 0,
      kicking_rec: rawData.xxxx || 0,
      kicking_rec_tds: rawData.xxxx || 0,
      kicking_tot: rawData.xxxx || 0,
      kicking_touchback: rawData.xxxx || 0,
      kicking_xpa: rawData.kickingXkAtt || 0,
      kicking_xpb: rawData.xxxx || 0,
      kicking_xpmade: rawData.kickingXkMade || 0,
      kicking_xpmissed: rawData.xxxx || 0,
      kicking_yds: rawData.xxxx || 0,
      kickret_fair: rawData.xxxx || 0,
      kickret_oob: rawData.xxxx || 0,
      kickret_ret: rawData.kickReturns || 0,
      kickret_tds: rawData.kickReturnsTouchdowns || 0,
      kickret_touchback: rawData.xxxx || 0,
      kickret_yds: rawData.kickReturnsYards || 0,
      passing_att: rawData.passingAttempts || 0,
      passing_cmp: rawData.passingCompletions || 0,
      passing_cmp_air_yds: rawData.xxxx || 0,
      passing_incmp: rawData.xxxx || 0,
      passing_incmp_air_yds: rawData.xxxx || 0,
      passing_int: rawData.passingInterceptions || 0,
      passing_sk: rawData.xxxx || 0,
      passing_sk_yds: rawData.xxxx || 0,
      passing_tds: rawData.passingTouchdowns || 0,
      passing_twopta: rawData.xxxx || 0,
      passing_twoptm: rawData.xxxx || 0,
      passing_twoptmissed: rawData.xxxx || 0,
      passing_yds: rawData.passingYards || 0,
      punting_blk: rawData.xxxx || 0,
      punting_i20: rawData.puntingPuntsInside20 || 0,
      punting_tot: rawData.puntingPunts || 0,
      punting_touchback: rawData.xxxx || 0,
      punting_yds: rawData.xxxx || 0,
      puntret_downed: rawData.xxxx || 0,
      puntret_fair: rawData.xxxx || 0,
      puntret_oob: rawData.xxxx || 0,
      puntret_tds: rawData.puntReturnsTouchdowns || 0,
      puntret_tot: rawData.puntReturns || 0,
      puntret_touchback: rawData.xxxx || 0,
      puntret_yds: rawData.xxxx || 0,
      receiving_rec: rawData.receivingReceptions || 0,
      receiving_tar: rawData.receivingTarget || 0,
      receiving_tds: rawData.receivingTouchdowns || 0,
      receiving_twopta: rawData.xxxx || 0,
      receiving_twoptm: rawData.xxxx || 0,
      receiving_twoptmissed: rawData.xxxx || 0,
      receiving_yac_yds: rawData.xxxx || 0,
      receiving_yds: rawData.receivingYards || 0,
      rushing_att: rawData.rushingAttempts || 0,
      rushing_loss: rawData.xxxx || 0,
      rushing_loss_yds: rawData.xxxx || 0,
      rushing_tds: rawData.rushingTouchdowns || 0,
      rushing_twopta: rawData.xxxx || 0,
      rushing_twoptm: rawData.xxxx || 0,
      rushing_twoptmissed: rawData.xxxx || 0,
      rushing_yds: rawData.rushingYards || 0,
    }

    return stats
    //ADDIITONAL STATS NOT CURRENTLY IN DB
    // "defensiveSoloTackles": null,
    // "touchdownsDefense": null,
    // "kickReturnsLong": null,
    // "kickingFgLong": null,
    // "puntingAverageYards": null,
    // "puntingLong": null,
    // "rushingAverageYards": null,
    // "kickoffReturnsTouchdowns": null,
    // "kickoffReturnsYards": null,
    // "puntReturnsLong": null,
    // "opponentFumbleRecovery": null,
    // "totalPointsScored": null,
    // "kickReturnsAverageYards": null,
    // "puntReturnsAverageYards": null,
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

  // parsedData = await this.teamStats(data, gameData.game)

  async teamStats(data, gameData) {
    //TODO: ADD NFL DATA AS WELL
    const { opponentGameStats, teamGameStats } = data
    const home = teamGameStats
    const away = opponentGameStats
    const awayStats = {
      interceptions: home.passingInterceptions,
      fumbles_recovered: home.fumblesLost,
      points_against: home.totalPointsScored,
      sacks: home.passingSacked,
    }

    const homeStats = {
      interceptions: away.passingInterceptions,
      fumbles_recovered: away.fumblesLost,
      points_against: away.totalPointsScored,
      sacks: away.passingSacked,
    }
    const { away_abv, home_abv } = gameData
    console.log({ [away_abv]: awayStats, [home_abv]: homeStats })
    return { [away_abv]: awayStats, [home_abv]: homeStats }
  },
}
