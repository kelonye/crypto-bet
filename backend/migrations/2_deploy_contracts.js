const moment = require("moment")
const Bet = artifacts.require("Bet")
const Dai = artifacts.require("Dai")

const dai = {
  mainnet: "0x6b175474e89094c44da98b954eedeac495271d0f",
  rinkeby: "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea",
}

const tokens = {
  mainnet: [
    "0xF5fff180082d6017036B771bA883025c654BC935",
    "0xF79D6aFBb6dA890132F9D7c355e3015f15F3406F",
    "0x32dbd3214aC75223e27e575C53944307914F7a90",
  ],
  rinkeby: [
    "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
    "0x0bF4e7bf3e1f6D6Dc29AA516A33134985cC3A5aA",
    "0x0853E36EeAd0eAA08D61E94237168696383869DD",
  ],
}

module.exports = async function (deployer, network, [defaultAccount]) {
  network = network.split("-")[0]

  const firstDay = moment("2020-07-01").unix()
  const day = 60 * 60 * 24

  let daiAddress = dai[network]
  let tokenAddresses = tokens[network]

  if (!daiAddress) {
    await deployer.deploy(Dai, "DAI", "DAI")
    daiAddress = Dai.address
  }
  if (!tokenAddresses) {
    // todo
    tokenAddresses = new Array(tokens.mainnet.length).fill(
      "0x0853E36EeAd0eAA08D61E94237168696383869DD"
    )
  }

  deployer.deploy(Bet, firstDay, day, daiAddress, tokenAddresses)
}
