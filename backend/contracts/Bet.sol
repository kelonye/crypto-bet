pragma solidity >=0.6.0 <0.7.0;
// pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";
import "./Dai.sol";

// Adapted from https://github.com/stampery-labs/witnet-tokenprice-example-contracts/blob/master/contracts/TokenPriceContest.sol
contract Bet {
    using SignedSafeMath for int256;
    using SafeMath for uint256;
    using SafeMath for uint8;

    // Chainlink token refs
    AggregatorInterface[] internal chainlinkTokenRefs;

    // DAI token ref
    IDai internal dai;

    // Event emitted when a bet is placed by a contest participant
    event BetPlaced(uint8 day, uint8 tokenId, address sender, uint256 value);

    // Timestamp (as seconds since unix epoch) from which the constest starts counting (to enable certain operations)
    uint256 public firstDay;

    // Time period for each contest
    uint256 public contestPeriod;

    // States define the action allowed in the current contest window
    enum DayState {BET, DRAWING, PAYOUT, INVALID}

    // Structure with token participations in a contest period (e.g. day)
    struct TokenDay {
        uint256 totalAmount;
        mapping(address => uint256) participations;
        mapping(address => bool) paid;
        int256 startPrice;
        int256 endPrice;
    }

    // Mapping of token participations
    // Key: `uint16` contains two uint8 refering to day||TokenId
    mapping(uint16 => TokenDay) bets;

    // Structure with all the current bets information in a contest period (e.g. day)
    struct DayInfo {
        // total prize for a day
        uint256 grandPrize;
        // token perfs percentages
        int256[] perfs;
        // ordered ranking after result has been resolved
        uint8[] ranking;
    }

    // Mapping of day infos
    mapping(uint8 => DayInfo) dayInfos;

    /// @dev Creates a Token Prize Contest
    /// @param _firstDay timestamp of contest start time
    /// @param _contestPeriod time period (in seconds) of each contest window (e.g. a day)
    constructor(
        uint256 _firstDay,
        uint256 _contestPeriod,
        address _dai,
        address[] memory _chainlinkTokenAddresses
    ) public {
        firstDay = _firstDay;
        contestPeriod = _contestPeriod;
        dai = IDai(_dai);

        chainlinkTokenRefs = new AggregatorInterface[](
            _chainlinkTokenAddresses.length
        );
        for (uint8 i = 0; i < _chainlinkTokenAddresses.length; i++) {
            chainlinkTokenRefs[i] = AggregatorInterface(
                _chainlinkTokenAddresses[i]
            );
        }
    }

    /// @dev Places a bet on a token identifier
    /// @param _tokenId token identifier
    function placeBet(uint8 _tokenId, uint256 amt) public {
        require(
            _tokenId < chainlinkTokenRefs.length,
            "Should insert a valid token identifier"
        );
        require(amt > 0, "Should insert a positive amount");
        require(
            dai.balanceOf(msg.sender) >= amt &&
                dai.allowance(msg.sender, address(this)) >= amt,
            "Should have enough dai"
        );
        dai.transferFrom(msg.sender, address(this), amt);

        // Calculate the day of the current bet
        uint8 betDay = getCurrentDay();
        // Create Bet: u8Concat
        uint16 betId = u8Concat(betDay, _tokenId);

        // Upsert Bets mapping (day||tokenId) with TokenDay
        bets[betId].totalAmount += amt;
        bets[betId].participations[msg.sender] += amt;
        bets[betId].paid[msg.sender] = false;

        // Upsert DayInfo (day)
        dayInfos[betDay].grandPrize += amt;

        emit BetPlaced(betDay, _tokenId, msg.sender, amt);
    }

    /// @dev Pays out upon data request resolution (i.e. state should be `PAYOUT`)
    /// @param _day contest day of the payout
    function payout(uint8 _day) public payable {
        require(
            getDayState(_day) == DayState.PAYOUT,
            "Should be in PAYOUT state"
        );

        // Result not okay, payout participations
        if (!getDayHasResults(_day)) {
            uint16 offset = u8Concat(_day, 0);
            for (uint16 i = 0; i < chainlinkTokenRefs.length; i++) {
                if (
                    bets[i + offset].paid[msg.sender] == false &&
                    bets[i + offset].participations[msg.sender] > 0
                ) {
                    bets[i + offset].paid[msg.sender] = true;
                    dai.transfer(
                        msg.sender,
                        bets[i + offset].participations[msg.sender]
                    );
                }
            }
        } else {
            // Result is Ok (payout to winners)
            // Check legit payout
            uint16 dayTokenId = u8Concat(_day, dayInfos[_day].ranking[0]);
            require(
                bets[dayTokenId].paid[msg.sender] == false,
                "Address already paid"
            );
            require(
                bets[dayTokenId].participations[msg.sender] > 0,
                "Address has no bets in the winning token"
            );
            // Prize calculation
            uint256 grandPrize = dayInfos[_day].grandPrize;
            uint256 winnerAmount = bets[dayTokenId].totalAmount;
            uint256 prize = (bets[dayTokenId].participations[msg.sender] *
                grandPrize) / winnerAmount;
            // Set paid flag and Transfer
            bets[dayTokenId].paid[msg.sender] = true;
            dai.transfer(msg.sender, prize);
        }
    }

    /// @dev Gets the timestamp of the current block as seconds since unix epoch
    /// @return timestamp
    function getTimestamp() public virtual returns (uint256) {
        return block.timestamp;
    }

    function getDayRanking(uint8 _day) public view returns (uint8[] memory) {
        return dayInfos[_day].ranking;
    }

    function getDayPerfs(uint8 _day) public view returns (int256[] memory) {
        return dayInfos[_day].perfs;
    }

    function saveCurrentDayRankingFromChainlink() public {
        uint8 betDay = getCurrentDay() - 1;
        for (uint8 i = 0; i < chainlinkTokenRefs.length; i++) {
            uint16 betId = u8Concat(betDay, i);
            int256 latest = getLatestTokenPrice(i);
            if (bets[betId].startPrice == 0) {
                bets[betId].startPrice = latest;
            } else {
                bets[betId].endPrice = latest;
            }
        }

        int256[] memory requestResult = new int256[](chainlinkTokenRefs.length);
        for (uint8 i = 0; i < chainlinkTokenRefs.length; i++) {
            uint16 betId = u8Concat(betDay, i);
            TokenDay memory bet = bets[betId];
            int256 perf = 0;
            if (bet.startPrice != 0 && bet.endPrice != 0) {
                perf = ((bet.endPrice.sub(bet.startPrice)).mul(1000000)).div(
                    bet.startPrice
                );
            }
            requestResult[i] = perf;
        }

        dayInfos[betDay].perfs = requestResult;
        dayInfos[betDay].ranking = rank(requestResult);
    }

    function getLatestTokenPrice(uint256 tokenId)
        public
        virtual
        returns (int256)
    {
        AggregatorInterface ref = chainlinkTokenRefs[tokenId];
        return ref.latestAnswer();
    }

    function getDayTokenPrices(uint8 _day, uint8 _tokenId)
        public
        virtual
        returns (int256, int256)
    {
        uint16 betId = u8Concat(_day, _tokenId);
        return (bets[betId].startPrice, bets[betId].endPrice);
    }

    /// @dev Gets a contest day state
    /// @param _day contest day
    /// @return day state
    function getDayState(uint8 _day) public returns (DayState) {
        uint8 currentDay = getCurrentDay();
        if (_day == currentDay) {
            return DayState.BET;
        } else if (_day > currentDay) {
            // Bet in the future
            return DayState.INVALID;
        } else if (_day == currentDay - 1) {
            // Drawing day
            return DayState.DRAWING;
        } else {
            // BetDay is in the past
            return DayState.PAYOUT;
        }
    }

    /// @dev Reads the total amount bet for a day and a token identifier
    /// @param _day contest day
    /// @param _tokenId token identifier
    /// @return total amount of bets
    function getTotalAmountTokenDay(uint8 _day, uint8 _tokenId)
        public
        view
        returns (uint256)
    {
        return bets[u8Concat(_day, _tokenId)].totalAmount;
    }

    /// @dev Reads the participations of the sender for a given day
    /// @param _day contest day
    /// @return array with the participations for each token
    function getMyBetsDay(uint8 _day) public view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](chainlinkTokenRefs.length);
        for (uint8 i = 0; i < chainlinkTokenRefs.length; i++) {
            results[i] = bets[u8Concat(_day, i)].participations[msg.sender];
        }
        return results;
    }

    function getMyDayWins(uint8 _day) public view returns (uint256) {
        uint256 amount;
        // Data request is not yet resolved or is still beeing resolved within Witnet
        if (!getDayHasResults(_day)) {
            return amount;
        }

        // Data request is already in WBI or in the contract
        uint8[] memory ranking = dayInfos[_day].ranking;

        // Empty ranking -> return back participations
        if (ranking.length == 0) {
            // Data request with ERROR -> return money to all participants
            uint16 offset = u8Concat(_day, 0);
            for (uint16 i = 0; i < chainlinkTokenRefs.length; i++) {
                if (
                    bets[i + offset].paid[msg.sender] == false &&
                    bets[i + offset].participations[msg.sender] > 0
                ) {
                    // bets[i+offset].paid[msg.sender] = true;
                    amount += bets[i + offset].participations[msg.sender];
                }
            }
            return amount;
        }

        // Ranking available -> compute prize for participant
        uint16 dayTokenId = u8Concat(_day, ranking[0]);
        // Already paid or not participated
        if (
            bets[dayTokenId].paid[msg.sender] ||
            bets[dayTokenId].participations[msg.sender] == 0
        ) {
            return amount;
        }
        // Prize calculation
        uint256 grandPrize = dayInfos[_day].grandPrize;
        uint256 winnerAmount = bets[dayTokenId].totalAmount;
        uint256 prize = (bets[dayTokenId].participations[msg.sender] *
            grandPrize) / winnerAmount;

        return prize;
    }

    function getMyDayPaid(uint8 _day) public returns (bool) {
        if (
            getDayState(_day) != DayState.PAYOUT ||
            dayInfos[_day].ranking.length == 0
        ) {
            return false;
        }
        uint8 tokenId = dayInfos[_day].ranking[0];
        uint16 betId = u8Concat(_day, tokenId);
        return bets[betId].paid[msg.sender];
    }

    /// @dev Reads day information
    /// @param _day contest day
    /// @return day info structure
    function getDayGrandPrize(uint8 _day) public view returns (uint256) {
        return dayInfos[_day].grandPrize;
    }

    /// @dev Read last block timestamp and calculate difference with firstDay timestamp
    /// @return index of current day
    function getCurrentDay() public returns (uint8) {
        uint256 timestamp = getTimestamp();
        uint256 daysDiff = (timestamp - firstDay) / contestPeriod;
        return uint8(daysDiff);
    }

    function getDayHasResults(uint8 _day) private view returns (bool) {
        uint16 betId = u8Concat(_day, 0);
        return bets[betId].endPrice != 0;
    }

    /// @dev Concatenates two `uint8`
    /// @param _l left component
    /// @param _r right component
    /// @return _l||_r
    function u8Concat(uint8 _l, uint8 _r) internal pure returns (uint16) {
        return (uint16(_l) << 8) | _r;
    }

    /// @dev Ranks a given input array
    /// @param input array to be ordered
    /// @return ordered array
    function rank(int256[] memory input)
        internal
        pure
        returns (uint8[] memory)
    {
        // Ranks the given input array
        uint8[] memory ranked = new uint8[](input.length);
        uint8[] memory result = new uint8[](input.length);

        for (uint8 i = 0; i < input.length; i++) {
            uint8 curRank = 0;
            for (uint8 j = 0; j < i; j++) {
                if (input[j] > input[i]) {
                    curRank++;
                } else {
                    ranked[j]++;
                }
            }
            ranked[i] = curRank;
        }

        for (uint8 i = 0; i < ranked.length; i++) {
            result[ranked[i]] = i;
        }
        return result;
    }
}
