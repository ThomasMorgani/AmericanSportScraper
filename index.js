const funcs = require('./funcs')
if (process.argv.length < 3) {
  console.log(`
  Expected Argument
  ========
  -game TBD
  -players [all | teamslug]
    ex: players pittsburgh-steelers
    team slug retrieved from nfl.com team page url: nfl.com/teams/[team-slug]
  -week [week year type] 
    ex: week 1 2020 
    omitted args default to current week/year/type
  `)
  return
}
switch (process.argv['2']) {
  case 'week':
    const args = process.argv.splice(3)
    //TODO: CREATE METHOD TO GET CURRENT WEEK DATA
    const currentWeek = { week: 1, year: 2020, type: 'REG' }
    const seasonData = {
      week: args['0'] || currentWeek.week,
      year: args['1'] || currentWeek.year,
      type: args['2'] || currentWeek.type,
    }
    funcs.gameDataWeek(seasonData)
    break

  default:
    console.log('Expected Argument')
    break
}
return
