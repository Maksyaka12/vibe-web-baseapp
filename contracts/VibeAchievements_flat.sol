// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @dev Implementation of the {IERC165} interface.
 */
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

/**
 * @dev Required interface of an ERC1155 compliant contract, as defined in the
 * https://eips.ethereum.org/EIPS/eip-1155[EIP].
 */
interface IERC1155 is IERC165 {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}

/**
 * @dev Interface for the optional metadata functions in {IERC1155}.
 */
interface IERC1155MetadataURI is IERC1155 {
    function uri(uint256 id) external view returns (string memory);
}

/**
 * @dev Handles the receipt of ERC1155 token types.
 */
interface IERC1155Receiver is IERC165 {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4);
}

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/**
 * @title VibeAchievements
 * @notice Official Soulbound Token (SBT) Achievement Badge Contract for Vibe Hub on Base.
 *         Users earn verifiable on-chain badges by completing in-app milestones
 *         (check-in streaks, staking vaults, liquidity, etc.).
 *         Badges are non-transferable (Soulbound) to guarantee authenticity.
 */
contract VibeAchievements is Context, ERC165, IERC1155, IERC1155MetadataURI, Ownable {

    string public constant name = "Vibe Hub Achievements";
    string public constant symbol = "VIBE_ACHIEVE";

    // Global Pause
    bool public paused;

    // Base URI for token metadata
    string public baseURI;
    // Contract-level metadata URI (OpenSea / Block explorers)
    string public contractURI;

    // Total unique achievements registered
    uint256 public totalAchievementsCount;
    // Total global achievement badges minted
    uint256 public totalGlobalClaims;

    struct Achievement {
        uint256 id;
        string name;
        string category;
        string uri;
        bool isActive;
        uint256 totalClaimed;
    }

    // Mapping: achievementId => Achievement details
    mapping(uint256 => Achievement) public achievements;

    // Mapping: achievementId => list of all achievement IDs for enumeration
    uint256[] public achievementIdsList;

    // Mapping: user => (achievementId => claimed status)
    mapping(address => mapping(uint256 => bool)) public hasClaimed;

    // Mapping: token balance mapping (user => (achievementId => balance))
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // Authorized operators / relayers
    mapping(address => bool) public operators;

    // Events
    event AchievementClaimed(
        address indexed user,
        uint256 indexed achievementId,
        uint256 timestamp
    );
    event AchievementCreated(
        uint256 indexed achievementId,
        string name,
        string category,
        string uri
    );
    event AchievementUpdated(
        uint256 indexed achievementId,
        string name,
        string category,
        string uri,
        bool isActive
    );
    event OperatorUpdated(address indexed operator, bool authorized);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    // Errors
    error SoulboundTokenCannotBeTransferred();
    error AchievementAlreadyClaimed();
    error AchievementNotActive();
    error AchievementNotFound();
    error ContractPaused();
    error InvalidAddress();
    error ArrayLengthMismatch();
    error NotOperator();

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyOperator() {
        if (!operators[_msgSender()] && _msgSender() != owner()) revert NotOperator();
        _;
    }

    constructor() {
        baseURI = "https://vibeverse.dog/api/achievements/";
        contractURI = "https://vibeverse.dog/api/achievements/contract.json";

        // Pre-initialize initial 8 achievements
        _createAchievement(1, "STARTER DOG", "Active Dog", "https://vibeverse.dog/api/achievements/1.json", true);
        _createAchievement(2, "LOYAL DOG", "Active Dog", "https://vibeverse.dog/api/achievements/2.json", true);
        _createAchievement(3, "ULTRA-ACTIVE DOG", "Active Dog", "https://vibeverse.dog/api/achievements/3.json", true);
        _createAchievement(4, "NOVICE STAKER", "Dog Staker", "https://vibeverse.dog/api/achievements/4.json", true);
        _createAchievement(5, "CONFIDENT BANKER", "Dog Staker", "https://vibeverse.dog/api/achievements/5.json", true);
        _createAchievement(6, "WOLF OF WALL ST", "Dog Staker", "https://vibeverse.dog/api/achievements/6.json", true);
        _createAchievement(7, "RICH DOG", "Dog Staker", "https://vibeverse.dog/api/achievements/7.json", true);
        _createAchievement(8, "BANK FOUNDER", "Dog Staker", "https://vibeverse.dog/api/achievements/8.json", true);
    }

    // ── 1. ERC165 SUPPORT ──

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // ── 2. METADATA ──

    function uri(uint256 id) public view virtual override returns (string memory) {
        if (bytes(achievements[id].uri).length > 0) {
            return achievements[id].uri;
        }
        return string(abi.encodePacked(baseURI, _toString(id), ".json"));
    }

    // ── 3. SOULBOUND BALANCE & TOKEN FUNCTIONS ──

    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        if (account == address(0)) revert InvalidAddress();
        return _balances[account][id];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) public view virtual override returns (uint256[] memory) {
        if (accounts.length != ids.length) revert ArrayLengthMismatch();
        uint256[] memory batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        return batchBalances;
    }

    function setApprovalForAll(address, bool) public virtual override {
        // Soulbound token: approvals are disabled
        revert SoulboundTokenCannotBeTransferred();
    }

    function isApprovedForAll(address, address) public view virtual override returns (bool) {
        return false;
    }

    /**
     * @dev Block user-to-user transfers.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public virtual override {
        if (from != address(0)) {
            revert SoulboundTokenCannotBeTransferred();
        }
        _mint(to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) public virtual override {
        if (from != address(0)) {
            revert SoulboundTokenCannotBeTransferred();
        }
        _mintBatch(to, ids, amounts, data);
    }

    // ── 4. CLAIM FUNCTIONS ──

    /**
     * @notice Claims a single earned achievement badge.
     * @param achievementId ID of the achievement to claim.
     */
    function claimAchievement(uint256 achievementId) external whenNotPaused {
        _processClaim(_msgSender(), achievementId);
    }

    /**
     * @notice Claims multiple earned achievement badges in a single transaction.
     * @param achievementIds Array of achievement IDs to claim.
     */
    function claimAchievements(uint256[] calldata achievementIds) external whenNotPaused {
        for (uint256 i = 0; i < achievementIds.length; ++i) {
            _processClaim(_msgSender(), achievementIds[i]);
        }
    }

    /**
     * @notice Claims an achievement on behalf of a user (authorized operator/agent only).
     * @param user Target user address.
     * @param achievementId ID of the achievement.
     */
    function claimAchievementFor(address user, uint256 achievementId) external onlyOperator whenNotPaused {
        if (user == address(0)) revert InvalidAddress();
        _processClaim(user, achievementId);
    }

    function _processClaim(address user, uint256 achievementId) internal {
        Achievement storage ach = achievements[achievementId];
        if (ach.id == 0) revert AchievementNotFound();
        if (!ach.isActive) revert AchievementNotActive();
        if (hasClaimed[user][achievementId]) revert AchievementAlreadyClaimed();

        hasClaimed[user][achievementId] = true;
        ach.totalClaimed += 1;
        totalGlobalClaims += 1;

        _mint(user, achievementId, 1, "");

        emit AchievementClaimed(user, achievementId, block.timestamp);
    }

    // ── 5. INTERNAL MINTER ──

    function _mint(address to, uint256 id, uint256 amount, bytes memory data) internal {
        if (to == address(0)) revert InvalidAddress();

        _balances[to][id] += amount;

        emit TransferSingle(_msgSender(), address(0), to, id, amount);

        _doSafeTransferAcceptanceCheck(_msgSender(), address(0), to, id, amount, data);
    }

    function _mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal {
        if (to == address(0)) revert InvalidAddress();
        if (ids.length != amounts.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < ids.length; ++i) {
            _balances[to][ids[i]] += amounts[i];
        }

        emit TransferBatch(_msgSender(), address(0), to, ids, amounts);

        _doSafeBatchTransferAcceptanceCheck(_msgSender(), address(0), to, ids, amounts, data);
    }

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, amount, data) returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155Received.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (
                bytes4 response
            ) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    // ── 6. VIEW HELPERS ──

    function hasUserClaimed(address user, uint256 achievementId) external view returns (bool) {
        return hasClaimed[user][achievementId];
    }

    function getUserAchievements(
        address user,
        uint256[] calldata ids
    ) external view returns (bool[] memory) {
        bool[] memory results = new bool[](ids.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            results[i] = hasClaimed[user][ids[i]];
        }
        return results;
    }

    function getAchievement(uint256 achievementId) external view returns (Achievement memory) {
        return achievements[achievementId];
    }

    function getAllAchievements() external view returns (Achievement[] memory) {
        uint256 len = achievementIdsList.length;
        Achievement[] memory all = new Achievement[](len);
        for (uint256 i = 0; i < len; ++i) {
            all[i] = achievements[achievementIdsList[i]];
        }
        return all;
    }

    function totalAchievements() external view returns (uint256) {
        return totalAchievementsCount;
    }

    // ── 7. ADMIN FUNCTIONS (onlyOwner) ──

    function createAchievement(
        uint256 achievementId,
        string memory achName,
        string memory category,
        string memory achUri,
        bool isActive
    ) external onlyOwner {
        if (achievements[achievementId].id != 0) revert("Achievement ID already exists");
        _createAchievement(achievementId, achName, category, achUri, isActive);
    }

    function updateAchievement(
        uint256 achievementId,
        string memory achName,
        string memory category,
        string memory achUri,
        bool isActive
    ) external onlyOwner {
        if (achievements[achievementId].id == 0) revert AchievementNotFound();

        Achievement storage ach = achievements[achievementId];
        ach.name = achName;
        ach.category = category;
        ach.uri = achUri;
        ach.isActive = isActive;

        emit AchievementUpdated(achievementId, achName, category, achUri, isActive);
    }

    function setAchievementActive(uint256 achievementId, bool isActive) external onlyOwner {
        if (achievements[achievementId].id == 0) revert AchievementNotFound();
        achievements[achievementId].isActive = isActive;
        emit AchievementUpdated(
            achievementId,
            achievements[achievementId].name,
            achievements[achievementId].category,
            achievements[achievementId].uri,
            isActive
        );
    }

    function setAchievementUri(uint256 achievementId, string memory achUri) external onlyOwner {
        if (achievements[achievementId].id == 0) revert AchievementNotFound();
        achievements[achievementId].uri = achUri;
        emit URI(achUri, achievementId);
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        baseURI = newBaseUri;
    }

    function setContractUri(string memory newContractUri) external onlyOwner {
        contractURI = newContractUri;
    }

    function setOperator(address operator, bool authorized) external onlyOwner {
        if (operator == address(0)) revert InvalidAddress();
        operators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(_msgSender());
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(_msgSender());
    }

    function _createAchievement(
        uint256 achievementId,
        string memory achName,
        string memory category,
        string memory achUri,
        bool isActive
    ) internal {
        achievements[achievementId] = Achievement({
            id: achievementId,
            name: achName,
            category: category,
            uri: achUri,
            isActive: isActive,
            totalClaimed: 0
        });
        achievementIdsList.push(achievementId);
        totalAchievementsCount += 1;

        emit AchievementCreated(achievementId, achName, category, achUri);
        emit URI(achUri, achievementId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
