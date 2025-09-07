// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AIModelRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant MODEL_VALIDATOR_ROLE =
        keccak256("MODEL_VALIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct AIModel {
        string name;
        string version;
        string description;
        address creator;
        string modelHash; // IPFS hash
        string metadataURI;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
        bool isPublic;
        uint256 usageCount;
        uint256 successRate; // Percentage 0-10000 (100.00%)
        uint256 totalPredictions;
        uint256 correctPredictions;
        uint256 stakingRequirement;
        mapping(string => uint256) performanceMetrics;
        mapping(address => bool) authorizedUsers;
        string[] categories;
        uint256 rewardPool;
        uint256 totalStaked;
    }

    struct ModelVersion {
        string version;
        string modelHash;
        uint256 timestamp;
        string changeLog;
        bool deprecated;
        uint256 performanceScore;
    }

    struct PredictionRecord {
        uint256 modelId;
        address predictor;
        string predictionHash;
        uint256 timestamp;
        bool validated;
        bool accurate;
        uint256 confidenceScore;
        uint256 rewardAmount;
        bytes32 evidenceHash;
    }

    struct ModelStake {
        address staker;
        uint256 amount;
        uint256 timestamp;
        bool active;
        uint256 rewards;
    }

    mapping(uint256 => AIModel) public models;
    mapping(uint256 => ModelVersion[]) public modelVersions;
    mapping(uint256 => PredictionRecord[]) public modelPredictions;
    mapping(uint256 => mapping(address => ModelStake)) public modelStakes;
    mapping(uint256 => address[]) public modelStakers;
    mapping(string => uint256[]) public modelsByCategory;
    mapping(address => uint256[]) public modelsByCreator;

    uint256 public modelCounter;
    uint256 public totalModelsStaked;
    uint256 public globalRewardPool;

    IERC20 public sToken;

    // Performance thresholds
    uint256 public constant MIN_SUCCESS_RATE = 6000; // 60%
    uint256 public constant MIN_PREDICTIONS_FOR_VALIDATION = 100;
    uint256 public constant PERFORMANCE_WINDOW = 30 days;
    uint256 public constant BASE_STAKING_REQUIREMENT = 1000 * 10 ** 18; // 1000 S tokens

    event ModelRegistered(
        uint256 indexed modelId,
        address indexed creator,
        string name
    );
    event ModelUpdated(uint256 indexed modelId, string newVersion);
    event PredictionSubmitted(
        uint256 indexed modelId,
        address indexed predictor,
        string predictionHash
    );
    event PredictionValidated(
        uint256 indexed modelId,
        uint256 predictionIndex,
        bool accurate
    );
    event ModelStaked(
        uint256 indexed modelId,
        address indexed staker,
        uint256 amount
    );
    event ModelUnstaked(
        uint256 indexed modelId,
        address indexed staker,
        uint256 amount
    );
    event RewardsDistributed(uint256 indexed modelId, uint256 totalRewards);
    event ModelDeactivated(uint256 indexed modelId, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerModel(
        string memory _name,
        string memory _version,
        string memory _description,
        string memory _modelHash,
        string memory _metadataURI,
        string[] memory _categories,
        bool _isPublic,
        uint256 _stakingRequirement
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_modelHash).length > 0, "Model hash cannot be empty");
        require(
            _stakingRequirement >= BASE_STAKING_REQUIREMENT,
            "Insufficient staking requirement"
        );

        uint256 modelId = modelCounter++;

        AIModel storage model = models[modelId];
        model.name = _name;
        model.version = _version;
        model.description = _description;
        model.creator = msg.sender;
        model.modelHash = _modelHash;
        model.metadataURI = _metadataURI;
        model.createdAt = block.timestamp;
        model.lastUpdated = block.timestamp;
        model.isActive = true;
        model.isPublic = _isPublic;
        model.categories = _categories;
        model.stakingRequirement = _stakingRequirement;

        // Add to version history
        modelVersions[modelId].push(
            ModelVersion({
                version: _version,
                modelHash: _modelHash,
                timestamp: block.timestamp,
                changeLog: "Initial version",
                deprecated: false,
                performanceScore: 0
            })
        );

        // Update category mappings
        for (uint256 i = 0; i < _categories.length; i++) {
            modelsByCategory[_categories[i]].push(modelId);
        }

        modelsByCreator[msg.sender].push(modelId);

        // Stake initial requirement
        require(
            sToken.transferFrom(msg.sender, address(this), _stakingRequirement),
            "Staking failed"
        );

        modelStakes[modelId][msg.sender] = ModelStake({
            staker: msg.sender,
            amount: _stakingRequirement,
            timestamp: block.timestamp,
            active: true,
            rewards: 0
        });

        modelStakers[modelId].push(msg.sender);
        models[modelId].totalStaked = _stakingRequirement;
        totalModelsStaked += _stakingRequirement;

        emit ModelRegistered(modelId, msg.sender, _name);
        emit ModelStaked(modelId, msg.sender, _stakingRequirement);

        return modelId;
    }

    function updateModel(
        uint256 _modelId,
        string memory _newVersion,
        string memory _newModelHash,
        string memory _changeLog
    ) external {
        require(_modelId < modelCounter, "Model does not exist");
        AIModel storage model = models[_modelId];
        require(model.creator == msg.sender, "Not model creator");
        require(model.isActive, "Model is not active");

        // Deprecate old version
        ModelVersion[] storage versions = modelVersions[_modelId];
        if (versions.length > 0) {
            versions[versions.length - 1].deprecated = true;
        }

        // Add new version
        versions.push(
            ModelVersion({
                version: _newVersion,
                modelHash: _newModelHash,
                timestamp: block.timestamp,
                changeLog: _changeLog,
                deprecated: false,
                performanceScore: 0
            })
        );

        model.version = _newVersion;
        model.modelHash = _newModelHash;
        model.lastUpdated = block.timestamp;

        emit ModelUpdated(_modelId, _newVersion);
    }

    function submitPrediction(
        uint256 _modelId,
        string memory _predictionHash,
        uint256 _confidenceScore,
        bytes32 _evidenceHash
    ) external nonReentrant {
        require(_modelId < modelCounter, "Model does not exist");
        AIModel storage model = models[_modelId];
        require(model.isActive, "Model is not active");
        require(_confidenceScore <= 100, "Invalid confidence score");

        // Check authorization for private models
        if (!model.isPublic) {
            require(
                model.authorizedUsers[msg.sender] ||
                    model.creator == msg.sender,
                "Not authorized"
            );
        }

        modelPredictions[_modelId].push(
            PredictionRecord({
                modelId: _modelId,
                predictor: msg.sender,
                predictionHash: _predictionHash,
                timestamp: block.timestamp,
                validated: false,
                accurate: false,
                confidenceScore: _confidenceScore,
                rewardAmount: 0,
                evidenceHash: _evidenceHash
            })
        );

        model.usageCount++;
        model.totalPredictions++;

        emit PredictionSubmitted(_modelId, msg.sender, _predictionHash);
    }

    function validatePrediction(
        uint256 _modelId,
        uint256 _predictionIndex,
        bool _accurate,
        uint256 _rewardAmount
    ) external onlyRole(ORACLE_ROLE) {
        require(_modelId < modelCounter, "Model does not exist");
        require(
            _predictionIndex < modelPredictions[_modelId].length,
            "Invalid prediction index"
        );

        PredictionRecord storage prediction = modelPredictions[_modelId][
            _predictionIndex
        ];
        require(!prediction.validated, "Already validated");

        prediction.validated = true;
        prediction.accurate = _accurate;
        prediction.rewardAmount = _rewardAmount;

        AIModel storage model = models[_modelId];

        if (_accurate) {
            model.correctPredictions++;

            // Distribute rewards
            if (_rewardAmount > 0 && model.rewardPool >= _rewardAmount) {
                model.rewardPool -= _rewardAmount;
                require(
                    sToken.transfer(prediction.predictor, _rewardAmount),
                    "Reward transfer failed"
                );
            }
        }

        // Update success rate
        model.successRate =
            (model.correctPredictions * 10000) /
            model.totalPredictions;

        // Check if model should be deactivated due to poor performance
        if (
            model.totalPredictions >= MIN_PREDICTIONS_FOR_VALIDATION &&
            model.successRate < MIN_SUCCESS_RATE
        ) {
            model.isActive = false;
            emit ModelDeactivated(_modelId, "Poor performance");
        }

        emit PredictionValidated(_modelId, _predictionIndex, _accurate);
    }

    function stakeOnModel(
        uint256 _modelId,
        uint256 _amount
    ) external nonReentrant {
        require(_modelId < modelCounter, "Model does not exist");
        require(_amount > 0, "Amount must be > 0");

        AIModel storage model = models[_modelId];
        require(model.isActive, "Model is not active");

        require(
            sToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        ModelStake storage stake = modelStakes[_modelId][msg.sender];

        if (stake.amount == 0) {
            // New staker
            modelStakers[_modelId].push(msg.sender);
            stake.staker = msg.sender;
            stake.timestamp = block.timestamp;
            stake.active = true;
        }

        stake.amount += _amount;
        model.totalStaked += _amount;
        totalModelsStaked += _amount;

        emit ModelStaked(_modelId, msg.sender, _amount);
    }

    function unstakeFromModel(
        uint256 _modelId,
        uint256 _amount
    ) external nonReentrant {
        require(_modelId < modelCounter, "Model does not exist");

        ModelStake storage stake = modelStakes[_modelId][msg.sender];
        require(stake.amount >= _amount, "Insufficient staked amount");
        require(stake.active, "Stake is not active");

        // Model creator must maintain minimum stake
        if (msg.sender == models[_modelId].creator) {
            require(
                stake.amount - _amount >= models[_modelId].stakingRequirement,
                "Creator must maintain minimum stake"
            );
        }

        stake.amount -= _amount;
        models[_modelId].totalStaked -= _amount;
        totalModelsStaked -= _amount;

        if (stake.amount == 0) {
            stake.active = false;
        }

        require(sToken.transfer(msg.sender, _amount), "Transfer failed");

        emit ModelUnstaked(_modelId, msg.sender, _amount);
    }

    function distributeModelRewards(
        uint256 _modelId,
        uint256 _totalRewards
    ) external onlyRole(ORACLE_ROLE) {
        require(_modelId < modelCounter, "Model does not exist");
        require(_totalRewards > 0, "No rewards to distribute");

        AIModel storage model = models[_modelId];
        address[] storage stakers = modelStakers[_modelId];

        if (model.totalStaked == 0 || stakers.length == 0) {
            return;
        }

        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            ModelStake storage stake = modelStakes[_modelId][staker];

            if (stake.active && stake.amount > 0) {
                uint256 reward = (_totalRewards * stake.amount) /
                    model.totalStaked;
                stake.rewards += reward;

                if (reward > 0) {
                    require(
                        sToken.transfer(staker, reward),
                        "Reward transfer failed"
                    );
                }
            }
        }

        emit RewardsDistributed(_modelId, _totalRewards);
    }

    function authorizeUser(uint256 _modelId, address _user) external {
        require(_modelId < modelCounter, "Model does not exist");
        require(models[_modelId].creator == msg.sender, "Not model creator");

        models[_modelId].authorizedUsers[_user] = true;
    }

    function deauthorizeUser(uint256 _modelId, address _user) external {
        require(_modelId < modelCounter, "Model does not exist");
        require(models[_modelId].creator == msg.sender, "Not model creator");

        models[_modelId].authorizedUsers[_user] = false;
    }

    // View functions
    function getModel(
        uint256 _modelId
    )
        external
        view
        returns (
            string memory name,
            string memory version,
            string memory description,
            address creator,
            string memory modelHash,
            bool isActive,
            bool isPublic,
            uint256 usageCount,
            uint256 successRate,
            uint256 totalStaked
        )
    {
        require(_modelId < modelCounter, "Model does not exist");
        AIModel storage model = models[_modelId];

        return (
            model.name,
            model.version,
            model.description,
            model.creator,
            model.modelHash,
            model.isActive,
            model.isPublic,
            model.usageCount,
            model.successRate,
            model.totalStaked
        );
    }

    function getModelPerformance(
        uint256 _modelId
    )
        external
        view
        returns (
            uint256 totalPredictions,
            uint256 correctPredictions,
            uint256 successRate,
            uint256 rewardPool
        )
    {
        require(_modelId < modelCounter, "Model does not exist");
        AIModel storage model = models[_modelId];

        return (
            model.totalPredictions,
            model.correctPredictions,
            model.successRate,
            model.rewardPool
        );
    }

    function getModelVersions(
        uint256 _modelId
    ) external view returns (ModelVersion[] memory) {
        require(_modelId < modelCounter, "Model does not exist");
        return modelVersions[_modelId];
    }

    function getModelsByCategory(
        string memory _category
    ) external view returns (uint256[] memory) {
        return modelsByCategory[_category];
    }

    function getModelsByCreator(
        address _creator
    ) external view returns (uint256[] memory) {
        return modelsByCreator[_creator];
    }

    function getUserStake(
        uint256 _modelId,
        address _user
    )
        external
        view
        returns (
            uint256 amount,
            uint256 timestamp,
            bool active,
            uint256 rewards
        )
    {
        ModelStake storage stake = modelStakes[_modelId][_user];
        return (stake.amount, stake.timestamp, stake.active, stake.rewards);
    }

    function getPredictionCount(
        uint256 _modelId
    ) external view returns (uint256) {
        return modelPredictions[_modelId].length;
    }

    function getPrediction(
        uint256 _modelId,
        uint256 _index
    )
        external
        view
        returns (
            address predictor,
            string memory predictionHash,
            uint256 timestamp,
            bool validated,
            bool accurate,
            uint256 confidenceScore,
            uint256 rewardAmount
        )
    {
        require(_index < modelPredictions[_modelId].length, "Invalid index");
        PredictionRecord storage prediction = modelPredictions[_modelId][
            _index
        ];

        return (
            prediction.predictor,
            prediction.predictionHash,
            prediction.timestamp,
            prediction.validated,
            prediction.accurate,
            prediction.confidenceScore,
            prediction.rewardAmount
        );
    }

    // Admin functions
    function addRewardPool(
        uint256 _modelId,
        uint256 _amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_modelId < modelCounter, "Model does not exist");
        require(
            sToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        models[_modelId].rewardPool += _amount;
        globalRewardPool += _amount;
    }

    function emergencyDeactivateModel(
        uint256 _modelId,
        string memory _reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_modelId < modelCounter, "Model does not exist");
        models[_modelId].isActive = false;
        emit ModelDeactivated(_modelId, _reason);
    }
}
