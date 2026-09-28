// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VibeDailyCheckIn
 * @notice On-chain Daily Check-In & Streak Contract for Vibe Hub on Base.
 *         Users perform daily check-ins to build on-chain streaks with optional micro-fee.
 *         Includes ownership transfer, fee configuration, ETH withdraw, and operator support.
 */
contract VibeDailyCheckIn {
    // Contract Owner (deployer or transferred admin)
    address public owner;

    // Emergency pause state
    bool public paused;

    // Check-in micro fee in ETH (default: 0.000001 ETH / ~0.002 USD, adjustable by owner)
    uint256 public checkInFee;

    // Global Statistics
    uint256 public totalUsers;
    uint256 public totalGlobalCheckIns;

    struct UserCheckInInfo {
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 totalCheckIns;
        uint256 lastCheckInTimestamp;
        uint256 lastCheckInDay; // UTC calendar day index: block.timestamp / 86400
    }

    // Mapping from user address to their check-in details
    mapping(address => UserCheckInInfo) public userCheckIns;

    // Mapping for authorized operators/relayers (e.g. backend bots or AI agents)
    mapping(address => bool) public operators;

    // Events
    event CheckedIn(
        address indexed user,
        uint256 currentStreak,
        uint256 totalCheckIns,
        uint256 timestamp
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OperatorUpdated(address indexed operator, bool authorized);
    event CheckInFeeUpdated(uint256 oldFee, uint256 newFee);
    event ETHWithdrawn(address indexed to, uint256 amount);
    event Paused(address account);
    event Unpaused(address account);

    // Custom Errors for gas optimization
    error AlreadyCheckedInToday();
    error InsufficientFee();
    error NotOwner();
    error NotOperator();
    error ContractPaused();
    error InvalidAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner) revert NotOperator();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    constructor() {
        owner = msg.sender;
        checkInFee = 0.000001 ether; // 0.000001 ETH
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Performs daily check-in for msg.sender.
     * @dev Increments streak if consecutive UTC day, resets to 1 if day missed or first time.
     *      Reverts if already checked in today (UTC) or if sent value is less than checkInFee.
     */
    function checkIn() external payable whenNotPaused {
        if (msg.value < checkInFee) revert InsufficientFee();
        _processCheckIn(msg.sender);
    }

    /**
     * @notice Check-in on behalf of a user (callable by authorized operator/agent or owner).
     * @param user Target user wallet address.
     */
    function checkInFor(address user) external payable onlyOperator whenNotPaused {
        if (user == address(0)) revert InvalidAddress();
        if (msg.value < checkInFee) revert InsufficientFee();
        _processCheckIn(user);
    }

    /**
     * @dev Internal check-in processing logic.
     */
    function _processCheckIn(address user) internal {
        uint256 currentDay = block.timestamp / 1 days;
        UserCheckInInfo storage info = userCheckIns[user];

        if (info.lastCheckInDay == currentDay) {
            revert AlreadyCheckedInToday();
        }

        if (info.totalCheckIns == 0) {
            totalUsers += 1;
        }

        if (info.lastCheckInDay != 0 && info.lastCheckInDay + 1 == currentDay) {
            // Checked in on the consecutive UTC day -> increment streak
            info.currentStreak += 1;
        } else {
            // First check-in OR missed one or more days -> reset streak to 1
            info.currentStreak = 1;
        }

        if (info.currentStreak > info.longestStreak) {
            info.longestStreak = info.currentStreak;
        }

        info.totalCheckIns += 1;
        info.lastCheckInDay = currentDay;
        info.lastCheckInTimestamp = block.timestamp;
        totalGlobalCheckIns += 1;

        emit CheckedIn(user, info.currentStreak, info.totalCheckIns, block.timestamp);
    }

    /**
     * @notice Returns comprehensive check-in info for a user.
     * @param user Address to inspect.
     * @return currentStreak Current active streak (0 if expired).
     * @return longestStreak Best historical streak recorded.
     * @return totalCheckIns Total count of check-ins completed.
     * @return lastCheckInTimestamp Unix timestamp of last check-in.
     * @return canCheckInToday Boolean indicating if user can check in now.
     * @return secondsUntilNextCheckIn Seconds until next UTC day (0 if canCheckInToday is true).
     */
    function getCheckInInfo(address user) external view returns (
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 totalCheckIns,
        uint256 lastCheckInTimestamp,
        bool canCheckInToday,
        uint256 secondsUntilNextCheckIn
    ) {
        UserCheckInInfo memory info = userCheckIns[user];
        uint256 currentDay = block.timestamp / 1 days;

        canCheckInToday = (info.lastCheckInDay != currentDay);

        // If user missed consecutive day, display streak as 0 until they check in again
        if (info.lastCheckInDay != 0 && currentDay > info.lastCheckInDay + 1) {
            currentStreak = 0;
        } else {
            currentStreak = info.currentStreak;
        }

        longestStreak = info.longestStreak;
        totalCheckIns = info.totalCheckIns;
        lastCheckInTimestamp = info.lastCheckInTimestamp;

        if (!canCheckInToday) {
            uint256 nextDayTimestamp = (info.lastCheckInDay + 1) * 1 days;
            if (nextDayTimestamp > block.timestamp) {
                secondsUntilNextCheckIn = nextDayTimestamp - block.timestamp;
            } else {
                secondsUntilNextCheckIn = 0;
            }
        } else {
            secondsUntilNextCheckIn = 0;
        }
    }

    /**
     * @notice Quick check whether user can check in today.
     * @param user Address to check.
     */
    function canCheckIn(address user) external view returns (bool) {
        return userCheckIns[user].lastCheckInDay != (block.timestamp / 1 days);
    }

    // --- Admin Functions ---

    /**
     * @notice Sets the check-in fee in ETH wei. Can be set to 0 for free check-ins.
     * @param newFee New fee in wei (e.g. 0.000001 ether).
     */
    function setCheckInFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = checkInFee;
        checkInFee = newFee;
        emit CheckInFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Withdraws accumulated ETH from check-ins to owner address.
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFee();
        (bool success, ) = owner.call{value: balance}("");
        if (!success) revert TransferFailed();
        emit ETHWithdrawn(owner, balance);
    }

    /**
     * @notice Transfers ownership of the contract to a new address (e.g. Base Smart Wallet admin).
     * @param newOwner Address of the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Authorizes or revokes an operator address (e.g. relayer or agent).
     */
    function setOperator(address operator, bool authorized) external onlyOwner {
        if (operator == address(0)) revert InvalidAddress();
        operators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }

    /**
     * @notice Pauses check-ins in case of emergency.
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Resumes check-ins.
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
