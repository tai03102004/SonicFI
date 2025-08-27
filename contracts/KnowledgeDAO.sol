// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract KnowledgeDAO is ReentrancyGuard, Ownable, Pausable {
    IERC20 public sToken;

    struct AIContent {
        uint256 id;
        string contentHash; // IPFS hash
        address aiAgent;
        uint256 timestamp;
        uint256 totalStaked;
        uint256 positiveVotes;
        uint256 negativeVotes;
        bool finalized;
        uint256 rewardPool;
    }

    struct Vote {
        uint256 amount;
        bool positive;
        uint256 timestamp;
        bool claimed;
    }

    struct UserStats {
        uint256 totalStaked;
        uint256 accuracyScore;
        uint256 totalRewards;
        uint256 votingPower;
    }

    mapping(uint256 => AIContent) public aiContents;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(address => UserStats) public userStats;
    mapping(address => bool) public authorizedAI;

    uint256 public contentCounter;
    uint256 public minStakeAmount = 100 * 10 ** 18; // 100 S tokens
    uint256 public votingPeriod = 24 hours;
    uint256 public rewardPercentage = 10; // 10% of total stake as rewards

    event ContentSubmitted(
        uint256 indexed contentId,
        address indexed aiAgent,
        string contentHash
    );
    event VoteCast(
        uint256 indexed contentId,
        address indexed voter,
        uint256 amount,
        bool positive
    );
    event RewardsClaimed(address indexed user, uint256 amount);
    event ContentFinalized(uint256 indexed contentId, bool approved);

    constructor(address _sToken) {
        sToken = IERC20(_sToken);
    }

    modifier onlyAuthorizedAI() {
        require(authorizedAI[msg.sender], "Not authorized AI agent");
        _;
    }

    function authorizeAI(address _aiAgent) external onlyOwner {
        authorizedAI[_aiAgent] = true;
    }

    function submitContent(
        string memory _contentHash
    ) external onlyAuthorizedAI whenNotPaused {
        contentCounter++;

        aiContents[contentCounter] = AIContent({
            id: contentCounter,
            contentHash: _contentHash,
            aiAgent: msg.sender,
            timestamp: block.timestamp,
            totalStaked: 0,
            positiveVotes: 0,
            negativeVotes: 0,
            finalized: false,
            rewardPool: 0
        });

        emit ContentSubmitted(contentCounter, msg.sender, _contentHash);
    }

    function voteOnContent(
        uint256 _contentId,
        uint256 _amount,
        bool _positive
    ) external nonReentrant whenNotPaused {
        require(_amount >= minStakeAmount, "Insufficient stake amount");
        require(aiContents[_contentId].id != 0, "Content does not exist");
        require(!aiContents[_contentId].finalized, "Voting period ended");
        require(
            block.timestamp <= aiContents[_contentId].timestamp + votingPeriod,
            "Voting period expired"
        );
        require(votes[_contentId][msg.sender].amount == 0, "Already voted");

        require(
            sToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        votes[_contentId][msg.sender] = Vote({
            amount: _amount,
            positive: _positive,
            timestamp: block.timestamp,
            claimed: false
        });

        aiContents[_contentId].totalStaked += _amount;

        if (_positive) {
            aiContents[_contentId].positiveVotes += _amount;
        } else {
            aiContents[_contentId].negativeVotes += _amount;
        }

        userStats[msg.sender].totalStaked += _amount;
        _updateVotingPower(msg.sender);

        emit VoteCast(_contentId, msg.sender, _amount, _positive);
    }

    function finalizeContent(uint256 _contentId) external {
        require(aiContents[_contentId].id != 0, "Content does not exist");
        require(!aiContents[_contentId].finalized, "Already finalized");
        require(
            block.timestamp > aiContents[_contentId].timestamp + votingPeriod,
            "Voting period not ended"
        );

        AIContent storage content = aiContents[_contentId];
        content.finalized = true;

        // Calculate reward pool (10% of total staked)
        content.rewardPool = (content.totalStaked * rewardPercentage) / 100;

        bool approved = content.positiveVotes > content.negativeVotes;
        emit ContentFinalized(_contentId, approved);
    }

    function claimRewards(uint256 _contentId) external nonReentrant {
        require(aiContents[_contentId].finalized, "Content not finalized");
        require(votes[_contentId][msg.sender].amount > 0, "No vote found");
        require(
            !votes[_contentId][msg.sender].claimed,
            "Rewards already claimed"
        );

        AIContent storage content = aiContents[_contentId];
        Vote storage userVote = votes[_contentId][msg.sender];

        bool approved = content.positiveVotes > content.negativeVotes;
        bool userWasCorrect = userVote.positive == approved;

        uint256 userReward = 0;
        uint256 stakeReturn = userVote.amount;

        if (userWasCorrect) {
            // Calculate proportional reward
            uint256 winningVotes = approved
                ? content.positiveVotes
                : content.negativeVotes;
            userReward = (content.rewardPool * userVote.amount) / winningVotes;

            // Update accuracy score
            userStats[msg.sender].accuracyScore += 10;
        } else {
            // Lose part of stake if wrong
            stakeReturn = (userVote.amount * 90) / 100; // 10% penalty
        }

        userVote.claimed = true;
        userStats[msg.sender].totalRewards += userReward;

        uint256 totalPayout = stakeReturn + userReward;
        require(sToken.transfer(msg.sender, totalPayout), "Transfer failed");

        emit RewardsClaimed(msg.sender, totalPayout);
    }

    function _updateVotingPower(address _user) internal {
        UserStats storage stats = userStats[_user];
        // Voting power based on accuracy and total staked
        stats.votingPower = (stats.accuracyScore * stats.totalStaked) / 1000;
    }

    function getContentDetails(
        uint256 _contentId
    ) external view returns (AIContent memory) {
        return aiContents[_contentId];
    }

    function getUserVote(
        uint256 _contentId,
        address _user
    ) external view returns (Vote memory) {
        return votes[_contentId][_user];
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateMinStakeAmount(uint256 _newAmount) external onlyOwner {
        minStakeAmount = _newAmount;
    }

    function updateVotingPeriod(uint256 _newPeriod) external onlyOwner {
        votingPeriod = _newPeriod;
    }
}
