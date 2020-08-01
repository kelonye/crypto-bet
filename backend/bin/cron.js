const cron = require("node-cron")
const {Web3, Contract} = require("./w")
const CONTRACT_JSON = require("../build/contracts/Bet.json")

cron.schedule("5,55 * * * *", async function () {
  // hourly: 0005, 0055, 0105, 0155 ...
  console.log("running at", new Date())

  try {
    const web3 = Web3()
    const [account] = await web3.eth.getAccounts()
    const contract = new Contract(web3, 4, CONTRACT_JSON, account)
    console.log(await contract.write("saveCurrentDayRankingFromChainlink"))
  } catch (e) {
    console.log(e)
  }
})
