// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReputationSystem is Ownable, ReentrancyGuard {
    struct UserReputation {
        uint256 totalScore;
        uint256 contentScore;
        uint256 communityScore;
        uint256 aiValidationScore;
        uint256 lastUpdateTime;
        bool isActive;
        // Add missing fields
        uint256 votingAccuracy;
        uint256 stakingHistory;
        uint256 communityContribution;
        bool isInfluencer;
        uint256 followerCount;
        uint256 timeBasedDecay;
        uint256 lastUpdateTimestamp;
        mapping(string => uint256) expertiseAreas;
    }

    struct ReputationTransaction {
        address user;
        string actionType;
        int256 scoreChange;
        uint256 timestamp;
        bytes32 evidenceHash;
        bool aiValidated;
        uint256 confidenceScore;
    }

    mapping(address => UserReputation) public userReputations;
    mapping(bytes32 => ReputationTransaction) public reputationHistory;
    mapping(string => uint256) public actionTypeWeights;
    mapping(address => bool) public authorizedValidators;

    // Advanced reputation mechanics
    mapping(address => mapping(address => uint256)) public endorsements;
    mapping(address => address[]) public endorsedBy;
    mapping(string => address[]) public expertsByArea;

    uint256 public constant MAX_REPUTATION = 10000;
    uint256 public constant DECAY_RATE = 5; // 0.5% per month
    uint256 public constant INFLUENCER_THRESHOLD = 5000;
    uint256 public constant AI_VALIDATION_WEIGHT = 200; // 20% weight for AI validation

    bytes32[] public allTransactions;
    uint256 public totalUsers;

    event ReputationUpdated(
        address indexed user,
        string actionType,
        int256 scoreChange,
        uint256 newTotalScore
    );

    event InfluencerStatusChanged(address indexed user, bool isInfluencer);
    event ExpertiseAreaUpdated(
        address indexed user,
        string area,
        uint256 score
    );
    event EndorsementGiven(address indexed endorser, address indexed endorsed);
    event AIValidationReceived(
        address indexed user,
        uint256 confidenceScore,
        bytes32 evidenceHash
    );

    // ✅ Fix constructor for OpenZeppelin v5
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize action type weights
        actionTypeWeights["accurate_vote"] = 100;
        actionTypeWeights["inaccurate_vote"] = 50;
        actionTypeWeights["content_creation"] = 150;
        actionTypeWeights["early_adoption"] = 75;
        actionTypeWeights["liquidity_provision"] = 125;
        actionTypeWeights["community_moderation"] = 200;
        actionTypeWeights["expert_analysis"] = 300;
        actionTypeWeights["ai_model_contribution"] = 250;
        actionTypeWeights["bug_report"] = 100;
        actionTypeWeights["governance_participation"] = 80;
    }

    modifier onlyAuthorizedOracle() {
        require(authorizedValidators[msg.sender], "Not authorized oracle");
        _;
    }

    function authorizeOracle(address _oracle) external onlyOwner {
        authorizedValidators[_oracle] = true;
    }

    function updateReputation(
        address _user,
        string memory _actionType,
        int256 _scoreModifier,
        bytes32 _evidenceHash,
        bool _isPositive
    ) external onlyAuthorizedOracle nonReentrant {
        require(_user != address(0), "Invalid user address");

        UserReputation storage userRep = userReputations[_user];

        // Apply time-based decay first
        _applyTimeDecay(_user);

        // Calculate score change
        uint256 baseWeight = actionTypeWeights[_actionType];
        require(baseWeight > 0, "Invalid action type");

        // ✅ Remove SafeMath and use native arithmetic
        int256 scoreChange = _isPositive
            ? int256((baseWeight * uint256(_scoreModifier)) / 100)
            : -int256((baseWeight * uint256(_scoreModifier)) / 100);

        // Apply the reputation change
        if (scoreChange > 0) {
            userRep.totalScore = userRep.totalScore + uint256(scoreChange);
            if (userRep.totalScore > MAX_REPUTATION) {
                userRep.totalScore = MAX_REPUTATION;
            }
        } else {
            uint256 decrease = uint256(-scoreChange);
            if (userRep.totalScore > decrease) {
                userRep.totalScore = userRep.totalScore - decrease;
            } else {
                userRep.totalScore = 0;
            }
        }

        // Update specific metrics based on action type
        _updateSpecificMetrics(_user, _actionType, _scoreModifier, _isPositive);

        // Update influencer status
        _updateInfluencerStatus(_user);

        // Record transaction
        bytes32 txHash = keccak256(
            abi.encodePacked(_user, _actionType, block.timestamp, _evidenceHash)
        );
        reputationHistory[txHash] = ReputationTransaction({
            user: _user,
            actionType: _actionType,
            scoreChange: scoreChange,
            timestamp: block.timestamp,
            evidenceHash: _evidenceHash,
            aiValidated: false,
            confidenceScore: 0
        });

        allTransactions.push(txHash);
        userRep.lastUpdateTimestamp = block.timestamp;

        emit ReputationUpdated(
            _user,
            _actionType,
            scoreChange,
            userRep.totalScore
        );
    }

    function submitAIValidation(
        bytes32 _transactionHash,
        uint256 _confidenceScore,
        bool _validationResult
    ) external onlyAuthorizedOracle {
        require(_confidenceScore <= 100, "Invalid confidence score");

        ReputationTransaction storage repTx = reputationHistory[
            _transactionHash
        ];
        require(repTx.user != address(0), "Transaction not found");
        require(!repTx.aiValidated, "Already validated");

        repTx.aiValidated = true;
        repTx.confidenceScore = _confidenceScore;

        // Apply AI validation bonus/penalty
        UserReputation storage userRep = userReputations[repTx.user];

        if (_validationResult && _confidenceScore >= 80) {
            // High confidence validation - bonus
            uint256 bonus = (AI_VALIDATION_WEIGHT * _confidenceScore) / 100;
            userRep.aiValidationScore = userRep.aiValidationScore + bonus;
            userRep.totalScore = userRep.totalScore + bonus;

            if (userRep.totalScore > MAX_REPUTATION) {
                userRep.totalScore = MAX_REPUTATION;
            }
        } else if (!_validationResult && _confidenceScore >= 80) {
            // High confidence rejection - penalty
            uint256 penalty = (AI_VALIDATION_WEIGHT * _confidenceScore) / 200; // Half penalty
            if (userRep.aiValidationScore > penalty) {
                userRep.aiValidationScore = userRep.aiValidationScore - penalty;
            } else {
                userRep.aiValidationScore = 0;
            }

            if (userRep.totalScore > penalty) {
                userRep.totalScore = userRep.totalScore - penalty;
            } else {
                userRep.totalScore = 0;
            }
        }

        emit AIValidationReceived(
            repTx.user,
            _confidenceScore,
            repTx.evidenceHash
        );
    }

    function endorseUser(address _user) external {
        require(_user != msg.sender, "Cannot endorse yourself");
        require(
            userReputations[msg.sender].totalScore >= 1000,
            "Insufficient reputation to endorse"
        );
        require(endorsements[msg.sender][_user] == 0, "Already endorsed");

        uint256 endorsementValue = userReputations[msg.sender].totalScore / 100; // 1% of endorser's reputation
        endorsements[msg.sender][_user] = endorsementValue;
        endorsedBy[_user].push(msg.sender);

        // Apply endorsement bonus
        UserReputation storage userRep = userReputations[_user];
        userRep.communityContribution =
            userRep.communityContribution +
            endorsementValue;
        userRep.totalScore = userRep.totalScore + (endorsementValue / 2); // 50% of endorsement value

        if (userRep.totalScore > MAX_REPUTATION) {
            userRep.totalScore = MAX_REPUTATION;
        }

        emit EndorsementGiven(msg.sender, _user);
    }

    function updateExpertiseArea(
        address _user,
        string memory _area,
        uint256 _score
    ) external onlyAuthorizedOracle {
        require(_score <= 100, "Invalid expertise score");

        UserReputation storage userRep = userReputations[_user];
        uint256 oldScore = userRep.expertiseAreas[_area];
        userRep.expertiseAreas[_area] = _score;

        // Update expert list for the area
        if (oldScore < 70 && _score >= 70) {
            expertsByArea[_area].push(_user);
        } else if (oldScore >= 70 && _score < 70) {
            _removeFromExpertList(_user, _area);
        }

        emit ExpertiseAreaUpdated(_user, _area, _score);
    }

    function _updateSpecificMetrics(
        address _user,
        string memory _actionType,
        int256 _scoreModifier,
        bool _isPositive
    ) internal {
        UserReputation storage userRep = userReputations[_user];
        bytes32 actionHash = keccak256(abi.encodePacked(_actionType));

        if (
            actionHash == keccak256(abi.encodePacked("accurate_vote")) &&
            _isPositive
        ) {
            userRep.votingAccuracy =
                userRep.votingAccuracy +
                uint256(_scoreModifier);
        } else if (
            actionHash == keccak256(abi.encodePacked("inaccurate_vote")) &&
            !_isPositive
        ) {
            if (userRep.votingAccuracy > uint256(-_scoreModifier)) {
                userRep.votingAccuracy =
                    userRep.votingAccuracy -
                    uint256(-_scoreModifier);
            } else {
                userRep.votingAccuracy = 0;
            }
        } else if (
            actionHash == keccak256(abi.encodePacked("content_creation")) &&
            _isPositive
        ) {
            userRep.communityContribution =
                userRep.communityContribution +
                uint256(_scoreModifier);
        }
    }

    function _applyTimeDecay(address _user) internal {
        UserReputation storage userRep = userReputations[_user];

        if (userRep.lastUpdateTimestamp == 0) {
            userRep.lastUpdateTimestamp = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - userRep.lastUpdateTimestamp;
        uint256 monthsElapsed = timeElapsed / 30 days;

        if (monthsElapsed > 0) {
            uint256 decayAmount = (userRep.totalScore *
                DECAY_RATE *
                monthsElapsed) / 1000;
            if (userRep.totalScore > decayAmount) {
                userRep.totalScore = userRep.totalScore - decayAmount;
            } else {
                userRep.totalScore = 0;
            }
            userRep.timeBasedDecay = userRep.timeBasedDecay + decayAmount;
        }
    }

    function _updateInfluencerStatus(address _user) internal {
        UserReputation storage userRep = userReputations[_user];
        bool wasInfluencer = userRep.isInfluencer;
        bool isInfluencer = userRep.totalScore >= INFLUENCER_THRESHOLD;

        if (wasInfluencer != isInfluencer) {
            userRep.isInfluencer = isInfluencer;
            emit InfluencerStatusChanged(_user, isInfluencer);
        }
    }

    function _removeFromExpertList(
        address _user,
        string memory _area
    ) internal {
        address[] storage experts = expertsByArea[_area];
        for (uint256 i = 0; i < experts.length; i++) {
            if (experts[i] == _user) {
                experts[i] = experts[experts.length - 1];
                experts.pop();
                break;
            }
        }
    }

    // View functions
    function getUserReputation(
        address _user
    )
        external
        view
        returns (
            uint256 totalScore,
            uint256 votingAccuracy,
            uint256 stakingHistory,
            uint256 communityContribution,
            uint256 aiValidationScore,
            bool isInfluencer,
            uint256 followerCount
        )
    {
        UserReputation storage userRep = userReputations[_user];
        return (
            userRep.totalScore,
            userRep.votingAccuracy,
            userRep.stakingHistory,
            userRep.communityContribution,
            userRep.aiValidationScore,
            userRep.isInfluencer,
            userRep.followerCount
        );
    }

    function getUserExpertise(
        address _user,
        string memory _area
    ) external view returns (uint256) {
        return userReputations[_user].expertiseAreas[_area];
    }

    function getExpertsByArea(
        string memory _area
    ) external view returns (address[] memory) {
        return expertsByArea[_area];
    }

    function getEndorsements(
        address _user
    ) external view returns (address[] memory) {
        return endorsedBy[_user];
    }

    function getTotalTransactions() external view returns (uint256) {
        return allTransactions.length;
    }

    function getRecentTransactions(
        uint256 _limit
    ) external view returns (bytes32[] memory) {
        uint256 length = allTransactions.length;
        uint256 returnLength = _limit > length ? length : _limit;
        bytes32[] memory recent = new bytes32[](returnLength);

        for (uint256 i = 0; i < returnLength; i++) {
            recent[i] = allTransactions[length - 1 - i];
        }

        return recent;
    }

    // Admin functions
    function updateActionTypeWeight(
        string memory _actionType,
        uint256 _weight
    ) external onlyOwner {
        actionTypeWeights[_actionType] = _weight;
    }

    function emergencyResetUser(address _user) external onlyOwner {
        UserReputation storage userRep = userReputations[_user];
        userRep.totalScore = 0;
        userRep.votingAccuracy = 0;
        userRep.stakingHistory = 0;
        userRep.communityContribution = 0;
        userRep.aiValidationScore = 0;
        userRep.isInfluencer = false;
    }
}
