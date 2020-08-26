module.exports = {
  async scheduleUrls() {
    //nfl-c-matchup-strip__game-info
    //gametime, networks
    const results = []
    let games = document.querySelectorAll('.nfl-c-matchup-strip__left-area')
    games.forEach(game => {
      let gameData = {}
      gameData.gameUrl = game.getAttribute('href')
      Object.values(gameData).forEach(game => {})
      results.push(gameData)
    })
    return results
  },
}
