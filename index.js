const db = require('./db')
const funcs = require('./funcs')
const man = () => {
  console.log(`
  ARGUMENT [OPTIONS]

  game [gameSlug (required)]
    ex: texans-at-chiefs-2020-reg-1

  players [all | teamslug]
    ex: players pittsburgh-steelers
    team slug retrieved from nfl.com teams page url: nfl.com/teams/[team-slug]

  teams [year]
    ex: teams 2020

  week [week year type] 
    ex: week 1 2020 
    omitted args default to current week/year/type
  `)
  return
}
//ARGUMENTS PASSED TO SCRIPT AT RUN
const args = process.argv.splice(3)
//DEFAULT WEEK DATA
const currentWeek = { week: 1, year: 2020, type: 'REG' }

switch (process.argv['2']) {
  case 'game':
    if (!args['0']) {
      console.log('game slug required')
      man()
      return
    }
    const gameData = funcs.gameDataGame(args['0'])
    db.save(gameData, args['0'])

    break
  case 'players':
    if (!args['0']) {
      console.log(`
      Expected an option to be provided
      -players [all | teamslug]
        ex: players pittsburgh-steelers
        team slug retrieved from nfl.com team page url: nfl.com/teams/[team-slug]
      `)
      break
    }
    if (args['0'] === 'all') {
      funcs.playerDataLeague()
    } else {
      funcs.playerDataRoster(args['0'])
    }
    break
  case 'teams':
    funcs.teamDataLeague({
      week: currentWeek.week,
      year: args['0'] || currentWeek.year,
      type: currentWeek.type,
    })
    break

  case 'week':
    //TODO: CREATE METHOD TO GET CURRENT WEEK DATA FROM BACKEND
    funcs.gameDataWeek({
      week: args['0'] || currentWeek.week,
      year: args['1'] || currentWeek.year,
      type: args['2'] || currentWeek.type,
    })
    break

  default:
    console.log('Missing or Unknown Argument')
    man()
    break
}
return
