import { parseAbi } from 'viem';

export const VIBE_COORDINATOR_CONTRACT_ADDRESS =
  import.meta.env?.VITE_COORDINATOR_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000';

export const COORDINATOR_ABI = parseAbi([
  'function name() view returns (string)',
  'function version() view returns (string)',
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function getAgentDashboard(address user) view returns ((uint256 vibeBalance, uint256 nftCount, uint256 currentStreak, uint256 longestStreak, uint256 totalCheckIns, uint256 lastCheckInTimestamp, bool canCheckInToday, uint256 secondsUntilNextCheckIn, bool[] achievementsClaimed))',
  'function getEcosystemAddresses() view returns ((address tokenVibe, address vibeClubNft, address stakingContract, address holderDistributor, address royaltyDistributor, address dailyCheckIn, address achievements, address buybackPool))',
  'function getEcosystemStats() view returns ((uint256 totalCheckInUsers, uint256 totalGlobalCheckIns, uint256 totalUniqueAchievements, uint256 totalGlobalAchievementClaims))',
  'function executeCheckIn() external',
  'function executeCheckInFor(address user) external',
  'function executeClaimAchievement(uint256 achievementId) external',
  'function executeClaimAchievements(uint256[] calldata achievementIds) external',
  'function executeClaimAchievementFor(address user, uint256 achievementId) external',
  'function executeClaimHolderRewards(uint256 roundId, uint256 amount, bytes32[] calldata merkleProof) external',
  'function executeClaimRoyalty(uint256 epochId, uint256 amount, bytes32[] calldata merkleProof) external',
  'function executeMintVibeClub(uint256 amount) external payable',
  'function updateContractAddress(string memory nameKey, address newAddress) external',
  'function setOperator(address operator, bool authorized) external',
  'function transferOwnership(address newOwner) external',
  'function pause() external',
  'function unpause() external',
  'event ContractAddressUpdated(string indexed nameKey, address indexed oldAddress, address indexed newAddress)',
  'event AgentActionExecuted(address indexed caller, string action, bytes data)'
]);
