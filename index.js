const funcs = require('./funcs')
const man = () => {
  console.log(`
  ARGUMENT [OPTIONS]

  players [all | teamslug]
    ex: players pittsburgh-steelers
    team slug retrieved from nfl.com teams page url: nfl.com/teams/[team-slug]

  week [week year type] 
    ex: week 1 2020 
    omitted args default to current week/year/type
  `)
  return
}

const args = process.argv.splice(3)
switch (process.argv['2']) {
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
  case 'week':
    //TODO: CREATE METHOD TO GET CURRENT WEEK DATA FROM BACKEND
    const currentWeek = { week: 1, year: 2020, type: 'REG' }
    const seasonData = {
      week: args['0'] || currentWeek.week,
      year: args['1'] || currentWeek.year,
      type: args['2'] || currentWeek.type,
    }
    funcs.gameDataWeek(seasonData)
    break

  default:
    console.log('Missing or Unknown Argument')
    man()
    break
}
return
