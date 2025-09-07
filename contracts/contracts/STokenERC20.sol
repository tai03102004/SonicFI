// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract STokenERC20 is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    Ownable,
    ReentrancyGuard
{
    uint256 public constant MAX_SUPPLY = 1000000000 * 10 ** 18; // 1B tokens
    uint256 public constant INITIAL_MINT = 100000000 * 10 ** 18; // 100M initial

    // Vesting and allocation tracking
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => bool) public minters;
    mapping(address => uint256) public stakingRewards;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }

    // Reward distribution for different activities
    struct RewardMultipliers {
        uint256 votingAccuracy; // Reward for accurate voting
        uint256 earlyAdoption; // Bonus for early users
        uint256 liquidityProvider; // LP rewards
        uint256 contentCreation; // AI content generation
        uint256 communityGov; // Governance participation
    }

    RewardMultipliers public rewardMultipliers;

    // Advanced staking mechanics
    struct StakingTier {
        uint256 minAmount;
        uint256 multiplier;
        uint256 lockPeriod;
        bool active;
    }

    mapping(uint256 => StakingTier) public stakingTiers;
    mapping(address => UserStakeInfo) public userStakes;

    struct UserStakeInfo {
        uint256 amount;
        uint256 tier;
        uint256 startTime;
        uint256 lastRewardClaim;
        uint256 rewardDebt;
        bool isLocked;
    }

    // Fee distribution system
    uint256 public totalFeesCollected;
    uint256 public burnRate = 200; // 2% burn on certain transactions
    uint256 public rewardPoolRate = 300; // 3% to reward pool
    uint256 public treasuryRate = 100; // 1% to treasury

    address public treasuryWallet;
    address public rewardPool;
    address public knowledgeDAO;

    // Events
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    event StakingTierUpdated(
        uint256 indexed tier,
        uint256 minAmount,
        uint256 multiplier
    );
    event UserStaked(address indexed user, uint256 amount, uint256 tier);
    event UserUnstaked(address indexed user, uint256 amount);
    event RewardsDistributed(
        address indexed user,
        uint256 amount,
        string rewardType
    );

    // ✅ Fix constructor for OpenZeppelin v5
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
        _initializeStakingTiers();
    }

    function _initializeStakingTiers() internal {
        stakingTiers[1] = StakingTier(1000 * 10 ** 18, 100, 7 days, true); // Bronze: 1K tokens, 1x, 7 days
        stakingTiers[2] = StakingTier(10000 * 10 ** 18, 125, 30 days, true); // Silver: 10K tokens, 1.25x, 30 days
        stakingTiers[3] = StakingTier(50000 * 10 ** 18, 150, 90 days, true); // Gold: 50K tokens, 1.5x, 90 days
        stakingTiers[4] = StakingTier(250000 * 10 ** 18, 200, 180 days, true); // Platinum: 250K tokens, 2x, 180 days
        stakingTiers[5] = StakingTier(1000000 * 10 ** 18, 300, 365 days, true); // Diamond: 1M tokens, 3x, 365 days
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized minter");
        _;
    }

    modifier onlyKnowledgeDAO() {
        require(msg.sender == knowledgeDAO, "Only Knowledge DAO can call");
        _;
    }

    function setKnowledgeDAO(address _knowledgeDAO) external onlyOwner {
        knowledgeDAO = _knowledgeDAO;
    }

    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
    }

    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
    }

    // Advanced minting with supply checks
    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    // Vesting functionality
    function createVestingSchedule(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        bool _revocable
    ) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_totalAmount > 0, "Amount must be > 0");
        require(
            vestingSchedules[_beneficiary].totalAmount == 0,
            "Schedule exists"
        );

        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _totalAmount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: _cliffDuration,
            vestingDuration: _vestingDuration,
            revocable: _revocable,
            revoked: false
        });

        // Transfer tokens to contract for vesting
        _transfer(msg.sender, address(this), _totalAmount);

        emit VestingScheduleCreated(
            _beneficiary,
            _totalAmount,
            block.timestamp
        );
    }

    function releaseVestedTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Schedule revoked");
        require(
            block.timestamp >= schedule.startTime + schedule.cliffDuration,
            "Cliff not reached"
        );

        uint256 vestedAmount = _calculateVestedAmount(msg.sender);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;

        require(releasableAmount > 0, "No tokens to release");

        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), msg.sender, releasableAmount);

        emit TokensReleased(msg.sender, releasableAmount);
    }

    function _calculateVestedAmount(
        address _beneficiary
    ) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];

        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        uint256 timeVested = block.timestamp -
            schedule.startTime -
            schedule.cliffDuration;
        uint256 vestingTimeRemaining = schedule.vestingDuration -
            schedule.cliffDuration;

        return (schedule.totalAmount * timeVested) / vestingTimeRemaining;
    }

    // Advanced staking system
    function stake(
        uint256 _amount,
        uint256 _tier
    ) external nonReentrant whenNotPaused {
        require(_amount > 0, "Amount must be > 0");
        require(_tier >= 1 && _tier <= 5, "Invalid tier");
        require(stakingTiers[_tier].active, "Tier not active");
        require(
            _amount >= stakingTiers[_tier].minAmount,
            "Below minimum for tier"
        );
        require(userStakes[msg.sender].amount == 0, "Already staking");

        _transfer(msg.sender, address(this), _amount);

        userStakes[msg.sender] = UserStakeInfo({
            amount: _amount,
            tier: _tier,
            startTime: block.timestamp,
            lastRewardClaim: block.timestamp,
            rewardDebt: 0,
            isLocked: true
        });

        emit UserStaked(msg.sender, _amount, _tier);
    }

    function unstake() external nonReentrant {
        UserStakeInfo storage stakeInfo = userStakes[msg.sender];
        require(stakeInfo.amount > 0, "No stake found");

        StakingTier memory tier = stakingTiers[stakeInfo.tier];
        require(
            block.timestamp >= stakeInfo.startTime + tier.lockPeriod,
            "Still locked"
        );

        uint256 stakedAmount = stakeInfo.amount;

        // Calculate and distribute rewards before unstaking
        _distributeStakingRewards(msg.sender);

        // Reset stake info
        delete userStakes[msg.sender];

        // Return staked tokens
        _transfer(address(this), msg.sender, stakedAmount);

        emit UserUnstaked(msg.sender, stakedAmount);
    }

    function claimStakingRewards() external nonReentrant {
        require(userStakes[msg.sender].amount > 0, "No stake found");
        _distributeStakingRewards(msg.sender);
    }

    function _distributeStakingRewards(address _user) internal {
        UserStakeInfo storage stakeInfo = userStakes[_user];
        StakingTier memory tier = stakingTiers[stakeInfo.tier];

        uint256 timeStaked = block.timestamp - stakeInfo.lastRewardClaim;
        uint256 baseReward = (stakeInfo.amount * timeStaked * tier.multiplier) /
            (365 days * 10000);

        if (baseReward > 0) {
            stakeInfo.lastRewardClaim = block.timestamp;

            // Mint rewards (if within max supply)
            if (totalSupply() + baseReward <= MAX_SUPPLY) {
                _mint(_user, baseReward);
                emit RewardsDistributed(_user, baseReward, "staking");
            }
        }
    }

    // Activity-based reward distribution
    function distributeActivityReward(
        address _user,
        uint256 _baseAmount,
        string memory _activityType
    ) external onlyKnowledgeDAO {
        uint256 multiplier = _getActivityMultiplier(_activityType);
        uint256 rewardAmount = (_baseAmount * multiplier) / 100;

        if (totalSupply() + rewardAmount <= MAX_SUPPLY) {
            _mint(_user, rewardAmount);
            emit RewardsDistributed(_user, rewardAmount, _activityType);
        }
    }

    function _getActivityMultiplier(
        string memory _activityType
    ) internal view returns (uint256) {
        bytes32 activityHash = keccak256(abi.encodePacked(_activityType));

        if (activityHash == keccak256(abi.encodePacked("voting_accuracy"))) {
            return rewardMultipliers.votingAccuracy;
        } else if (
            activityHash == keccak256(abi.encodePacked("early_adoption"))
        ) {
            return rewardMultipliers.earlyAdoption;
        } else if (
            activityHash == keccak256(abi.encodePacked("liquidity_provider"))
        ) {
            return rewardMultipliers.liquidityProvider;
        } else if (
            activityHash == keccak256(abi.encodePacked("content_creation"))
        ) {
            return rewardMultipliers.contentCreation;
        } else if (
            activityHash == keccak256(abi.encodePacked("community_gov"))
        ) {
            return rewardMultipliers.communityGov;
        }

        return 100; // Default 1x multiplier
    }

    // ✅ Fix _update override for OpenZeppelin v5
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        // Apply fees on transfers (excluding minting/burning)
        if (from != address(0) && to != address(0)) {
            if (
                from != address(this) &&
                to != address(this) &&
                from != knowledgeDAO &&
                to != knowledgeDAO
            ) {
                uint256 burnAmount = (amount * burnRate) / 10000;
                uint256 rewardAmount = (amount * rewardPoolRate) / 10000;
                uint256 treasuryAmount = (amount * treasuryRate) / 10000;

                uint256 totalFees = burnAmount + rewardAmount + treasuryAmount;
                uint256 transferAmount = amount - totalFees;

                // Call parent _update for the main transfer
                super._update(from, to, transferAmount);

                // Handle fees separately
                if (burnAmount > 0) {
                    super._update(from, address(0), burnAmount); // Burn
                }

                if (rewardAmount > 0 && rewardPool != address(0)) {
                    super._update(from, rewardPool, rewardAmount);
                }

                if (treasuryAmount > 0 && treasuryWallet != address(0)) {
                    super._update(from, treasuryWallet, treasuryAmount);
                }

                totalFeesCollected += totalFees;
                return;
            }
        }

        // Normal transfer
        super._update(from, to, amount);
    }

    // Admin functions
    function updateRewardMultipliers(
        uint256 _votingAccuracy,
        uint256 _earlyAdoption,
        uint256 _liquidityProvider,
        uint256 _contentCreation,
        uint256 _communityGov
    ) external onlyOwner {
        rewardMultipliers = RewardMultipliers({
            votingAccuracy: _votingAccuracy,
            earlyAdoption: _earlyAdoption,
            liquidityProvider: _liquidityProvider,
            contentCreation: _contentCreation,
            communityGov: _communityGov
        });
    }

    function updateStakingTier(
        uint256 _tier,
        uint256 _minAmount,
        uint256 _multiplier,
        uint256 _lockPeriod,
        bool _active
    ) external onlyOwner {
        require(_tier >= 1 && _tier <= 5, "Invalid tier");
        stakingTiers[_tier] = StakingTier(
            _minAmount,
            _multiplier,
            _lockPeriod,
            _active
        );
        emit StakingTierUpdated(_tier, _minAmount, _multiplier);
    }

    function updateFeeRates(
        uint256 _burnRate,
        uint256 _rewardPoolRate,
        uint256 _treasuryRate
    ) external onlyOwner {
        require(
            _burnRate + _rewardPoolRate + _treasuryRate <= 1000,
            "Total fees too high"
        ); // Max 10%
        burnRate = _burnRate;
        rewardPoolRate = _rewardPoolRate;
        treasuryRate = _treasuryRate;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getVestingSchedule(
        address _beneficiary
    ) external view returns (VestingSchedule memory) {
        return vestingSchedules[_beneficiary];
    }

    function getVestedAmount(
        address _beneficiary
    ) external view returns (uint256) {
        return _calculateVestedAmount(_beneficiary);
    }

    function getUserStakeInfo(
        address _user
    ) external view returns (UserStakeInfo memory) {
        return userStakes[_user];
    }

    function getStakingTier(
        uint256 _tier
    ) external view returns (StakingTier memory) {
        return stakingTiers[_tier];
    }

    function calculateStakingRewards(
        address _user
    ) external view returns (uint256) {
        UserStakeInfo memory stakeInfo = userStakes[_user];
        if (stakeInfo.amount == 0) return 0;

        StakingTier memory tier = stakingTiers[stakeInfo.tier];
        uint256 timeStaked = block.timestamp - stakeInfo.lastRewardClaim;

        return
            (stakeInfo.amount * timeStaked * tier.multiplier) /
            (365 days * 10000);
    }
}
