const utils = require('./utils.js')
module.exports = {
  /*

    METHODS FOR PARSING SCRAPED DATA

  */
  async gameDataset(name, data, gameData) {
    let parsedData = {}
    // console.log(name)
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
        // return //disabled for now
        return data.map(player => this.playerStats(player, gameData))
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
      season_type: week.seasonType,
      season_value: week.seasonValue,
      season_year: week.seasonValue,
      slug: rawData.slug, //'titans-at-browns-2019-reg-1',
      start_time: rawData.gameTime, //2019-09-08T17:00:00.000Z
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
      game_id: gameData.game_id || 'xx',
      // gameDetailId: rawData.id,
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
      weather: rawData?.weather?.shortDescription || '', //{
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
      // console.log('viewer---')
      // console.log(json)
      // console.log(viewer)

      //teamStats
      if (viewer.stats && viewer.stats.teamGameStats && viewer.stats.teamGameStats.edges && viewer.stats.teamGameStats.edges['0'] && viewer.stats.teamGameStats.edges['0'].node) {
        return { teamStats: viewer.stats.teamGameStats.edges['0'].node }
      }
      //playerStats //playerGameStats includes much more data.
      //TODO: monitor to ensure we can rely on playerGameStats
      if (viewer?.live?.playerGameStats) {
        // console.log(viewer.live.playerGameStats)
        return { playerStats: viewer.live.playerGameStats }
      }
      //playerGameStats
      if (viewer.playerGameStats && viewer.playerGameStats.edges) {
        const pos = ['QB', 'RB', 'FB', 'HB', 'TE', 'WR', 'K']
        //NOTE: !!! WE MAY NEED TO DO THE PLAYER FILTERING ELSEWHERE
        //OR AFTER DETERMINING TEAM STATS
        //AS OF NOW IT APPEARS THE ONLY WAY TO DETERMINE DST TOUCHDOWNS
        //IS TO FIND THEM FROM INDIVIDUAL PLAYER STATS
        //TODO: CONFIRM THIS
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
    console.log('========  END ==========')
    return data
  },
  player(rawData, team = '') {
    //TODO: DETERMINE HOW TO ADD PLAYER TEAM AND GET OR GENERATE A UNIQUE ID
    //SEE NOTES file

    const name = rawData.name.split(' ')
    const nameAbv = `${name['0'].substring(0, 1)}. ${name[name.length - 1]}`
    const player = {
      abv_name: nameAbv,
      first_name: name['0'],
      full_name: name['0'] + ' ' + name['1'],
      headshot: rawData.headshot,
      pid: '',
      player_id: '',
      last_name: name[name.length - 1],
      position: rawData.pos,
      team: team,
      number: rawData.number || '',
      status: rawData.status || '',
      height: rawData.height || '',
      weight: rawData.weight || '',
      birthdate: rawData.birthdate || '',
      experience: rawData.experience || '',
      college: rawData.college || '',
    }

    const playerId = utils.playerIdHash({
      firstName: player.first_name,
      lastName: player.last_name,
      position: player.position,
      team: team, //TEAM APPEARS TO BE nickName ALL LOWERCASE
    })

    player.pid = playerId || 'Err'
    player.player_id = playerId || 'Err'
    return player
  },
  playerStats(rawData, gameData) {
    // console.log(rawData)
    const { id, game, gameStats, player, season, week } = rawData
    //LIVE AND PAST DATA FORMAT DIFFER
    //LIVE DATA DOES NOT PROVIDE GAME ID
    //IF ONE IS NOT PROVIDED FROM GAME DATA IT IS HANDLED SERVER SIDE TO LOOKUP BY TEAM/WEEK
    //MAP STATS TO EXISTING PLAYER_PLAY STRUCTURE
    //ADDITIONAL AVAILABLE SLOTS AT END OF METHOD
    // console.log(game)
    // console.log(gameData)
    let game_id = ''
    if (game) {
      game_id = game.id
    } else if (gameData?.game?.id) {
      game_id = gameData.game.id
    } else {
      game_id = ''
    }
    let team = ''
    if (rawData.team) {
      team = rawData.team.nickName
    } else if (player?.currentTeam?.nickName) {
      team = player.currentTeam.nickName
    } else {
      //??
    }

    //TODO: PLAYER

    //TODO: IMPORTANT!! LIVE DATA DOESNT INCLUDE JERSEY#
    //CHANGE ID GENERATOR? firt, last, position, team
    //TODO: PREFIX ID IF DST?
    if (Array.isArray(player)) player = player['0']
    // console.log('=============')
    // console.log(player)
    if (player) {
      if (player?.person?.firstName) {
        player.firstName = player.person.firstName
      } else {
        player.firstName = player.firstName || 'UNK'
      }
      if (player?.person?.lastName) {
        player.lastName = player.person.lastName
      } else {
        player.lastName = player.lastName || 'UNK'
      }
    }

    // console.log(player)

    const playerId = utils.playerIdHash({
      firstName: player.firstName || 'UNK',
      lastName: player.lastName || 'UNK',
      position: player.position || '',
      // team: team.abbreviation, //WHEN SCRAPING PLAYERS FROM ROSTERS, ONLY LOWERCASE TEAM NICKNAME SEEMS TO BE PROVIDED
      team: team.toLowerCase() || 'UNK',
    })
    if (player.lastName === 'Thompson') {
      console.log(player)
      console.log(playerId)
      console.log(team)
      console.log(rawData)
    }
    //TODO: ANALYZE DATA LAYOUT, WHAT TO KEEP/REMOVE
    //COMBINE PLAYER & DST STATS?
    // console.log(rawData)
    const stats = {
      game_id: game_id || 0,
      play_id: id || 0,
      player_id: playerId || 'ERR',
      team: team || 0,
      season_id: season?.id || 0,
      week_id: week?.id || 0,
      defense_ast: gameStats.defensiveAssists || 0,
      defense_ffum: gameStats.defensiveForcedFumble || 0,
      defense_fgblk: gameStats.xxxx || 0,
      defense_frec: gameStats.xxxx || 0,
      defense_frec_tds: gameStats.xxxx || 0,
      defense_frec_yds: gameStats.xxxx || 0,
      defense_int: gameStats.defensiveInterceptions || 0,
      defense_int_tds: gameStats.xxxx || 0,
      defense_int_yds: gameStats.defensiveInterceptionsYards || 0,
      defense_misc_tds: gameStats.xxxx || 0,
      defense_misc_yds: gameStats.xxxx || 0,
      defense_pass_def: gameStats.defensivePassesDefensed || 0,
      defense_puntblk: gameStats.xxxx || 0,
      defense_qbhit: gameStats.xxxx || 0,
      defense_safe: gameStats.defensiveSafeties || 0,
      defense_sk: gameStats.defensiveSacks || 0,
      defense_sk_yds: gameStats.xxxx || 0,
      defense_tkl: gameStats.defensiveTotalTackles || 0,
      defense_tkl_loss: gameStats.defensiveTacklesForALoss || 0,
      defense_tkl_loss_yds: gameStats.xxxx || 0,
      defense_tkl_primary: gameStats.xxxx || 0,
      defense_xpblk: gameStats.xxxx || 0,
      fumbles_forced: gameStats.xxxx || 0,
      fumbles_lost: gameStats.fumblesLost || 0,
      fumbles_notforced: gameStats.xxxx || 0,
      fumbles_oob: gameStats.xxxx || 0,
      fumbles_rec: gameStats.xxxx || 0,
      fumbles_rec_tds: gameStats.xxxx || 0,
      fumbles_rec_yds: gameStats.xxxx || 0,
      fumbles_tot: gameStats.fumblesTotal || 0,
      kicking_all_yds: gameStats.xxxx || 0,
      kicking_downed: gameStats.xxxx || 0,
      kicking_fga: gameStats.kickingFgAtt || 0,
      kicking_fgb: gameStats.xxxx || 0,
      kicking_fgm: gameStats.kickingFgMade || 0,
      kicking_fgm_yds: gameStats.xxxx || 0,
      kicking_fgmissed: gameStats.xxxx || 0,
      kicking_fgmissed_yds: gameStats.xxxx || 0,
      kicking_i20: gameStats.xxxx || 0,
      kicking_rec: gameStats.xxxx || 0,
      kicking_rec_tds: gameStats.xxxx || 0,
      kicking_tot: gameStats.xxxx || 0,
      kicking_touchback: gameStats.xxxx || 0,
      kicking_xpa: gameStats.kickingXkAtt || 0,
      kicking_xpb: gameStats.xxxx || 0,
      kicking_xpmade: gameStats.kickingXkMade || 0,
      kicking_xpmissed: gameStats.xxxx || 0,
      kicking_yds: gameStats.xxxx || 0,
      kickret_fair: gameStats.xxxx || 0,
      kickret_oob: gameStats.xxxx || 0,
      kickret_ret: gameStats.kickReturns || 0,
      kickret_tds: gameStats.kickReturnsTouchdowns || 0,
      kickret_touchback: gameStats.xxxx || 0,
      kickret_yds: gameStats.kickReturnsYards || 0,
      passing_att: gameStats.passingAttempts || 0,
      passing_cmp: gameStats.passingCompletions || 0,
      passing_cmp_air_yds: gameStats.xxxx || 0,
      passing_incmp: gameStats.xxxx || 0,
      passing_incmp_air_yds: gameStats.xxxx || 0,
      passing_int: gameStats.passingInterceptions || 0,
      passing_sk: gameStats.xxxx || 0,
      passing_sk_yds: gameStats.xxxx || 0,
      passing_tds: gameStats.passingTouchdowns || 0,
      passing_twopta: gameStats.xxxx || 0,
      passing_twoptm: gameStats.xxxx || 0,
      passing_twoptmissed: gameStats.xxxx || 0,
      passing_yds: gameStats.passingYards || 0,
      punting_blk: gameStats.xxxx || 0,
      punting_i20: gameStats.puntingPuntsInside20 || 0,
      punting_tot: gameStats.puntingPunts || 0,
      punting_touchback: gameStats.xxxx || 0,
      punting_yds: gameStats.xxxx || 0,
      puntret_downed: gameStats.xxxx || 0,
      puntret_fair: gameStats.xxxx || 0,
      puntret_oob: gameStats.xxxx || 0,
      puntret_tds: gameStats.puntReturnsTouchdowns || 0,
      puntret_tot: gameStats.puntReturns || 0,
      puntret_touchback: gameStats.xxxx || 0,
      puntret_yds: gameStats.xxxx || 0,
      receiving_rec: gameStats.receivingReceptions || 0,
      receiving_tar: gameStats.receivingTarget || 0,
      receiving_tds: gameStats.receivingTouchdowns || 0,
      receiving_twopta: gameStats.xxxx || 0,
      receiving_twoptm: gameStats.xxxx || 0,
      receiving_twoptmissed: gameStats.xxxx || 0,
      receiving_yac_yds: gameStats.xxxx || 0,
      receiving_yds: gameStats.receivingYards || 0,
      rushing_att: gameStats.rushingAttempts || 0,
      rushing_loss: gameStats.xxxx || 0,
      rushing_loss_yds: gameStats.xxxx || 0,
      rushing_tds: gameStats.rushingTouchdowns || 0,
      rushing_twopta: gameStats.xxxx || 0,
      rushing_twoptm: gameStats.xxxx || 0,
      rushing_twoptmissed: gameStats.xxxx || 0,
      rushing_yds: gameStats.rushingYards || 0,
    }
    // console.log(stats)
    if (stats.player_id === '636872697374686f6d70736f6e52426a616775617273') {
      console.log(stats)
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
  team(team) {
    const name = team.fullName.split(' ')
    return {
      abbreviation: team.abbreviation,
      cityStateRegion: team.cityStateRegion,
      first_name: name['0'],
      full_name: team.fullName,
      id: team.id,
      last_name: name['1'],
      nickName: team.nickName,
      slug: team?.franchise?.slug || '',
    }
  },
  teamnameFromSlug(slug) {
    const segments = slug.split('-')
    const name = segments[segments.length - 1]
    //account for washington team (washington-football-team)
    return name === 'team' ? 'washington' : name
  },
  teams(data) {
    //PARSES TEAMS RECEIVED FROM 'GAME' RESPONSE
    //TODO: VALIDATION
    const teams = []
    if (data?.edges) {
      data = data.edges.map(i => i.node)
    }
    if (data?.data?.viewer?.game) {
      const game = data.data.viewer.game
      data = [game.awayTeam, game.homeTeam]
    }
    data.forEach(team => teams.push(this.team(team)))
    return teams
  },
  teamSlug(slug) {
    console.log(slug)
    if (!slug) return
    // /teams/baltimore-ravens/
    const split = slug.split('/')

    return split.filter(str => str.includes('-'))['0']
  },
  async teamStats(data, gameData) {
    //TODO: ADD NFL DATA AS WELL
    //MOST LIKELY NEED TO CREATE SEPERATE FUNCTION FOR PARSING
    //NFL TEAM DATA AS WELL AS DST SCORING DATA
    const { opponentGameStats, teamGameStats } = data
    const home = teamGameStats
    const away = opponentGameStats
    const awayStats = {
      defense_int: home.passingInterceptions,
      defense_frec: home.fumblesLost,
      points_against: home.totalPointsScored,
      defense_sk: home.passingSacked,
    }

    const homeStats = {
      defense_int: away.passingInterceptions,
      defense_frec: away.fumblesLost,
      points_against: away.totalPointsScored,
      defense_sk: away.passingSacked,
    }
    const { away_abv, home_abv } = gameData
    // console.log({ [away_abv]: awayStats, [home_abv]: homeStats })
    return { [away_abv]: awayStats, [home_abv]: homeStats }
  },
}
