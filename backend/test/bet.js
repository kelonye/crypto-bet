const truffleAssert = require("truffle-assertions")
const Bet = artifacts.require("BetTestHelper")
const Dai = artifacts.require("Dai")

const NO_OF_TOKENS = 10
const FIRST_DAY = Math.round(new Date().getTime() / 1000 - 100)

contract("BetTestHelper", (accounts) => {
  const DayState = {
    BET: 0,
    DRAWING: 1,
    PAYOUT: 2,
    INVALID: 3,
  }
  let contest

  before(async () => {
    const day = 60 * 60 * 24

    dai = await Dai.new("DAI", "DAI")

    contest = await Bet.new(
      FIRST_DAY,
      day,
      dai.address,
      new Array(NO_OF_TOKENS).fill("0x0853E36EeAd0eAA08D61E94237168696383869DD")
    )
  })

  describe("Concatenate uint8 into uint16: ", () => {
    it("should concat 0xff 0xee", async () => {
      const result = await contest.u8ConcatPub.call(
        web3.utils.hexToBytes("0xff"),
        web3.utils.hexToBytes("0xee")
      )
      assert.equal(web3.utils.toHex(result), "0xffee")
    })
    it("should concat 0x00 0xee", async () => {
      const result = await contest.u8ConcatPub.call(
        web3.utils.hexToBytes("0x00"),
        web3.utils.hexToBytes("0xee")
      )
      assert.equal(web3.utils.toHex(result), 0xee)
    })
    it("should concat 0xff 0x00", async () => {
      const result = await contest.u8ConcatPub.call(
        web3.utils.hexToBytes("0xff"),
        web3.utils.hexToBytes("0x00")
      )
      assert.equal(web3.utils.toHex(result), "0xff00")
    })
  })

  describe("Rank int128 array: ", () => {
    it("should rank [3, 0, 15, 5, 6, 8, 6, 1]", async () => {
      const result = await contest.rankPub.call([3, 0, 15, 5, 6, 8, 6, 1])
      const expected = [2, 5, 6, 4, 3, 0, 7, 1]
      var i
      for (i = 0; i < result.length; i++) {
        assert.equal(web3.utils.toHex(result[i]), expected[i])
      }
    })
    it("should rank [1, 4, 16, 12, 0, 7, 3]", async () => {
      const result = await contest.rankPub.call([1, 4, 16, 12, 0, 7, 3])
      const expected = [2, 3, 5, 1, 6, 0, 4]
      var i
      for (i = 0; i < result.length; i++) {
        assert.equal(web3.utils.toHex(result[i]), expected[i])
      }
    })
  })

  describe("Get day states: ", () => {
    const day0 = Math.round(new Date().getTime() / 1000)
    const now0 = day0 + 2 * 60 * 60
    const now1 = day0 + 26 * 60 * 60

    it("should get day state BET because its today", async () => {
      await contest.setTimestamp(now0, {
        from: accounts[1],
      })
      const result = await contest.getDayState.call(0)
      assert.equal(result.toNumber(), DayState.BET)
    })
    it("should get day state PAYOUT because (for yesterday and no bets)", async () => {
      await contest.setTimestamp(now1, {
        from: accounts[1],
      })
      const result = await contest.getDayState.call(0)
      assert.equal(result.toNumber(), DayState.PAYOUT)
    })
    it("should get day state INVALID because is for tomorrow", async () => {
      await contest.setTimestamp(now0, {
        from: accounts[1],
      })
      const result = await contest.getDayState.call(1)
      assert.equal(result.toNumber(), DayState.INVALID)
    })
  })

  describe("Cron: ", () => {
    it("Should set latest price", async () => {
      await contest.setTimestamp(FIRST_DAY, {
        from: accounts[1],
      })
      let result = await contest.getDayRankingFromChainlink.call(0)
      assert.equal(result["0"].length, 0)
      //
      await contest.setLatestTokenPrice(1, {
        from: accounts[1],
      })
      await contest.saveCurrentDayRankingFromChainlink({
        from: accounts[1],
      })
      //
      await contest.setLatestTokenPrice(3, {
        from: accounts[1],
      })
      await contest.saveCurrentDayRankingFromChainlink({
        from: accounts[1],
      })
      //
      result = await contest.getDayRankingFromChainlink.call(0)
      assert.equal(result["0"][0].toNumber(), 200)
      assert.equal(result["1"][0].toNumber(), 0)
      assert.equal(result["1"][1].toNumber(), 1)
    })
  })

  describe("Place bets: ", () => {
    const day0 = Math.round(new Date().getTime() / 1000)
    const now1 = day0 + 26 * 60 * 60
    const now2 = day0 + 52 * 60 * 60
    const now3 = day0 + 74 * 60 * 60

    it("Should set timestamp to now", async () => {
      await contest.setTimestamp(day0, {
        from: accounts[1],
      })
      const result = await contest.getTimestamp.call()
      assert.equal(day0, result)
    })
    it("should read that there is no bet", async () => {
      const result = await contest.getTotalAmountTokenDay.call(0, 0)
      assert.equal(result, web3.utils.toWei("0", "ether"))
    })
    it("should be able to place bet", async () => {
      await [accounts[1], accounts[2]].map((account) => {
        // account 1 has 15 mil dai
        // send half to account 2
        return dai.transfer(account, web3.utils.toWei("5000000", "wei"))
      })
      await [accounts[0], accounts[1], accounts[2]].map(async (account) => {
        return dai.approve(
          contest.address,
          web3.utils.toWei("5000000", "wei"),
          {
            from: account,
          }
        )
      })

      assert.equal(
        (await dai.balanceOf(accounts[0])).toNumber(),
        web3.utils.toWei("5000000", "wei")
      )
      assert.equal(
        (await dai.allowance(accounts[0], contest.address)).toNumber(),
        web3.utils.toWei("5000000", "wei")
      )
      await contest.placeBet(0, web3.utils.toWei("1000", "wei"), {
        from: accounts[0],
      })
      assert.equal(
        (await dai.balanceOf(accounts[0])).toNumber(),
        web3.utils.toWei("4999000", "wei")
      )
    })
    it("should be revert due to place bet with 0 value", async () => {
      await truffleAssert.reverts(
        contest.placeBet(0, web3.utils.toWei("0", "wei"), {
          from: accounts[0],
        }),
        "Should insert a positive amount"
      )
    })
    it("should read the total amount of previous bet", async () => {
      const result = await contest.getTotalAmountTokenDay.call(0, 0)
      assert.equal(result.toNumber(), web3.utils.toWei("1000", "wei"))
    })
    it("should be able to place a second bet", async () => {
      await contest.placeBet(1, web3.utils.toWei("1000", "wei"), {
        from: accounts[0],
      })
    })
    it("should read the total amount of the day", async () => {
      const result = await contest.getDayGrandPrize.call(0)
      assert.equal(result.toNumber(), web3.utils.toWei("2000", "wei"))
    })
    it("should read my total bets of the day", async () => {
      const result = await contest.getMyBetsDay.call(0)
      assert.equal(result[0], web3.utils.toWei("1000", "wei"))
      assert.equal(result[1], web3.utils.toWei("1000", "wei"))
      assert.equal(result[6], web3.utils.toWei("0", "wei"))
    })
    it("should be able to place a third bet from another address", async () => {
      await contest.placeBet(6, web3.utils.toWei("1000", "wei"), {
        from: accounts[1],
      })
    })
    it("should read bets from another address", async () => {
      const result = await contest.getMyBetsDay.call(0, {from: accounts[1]})
      assert.equal(result[0], web3.utils.toWei("0", "wei"))
      assert.equal(result[1], web3.utils.toWei("0", "wei"))
      assert.equal(result[6], web3.utils.toWei("1000", "wei"))
    })
    it("should get day state DRAWING because (for yesterday and we have bets)", async () => {
      await contest.setTimestamp(now1, {
        from: accounts[1],
      })
      const result = await contest.getDayState.call(0)
      assert.equal(result.toNumber(), DayState.DRAWING)
    })
    it("should be able to place a bet in the second day", async () => {
      await contest.placeBet(6, web3.utils.toWei("1000", "wei"), {
        from: accounts[1],
      })
    })
    it("should be able to place a second bet in the second day", async () => {
      await contest.placeBet(3, web3.utils.toWei("1000", "wei"), {
        from: accounts[2],
      })
    })
    // it("should revert due to bet are not in RESOLVE state", async () => {
    //   await truffleAssert.reverts(
    //     contest.resolve(0, {
    //       from: accounts[0],
    //       value: 2,
    //     }),
    //     "Should be in RESOLVE state"
    //   )
    // })
    it("should get day state PAYOUT because (for 2 days ago with bets)", async () => {
      await contest.setTimestamp(now2, {
        from: accounts[1],
      })
      const result = await contest.getDayState.call(0)
      assert.equal(result.toNumber(), DayState.PAYOUT)
    })
    //   it("should revert due to have not enough value to resolve the data request", async () => {
    //     await contest.setTimestamp(now2, {
    //       from: accounts[1],
    //     })
    //     await truffleAssert.reverts(
    //       contest.resolve(0, {
    //         from: accounts[0],
    //         value: 0,
    //       }),
    //       "Not enough value to resolve the data request"
    //     )
    //   })
    // it("should revert due to bet are not in PAYOUT state", async () => {
    //   await truffleAssert.reverts(
    //     contest.payout(0, {
    //       from: accounts[0],
    //     }),
    //     "Should be in PAYOUT state"
    //   )
    // })
    //   it("should get day state WAIT_RESULT after calling resolve)", async () => {
    //     await contest.setTimestamp(now2, {
    //       from: accounts[1],
    //     })
    //     await = contest.resolve(0, {
    //       from: accounts[1],
    //       value: 2,
    //     })
    //     const result = await contest.getDayState.call(0, {
    //       from: accounts[1],
    //     })
    //     assert.equal(result.toNumber(), DayState.WAIT_RESULT)
    //   })

    it("should call payout with succesful result and refund winnet", async () => {
      let balanceBefore = await dai.balanceOf(contest.address)

      await contest.payout(0, {
        from: accounts[0],
      })

      let balanceAfter = await dai.balanceOf(contest.address)
      assert.equal(parseInt(balanceAfter), parseInt(balanceBefore) - 3000)
    })
    it("should revert because contestant already paid", async () => {
      await truffleAssert.reverts(
        contest.payout(0, {
          from: accounts[0],
        }),
        "Address already paid"
      )
    })
    it("should revert because contestant has no bets in the winning token", async () => {
      await truffleAssert.reverts(
        contest.payout(0, {
          from: accounts[2],
        }),
        "Address has no bets in the winning token"
      )
    })
    it("should get day state PAYOUT on second day", async () => {
      await contest.setTimestamp(now3, {
        from: accounts[1],
      })
      const result = await contest.getDayState.call(1, {
        from: accounts[1],
      })
      assert.equal(result.toNumber(), DayState.PAYOUT)
    })

    it("should refund if no results were recorded", async () => {
      const balanceBefore = await dai.balanceOf(contest.address)
      await contest.payout(1, {
        from: accounts[1],
      })

      const balanceAfter = await dai.balanceOf(contest.address)
      assert.equal(parseInt(balanceAfter), parseInt(balanceBefore) - 1000)
    })
  })
})
