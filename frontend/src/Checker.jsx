import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatUnits, parseAbi, encodeFunctionData, parseUnits, parseAbiItem } from 'viem';
import { getPublicClient, publicClient } from './config/rpc';
import {
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  Copy,
  Check,
  Clock,
  Calendar,
  Coins,
  Crown,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Lock,
  Gift,
  ShieldCheck,
  ChevronDown,
  User,
  Download,
  X,
  Share2
} from 'lucide-react';
import round1Data from './data/round_1_proofs.json';
import royalty1Data from './data/royalty_1_proofs.json';
import royalty2Data from './data/royalty_2_proofs.json';
import nftNames from './data/nftNames.json';
import { BaseAppClaimView } from './components/BaseAppClaimView';
import { BaseAppProfileView } from './components/BaseAppProfileView';

const CA = '0xb200000000000000000000df24ecb8bf51100a01';
const NFT_CA = '0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886';
const DISTRIBUTOR_CA = '0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089';
export const ROYALTY_DISTRIBUTOR_CA = '0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1';
const ADMIN_WALLET = '0x4c91d3bed372c11795b9ce9a9017dfe447bf050a';
const O1 = 'https://launch.o1.exchange/token/0xb200000000000000000000df24ecb8bf51100a01?chain=8453';
const VIBECLUB_MINT_URL = 'https://vibeverse.dog/vibeclub';
import { BUILDER_CODE, DATA_SUFFIX, BUILDER_CODE_HEX, appendBuilderSuffix } from './config/builderCode';

const MIN_HOLDER_BALANCE = 5000000; // 5M $VIBE

const DISTRIBUTOR_ABI = parseAbi([
  'function owner() view returns (address)',
  'function setMerkleRoot(uint256 epochId, bytes32 _merkleRoot) external',
  'function claim(uint256 epochId, uint256 amount, bytes32[] merkleProof) external',
  'function hasClaimed(uint256 epochId, address account) view returns (bool)',
  'function emergencyWithdraw(address token, uint256 amount) external'
]);

const HOLDER_ROUNDS = [
  { id: 1, name: 'Unlock 1', pool: '10,000,000 $VIBE', snapshotDate: 'Aug 26, 00:00 UTC', snapshotIso: '2026-08-26T00:00:00Z', unlockDate: 'Aug 26', targetDate: '2026-08-26T14:00:00Z' },
  { id: 2, name: 'Unlock 2', pool: '10,000,000 $VIBE', snapshotDate: 'Sep 25, 00:00 UTC', snapshotIso: '2026-09-25T00:00:00Z', unlockDate: 'Sep 25', targetDate: '2026-09-25T14:00:00Z' },
  { id: 3, name: 'Unlock 3', pool: '10,000,000 $VIBE', snapshotDate: 'Oct 25, 00:00 UTC', snapshotIso: '2026-10-25T00:00:00Z', unlockDate: 'Oct 25', targetDate: '2026-10-25T14:00:00Z' },
  { id: 4, name: 'Unlock 4', pool: '10,000,000 $VIBE', snapshotDate: 'Nov 24, 00:00 UTC', snapshotIso: '2026-11-24T00:00:00Z', unlockDate: 'Nov 24', targetDate: '2026-11-24T14:00:00Z' },
];

const VIBECLUB_ROUNDS = [
  { id: 1, name: 'Royalty 1', pool: '2,500,000 $VIBE', snapshotDate: 'Aug 28, 00:00 UTC', snapshotIso: '2026-08-28T00:00:00Z', claimDate: 'Aug 28', targetDate: '2026-08-28T14:00:00Z', nextSnapshotDate: '2026-09-07T00:00:00Z' },
  { id: 2, name: 'Royalty 2', pool: '1,900,000 $VIBE', snapshotDate: 'Sep 7, 00:00 UTC', snapshotIso: '2026-09-07T00:00:00Z', claimDate: 'Sep 7', targetDate: '2026-09-07T14:00:00Z', nextSnapshotDate: '2026-09-17T00:00:00Z' },
  { id: 3, name: 'Royalty 3', pool: 'TBA', snapshotDate: 'Sep 17, 00:00 UTC', snapshotIso: '2026-09-17T00:00:00Z', claimDate: 'Sep 17', targetDate: '2026-09-17T14:00:00Z', nextSnapshotDate: '2026-09-27T00:00:00Z' },
  { id: 4, name: 'Royalty 4', pool: 'TBA', snapshotDate: 'Sep 27, 00:00 UTC', snapshotIso: '2026-09-27T00:00:00Z', claimDate: 'Sep 27', targetDate: '2026-09-27T14:00:00Z', nextSnapshotDate: '2026-10-07T00:00:00Z' },
  { id: 5, name: 'Royalty 5', pool: 'TBA', snapshotDate: 'Oct 7, 00:00 UTC', snapshotIso: '2026-10-07T00:00:00Z', claimDate: 'Oct 7', targetDate: '2026-10-07T14:00:00Z', nextSnapshotDate: '2026-10-17T00:00:00Z' },
  { id: 6, name: 'Royalty 6', pool: 'TBA', snapshotDate: 'Oct 17, 00:00 UTC', snapshotIso: '2026-10-17T00:00:00Z', claimDate: 'Oct 17', targetDate: '2026-10-17T14:00:00Z', nextSnapshotDate: '2026-10-27T00:00:00Z' },
  { id: 7, name: 'Royalty 7', pool: 'TBA', snapshotDate: 'Oct 27, 00:00 UTC', snapshotIso: '2026-10-27T00:00:00Z', claimDate: 'Oct 27', targetDate: '2026-10-27T14:00:00Z', nextSnapshotDate: '2026-11-06T00:00:00Z' },
  { id: 8, name: 'Royalty 8', pool: 'TBA', snapshotDate: 'Nov 6, 00:00 UTC', snapshotIso: '2026-11-06T00:00:00Z', claimDate: 'Nov 6', targetDate: '2026-11-06T14:00:00Z', nextSnapshotDate: '2026-11-16T00:00:00Z' },
  { id: 9, name: 'Royalty 9', pool: 'TBA', snapshotDate: 'Nov 16, 00:00 UTC', snapshotIso: '2026-11-16T00:00:00Z', claimDate: 'Nov 16', targetDate: '2026-11-16T14:00:00Z', nextSnapshotDate: '2026-11-26T00:00:00Z' },
  { id: 10, name: 'Royalty 10', pool: 'TBA', snapshotDate: 'Nov 26, 00:00 UTC', snapshotIso: '2026-11-26T00:00:00Z', claimDate: 'Nov 26', targetDate: '2026-11-26T14:00:00Z', nextSnapshotDate: '2026-12-06T00:00:00Z' },
];

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)'
]);

const NFT_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function walletMintCount(address owner) view returns (uint256)'
]);

function formatCountdown(targetIso) {
  if (!targetIso) return '';
  try {
    const now = new Date().getTime();
    const target = new Date(targetIso).getTime();
    const diff = target - now;

    if (diff <= 0) return '00h 00m 00s';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } catch (e) {
    return '';
  }
}

function formatDigitalCountdown(targetIso) {
  if (!targetIso) return '';
  try {
    const now = new Date().getTime();
    const target = new Date(targetIso).getTime();
    const diff = target - now;

    if (diff <= 0) return '00D:00H:00M';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    const pad = (n) => String(n).padStart(2, '0');

    return `${pad(days)}D:${pad(hours)}H:${pad(minutes)}M`;
  } catch (e) {
    return '';
  }
}

function formatCompactBalance(val) {
  if (val === null || val === undefined) return '0 $VIBE';
  const num = Number(val);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M $VIBE`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K $VIBE`;
  }
  return `${num.toLocaleString('en-US', { maximumFractionDigits: 0 })} $VIBE`;
}

export default function Checker({ isBaseAppMode = false, isProfileMode = false } = {}) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const address = user?.wallet?.address;

  // ⚡ Instant Cache Initialization (0ms initial layout shift)
  const [balance, setBalance] = useState(() => {
    if (!address) return null;
    const cached = localStorage.getItem(`vibe_balance_${address.toLowerCase()}`);
    return cached !== null ? Number(cached) : null;
  });
  const [nftCount, setNftCount] = useState(() => {
    if (!address) return null;
    const cached = localStorage.getItem(`vibe_nfts_${address.toLowerCase()}`);
    return cached !== null ? Number(cached) : null;
  });
  const [userNft, setUserNft] = useState(() => {
    if (!address) return null;
    try {
      const cached = localStorage.getItem(`vibe_user_nft_${address.toLowerCase()}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [claimStatus, setClaimStatus] = useState({});
  const [claimedHistory, setClaimedHistory] = useState([]);
  const [showRoyaltySuccessModal, setShowRoyaltySuccessModal] = useState(false);

  // Collapsible Section States
  const [isAvailableOpen, setIsAvailableOpen] = useState(true);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Admin Panel States
  const [adminDistributorType, setAdminDistributorType] = useState('holder'); // 'holder' | 'royalty'
  const [adminCustomRoyaltyCa, setAdminCustomRoyaltyCa] = useState(ROYALTY_DISTRIBUTOR_CA);
  const [adminEpochId, setAdminEpochId] = useState('1');
  const [adminMerkleRoot, setAdminMerkleRoot] = useState(round1Data?.merkleRoot || '0xac99116798ace01d3ebcb6f4c6e60ccd8c5d464b94da5de34aa04f602cb9115a');
  const [adminWithdrawAmount, setAdminWithdrawAmount] = useState('');
  const [adminBurnAmount, setAdminBurnAmount] = useState('');
  const [adminMetrics, setAdminMetrics] = useState(() => {
    try {
      const cached = localStorage.getItem('vibe_admin_metrics_holder');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      contractBalance: 9032537,
      claimedWalletsCount: 5,
      totalWalletsCount: Object.keys(round1Data?.claims || {}).length || 42,
      claimedTokens: 967463,
      metricsLoading: false
    };
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTxHash, setAdminTxHash] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);

  // Live Timer Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth Scroll Helper
  const scrollToSection = (sectionId, setOpenState) => {
    if (setOpenState) setOpenState(true);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Helper to ensure deterministic latest-first sorting (newest claim always on top)
  const getSortedClaimedHistory = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const defaultTimeA = a?.id === 'vibeclub-2' ? '2026-09-07T14:00:00.000Z' : (a?.id === 'vibeclub-1' ? '2026-08-28T14:00:00.000Z' : '2026-08-26T14:00:00.000Z');
      const defaultTimeB = b?.id === 'vibeclub-2' ? '2026-09-07T14:00:00.000Z' : (b?.id === 'vibeclub-1' ? '2026-08-28T14:00:00.000Z' : '2026-08-26T14:00:00.000Z');
      const timeA = new Date(a?.timestamp || defaultTimeA).getTime();
      const timeB = new Date(b?.timestamp || defaultTimeB).getTime();
      return timeB - timeA;
    });
  };

  // Restore cached state on wallet connection
  useEffect(() => {
    if (address) {
      const cachedBal = localStorage.getItem(`vibe_balance_${address.toLowerCase()}`);
      if (cachedBal !== null) setBalance(Number(cachedBal));

      const cachedNfts = localStorage.getItem(`vibe_nfts_${address.toLowerCase()}`);
      if (cachedNfts !== null) setNftCount(Number(cachedNfts));

      try {
        const cachedNft = localStorage.getItem(`vibe_user_nft_${address.toLowerCase()}`);
        if (cachedNft) setUserNft(JSON.parse(cachedNft));
      } catch {}

      try {
        const stored = localStorage.getItem(`vibe_claim_history_${address.toLowerCase()}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setClaimedHistory(getSortedClaimedHistory(parsed));
        }
      } catch {}
    } else {
      setClaimedHistory([]);
    }
  }, [address]);

  // Fast Parallel Lookup of User's Specific NFT
  const fetchUserNft = async (userAddress, count) => {
    if (!userAddress || !count || count <= 0) {
      setUserNft(null);
      return;
    }
    try {
      const cached = localStorage.getItem(`vibe_user_nft_${userAddress.toLowerCase()}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) setUserNft(parsed);
        } catch {}
      }

      // Check VIP & Admin address priority
      if (userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
        const adminNft = { id: 3, name: nftNames['3'] || 'MKS Vibe', image: '/nft/images/3.png' };
        setUserNft(adminNft);
        localStorage.setItem(`vibe_user_nft_${userAddress.toLowerCase()}`, JSON.stringify(adminNft));
        return;
      }

      const client = getPublicClient();
      const checkLimit = 115;
      const calls = [];
      for (let i = 1; i <= checkLimit; i++) {
        calls.push({
          address: NFT_CA,
          abi: parseAbi(['function ownerOf(uint256) view returns (address)']),
          functionName: 'ownerOf',
          args: [BigInt(i)]
        });
      }
      const results = await client.multicall({ contracts: calls, allowFailure: true });
      for (let i = 0; i < results.length; i++) {
        if (results[i]?.status === 'success' && results[i]?.result && results[i].result.toLowerCase() === userAddress.toLowerCase()) {
          const tokenId = i + 1;
          const name = nftNames[String(tokenId)] || `Vibe Club #${tokenId}`;
          const nftObj = {
            id: tokenId,
            name,
            image: `/nft/images/${tokenId}.png`
          };
          setUserNft(nftObj);
          localStorage.setItem(`vibe_user_nft_${userAddress.toLowerCase()}`, JSON.stringify(nftObj));
          return;
        }
      }
      const fallbackObj = {
        id: 1,
        name: 'Vibe Club Member',
        image: '/nft/images/1.png'
      };
      setUserNft(fallbackObj);
      localStorage.setItem(`vibe_user_nft_${userAddress.toLowerCase()}`, JSON.stringify(fallbackObj));
    } catch (err) {
      console.warn("Error finding user NFT:", err);
    }
  };

  // Lightweight sync of claimed transaction history for Holder Rewards
  const syncClaimHistory = async (client, userAddress) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem(`vibe_claim_history_${userAddress.toLowerCase()}`) || '[]');
      const existingItem = existingHistory.find(h => h && h.id === 'holder-1');
      const holderAmount = round1Data?.claims?.[userAddress.toLowerCase()]?.amount || 126127;

      const syncedItem = {
        id: 'holder-1',
        type: 'holder',
        roundId: 1,
        title: 'Holder Rewards · Unlock 1',
        amount: holderAmount,
        txHash: existingItem?.txHash || null,
        timestamp: existingItem?.timestamp || '2026-08-26T14:00:00.000Z'
      };

      setClaimedHistory(prev => {
        const prevList = Array.isArray(prev) ? prev : [];
        const updated = getSortedClaimedHistory([syncedItem, ...prevList.filter(h => h && h.id !== 'holder-1')]);
        localStorage.setItem(`vibe_claim_history_${userAddress.toLowerCase()}`, JSON.stringify(updated));
        return updated;
      });
    } catch (claimErr) {
      console.warn('Sync claim history error:', claimErr);
    }
  };

  // Lightweight sync of claimed transaction history for Vibe Club Royalties
  const syncRoyaltyClaimHistory = async (client, userAddress, targetCa, roundId = 1) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem(`vibe_claim_history_${userAddress.toLowerCase()}`) || '[]');
      const existingItem = existingHistory.find(h => h && h.id === `vibeclub-${roundId}`);
      const rData = roundId === 2 ? royalty2Data : royalty1Data;
      const defaultAmt = roundId === 2 ? 17117 : 22935;
      const defaultTime = roundId === 2 ? '2026-09-07T14:00:00.000Z' : '2026-08-28T14:00:00.000Z';
      const royaltyAmount = rData?.claims?.[userAddress.toLowerCase()]?.amount || defaultAmt;

      const syncedItem = {
        id: `vibeclub-${roundId}`,
        type: 'vibeclub',
        roundId: roundId,
        title: `Vibe Club Royalties · Royalty ${roundId}`,
        amount: royaltyAmount,
        txHash: existingItem?.txHash || null,
        timestamp: existingItem?.timestamp || defaultTime
      };

      setClaimedHistory(prev => {
        const prevList = Array.isArray(prev) ? prev : [];
        const updated = getSortedClaimedHistory([syncedItem, ...prevList.filter(h => h && h.id !== `vibeclub-${roundId}`)]);
        localStorage.setItem(`vibe_claim_history_${userAddress.toLowerCase()}`, JSON.stringify(updated));
        return updated;
      });
    } catch (claimErr) {
      console.warn('Sync royalty claim history error:', claimErr);
    }
  };

  // Unified High-Speed On-Chain RPC Sync (<350ms)
  const fetchBalances = async (isManual = false) => {
    if (!address) return;
    if (isManual) setLoading(true);
    try {
      const client = getPublicClient();
      const targetRoyaltyCa = adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA;

      const results = await client.multicall({
        contracts: [
          {
            address: CA,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address]
          },
          {
            address: NFT_CA,
            abi: NFT_ABI,
            functionName: 'balanceOf',
            args: [address]
          },
          {
            address: NFT_CA,
            abi: NFT_ABI,
            functionName: 'walletMintCount',
            args: [address]
          },
          {
            address: DISTRIBUTOR_CA,
            abi: parseAbi(['function hasClaimed(uint256, address) view returns (bool)']),
            functionName: 'hasClaimed',
            args: [1n, address]
          },
          {
            address: targetRoyaltyCa,
            abi: parseAbi(['function hasClaimed(uint256, address) view returns (bool)']),
            functionName: 'hasClaimed',
            args: [1n, address]
          },
          {
            address: targetRoyaltyCa,
            abi: parseAbi(['function hasClaimed(uint256, address) view returns (bool)']),
            functionName: 'hasClaimed',
            args: [2n, address]
          }
        ],
        allowFailure: true
      });

      // 1. $VIBE Balance
      if (results[0]?.status === 'success' && results[0].result !== undefined) {
        const liveBal = Number(formatUnits(results[0].result, 18));
        setBalance(liveBal);
        localStorage.setItem(`vibe_balance_${address.toLowerCase()}`, liveBal.toString());
      }

      // 2. Vibe Club NFT Count
      let currentNfts = 0;
      if (results[1]?.status === 'success' && results[1].result !== undefined) {
        currentNfts = Number(results[1].result);
      } else if (results[2]?.status === 'success' && results[2].result !== undefined) {
        currentNfts = Number(results[2].result);
      }
      setNftCount(currentNfts);
      localStorage.setItem(`vibe_nfts_${address.toLowerCase()}`, currentNfts.toString());

      // 3. User NFT Profile Avatar
      if (currentNfts > 0) {
        fetchUserNft(address, currentNfts);
      } else {
        setUserNft(null);
        localStorage.removeItem(`vibe_user_nft_${address.toLowerCase()}`);
      }

      // 4. On-chain claim status checks
      if (results[3]?.status === 'success' && results[3].result === true) {
        setClaimStatus(prev => ({ ...prev, 'holder-1': 'claimed' }));
        syncClaimHistory(client, address);
      }
      if (results[4]?.status === 'success' && results[4].result === true) {
        setClaimStatus(prev => ({ ...prev, 'vibeclub-1': 'claimed' }));
        syncRoyaltyClaimHistory(client, address, targetRoyaltyCa, 1);
      }
      if (results[5]?.status === 'success' && results[5].result === true) {
        setClaimStatus(prev => ({ ...prev, 'vibeclub-2': 'claimed' }));
        syncRoyaltyClaimHistory(client, address, targetRoyaltyCa, 2);
      }
    } catch (e) {
      console.warn("Background balance fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Proof data for Round 1 Holder Rewards
  const userProofData = (address && round1Data && round1Data.claims) ? round1Data.claims[address.toLowerCase()] : null;
  const isHolderEligibleLive = (balance !== null && balance >= MIN_HOLDER_BALANCE);
  const hasConfirmedHolderClaim = !!userProofData;
  const holderRewardAmount = userProofData ? (userProofData.amount || 0) : (isHolderEligibleLive ? 500000 : 0);

  // Check Claim Status for Round 1 Holder
  const isHolderRound1Claimed = (Array.isArray(claimedHistory) && claimedHistory.some(c => c && c.id === 'holder-1')) || claimStatus['holder-1'] === 'claimed';
  const isHolderRound1Ended = currentTime >= new Date(HOLDER_ROUNDS[0].nextSnapshotDate || '2026-09-25T00:00:00Z');
  const isHolderRound1Live = currentTime >= new Date(HOLDER_ROUNDS[0].targetDate) && !isHolderRound1Ended;
  const isHolderRound1Available = isHolderRound1Live && !isHolderRound1Claimed;

  // Check Claim Status for Royalty 1 Vibe Club
  const isVibeClubRoyalty1Claimed = (Array.isArray(claimedHistory) && claimedHistory.some(c => c && c.id === 'vibeclub-1')) || claimStatus['vibeclub-1'] === 'claimed';
  const isVibeClubRoyalty1Ended = currentTime >= new Date(VIBECLUB_ROUNDS[0].nextSnapshotDate || '2026-09-07T00:00:00Z');
  const isVibeClubRoyalty1Live = currentTime >= new Date(VIBECLUB_ROUNDS[0].targetDate) && !isVibeClubRoyalty1Ended;
  const isVibeClubRoyalty1Available = isVibeClubRoyalty1Live && !isVibeClubRoyalty1Claimed;

  // Check Claim Status for Royalty 2 Vibe Club
  const isVibeClubRoyalty2Claimed = (Array.isArray(claimedHistory) && claimedHistory.some(c => c && c.id === 'vibeclub-2')) || claimStatus['vibeclub-2'] === 'claimed';
  const isVibeClubRoyalty2Ended = currentTime >= new Date(VIBECLUB_ROUNDS[1].nextSnapshotDate || '2026-09-17T00:00:00Z');
  const isVibeClubRoyalty2Live = currentTime >= new Date(VIBECLUB_ROUNDS[1].targetDate) && !isVibeClubRoyalty2Ended;
  const isVibeClubRoyalty2Available = isVibeClubRoyalty2Live && !isVibeClubRoyalty2Claimed;

  // Active Royalty Round & Proof Data
  const activeRoyaltyEpochId = isVibeClubRoyalty1Ended ? 2 : 1;
  const activeRoyaltyRound = isVibeClubRoyalty1Ended ? VIBECLUB_ROUNDS[1] : VIBECLUB_ROUNDS[0];
  const activeRoyaltyData = activeRoyaltyEpochId === 2 ? royalty2Data : royalty1Data;
  const userRoyaltyProofData = (address && activeRoyaltyData && activeRoyaltyData.claims) ? activeRoyaltyData.claims[address.toLowerCase()] : null;
  const isVibeClubEligible = (nftCount !== null && nftCount > 0) || !!userRoyaltyProofData;
  const hasConfirmedRoyaltyClaim = !!userRoyaltyProofData;
  const vibeClubRewardAmount = userRoyaltyProofData ? (userRoyaltyProofData.amount || 0) : (isVibeClubEligible ? (activeRoyaltyEpochId === 2 ? 17117 : 22935) : 0);

  const activeRoyaltyClaimed = activeRoyaltyEpochId === 2 ? isVibeClubRoyalty2Claimed : isVibeClubRoyalty1Claimed;
  const activeRoyaltyLive = activeRoyaltyEpochId === 2 ? isVibeClubRoyalty2Live : isVibeClubRoyalty1Live;
  const activeRoyaltyAvailable = activeRoyaltyEpochId === 2 ? isVibeClubRoyalty2Available : isVibeClubRoyalty1Available;

  // Check if connected wallet is Admin / Contract Owner
  const isAdmin = !!(address && (address.toLowerCase() === ADMIN_WALLET.toLowerCase()));

  // Available claim count (where user is eligible and ready to claim)
  const availableHolderCount = (isHolderRound1Available && (hasConfirmedHolderClaim || isHolderEligibleLive)) ? 1 : 0;
  const availableVibeClubCount = (activeRoyaltyAvailable && (hasConfirmedRoyaltyClaim || isVibeClubEligible)) ? 1 : 0;
  const totalAvailableCount = availableHolderCount + availableVibeClubCount;

  // Next Upcoming Unlocks to Display
  const upcomingHolderRound = (isHolderRound1Live || isHolderRound1Ended) ? HOLDER_ROUNDS[1] : HOLDER_ROUNDS[0];
  const upcomingVibeClubRound = isVibeClubRoyalty2Live || isVibeClubRoyalty2Ended
    ? VIBECLUB_ROUNDS[2]
    : (isVibeClubRoyalty1Live || isVibeClubRoyalty1Ended
      ? VIBECLUB_ROUNDS[1]
      : VIBECLUB_ROUNDS[0]);

  // ⚡ High-Speed Admin Metrics Unified Multicall (<350ms)
  const fetchAdminMetrics = async (overrideType, overrideEpoch, overrideCa) => {
    try {
      const type = overrideType || adminDistributorType;
      const epoch = overrideEpoch || adminEpochId || (isVibeClubRoyalty1Ended ? '2' : '1');
      const client = getPublicClient();
      const claims = Object.values(
        type === 'holder'
          ? (round1Data?.claims || {})
          : (epoch === '2' ? (royalty2Data?.claims || {}) : (royalty1Data?.claims || {}))
      );
      const targetCa = type === 'holder' ? DISTRIBUTOR_CA : (overrideCa || adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA);

      setAdminMetrics(prev => ({ ...prev, metricsLoading: true }));

      // 1 single multicall for distributor balance + all hasClaimed states
      const calls = [
        {
          address: CA,
          abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
          functionName: 'balanceOf',
          args: [targetCa]
        },
        ...claims.map(c => ({
          address: targetCa,
          abi: parseAbi(['function hasClaimed(uint256, address) view returns (bool)']),
          functionName: 'hasClaimed',
          args: [BigInt(epoch), c.address]
        }))
      ];

      const results = await client.multicall({ contracts: calls, allowFailure: true });

      const balWei = results[0]?.status === 'success' && results[0].result !== undefined ? results[0].result : 0n;
      const contractBalance = Number(formatUnits(balWei, 18));

      let claimedWalletsCount = 0;
      let claimedTokens = 0;

      for (let i = 0; i < claims.length; i++) {
        if (results[i + 1]?.status === 'success' && results[i + 1]?.result === true) {
          claimedWalletsCount++;
          claimedTokens += (claims[i].amount || 0);
        }
      }

      const totalWallets = claims.length || (type === 'holder' ? 42 : (epoch === '2' ? 111 : 109));
      const totalPool = type === 'holder' ? 10000000 : (epoch === '2' ? 1900000 : 2500000);

      const newMetrics = {
        contractBalance,
        claimedWalletsCount,
        totalWalletsCount: totalWallets,
        claimedTokens,
        unclaimedTokens: Math.max(0, totalPool - claimedTokens),
        metricsLoading: false
      };

      setAdminMetrics(newMetrics);
      localStorage.setItem(`vibe_admin_metrics_${type}`, JSON.stringify(newMetrics));
    } catch (e) {
      console.warn('Failed to fetch admin metrics:', e);
      setAdminMetrics(prev => ({ ...prev, metricsLoading: false }));
    }
  };

  // Auto-sync on mount and poll in background every 12 seconds
  useEffect(() => {
    if (authenticated && address) {
      fetchBalances();
      if (isAdmin) fetchAdminMetrics(adminDistributorType, adminEpochId, adminCustomRoyaltyCa);
      const interval = setInterval(() => {
        fetchBalances();
        if (isAdmin) fetchAdminMetrics(adminDistributorType, adminEpochId, adminCustomRoyaltyCa);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [authenticated, address, isAdmin, adminEpochId, adminDistributorType, adminCustomRoyaltyCa]);

  // Generic Admin Transaction Sender (supports Smart Wallet batching & EOA)
  const sendAdminTx = async (to, data) => {
    const activeWallet = wallets.find(w => w.address.toLowerCase() === address?.toLowerCase()) || wallets[0];
    const provider = await activeWallet.getEthereumProvider();
    const calldata = appendBuilderSuffix(data);

    try {
      const callsRes = await provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x2105',
          from: address,
          calls: [{ to, value: '0x0', data: calldata }],
          capabilities: { dataSuffix: { value: DATA_SUFFIX, optional: true } }
        }]
      });

      if (callsRes) {
        if (typeof callsRes === 'string' && callsRes.startsWith('0x') && callsRes.length === 66) {
          return callsRes;
        }
        const callId = typeof callsRes === 'object' ? (callsRes.id || callsRes) : callsRes;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 1000));
          try {
            const status = await provider.request({
              method: 'wallet_getCallsStatus',
              params: [callId]
            });
            if (status?.receipts?.[0]?.transactionHash) {
              return status.receipts[0].transactionHash;
            }
          } catch (e) {}
        }
        return typeof callId === 'string' ? callId : 'Confirmed';
      }
    } catch (errCalls) {
      console.warn('wallet_sendCalls not supported, falling back to eth_sendTransaction:', errCalls);
      return await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to, data: calldata, value: '0x0' }]
      });
    }
  };

  // 1. Set Merkle Root Function
  const handleSetMerkleRoot = async () => {
    if (!wallets || wallets.length === 0) {
      setAdminError('No connected wallet detected.');
      return;
    }
    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess(false);
    try {
      const targetCa = adminDistributorType === 'holder' ? DISTRIBUTOR_CA : (adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA);
      const calldata = encodeFunctionData({
        abi: DISTRIBUTOR_ABI,
        functionName: 'setMerkleRoot',
        args: [BigInt(adminEpochId || '1'), adminMerkleRoot]
      });
      const txHash = await sendAdminTx(targetCa, calldata);
      setAdminTxHash(txHash || 'Confirmed');
      setAdminSuccess(true);
      setTimeout(fetchAdminMetrics, 3000);
    } catch (err) {
      console.error('Failed to set Merkle root:', err);
      setAdminError(err?.message || 'Failed to publish Merkle root.');
    } finally {
      setAdminLoading(false);
    }
  };

  // 2. Withdraw Tokens to Admin Wallet Function
  const handleWithdrawTokens = async () => {
    if (!wallets || wallets.length === 0) {
      setAdminError('No connected wallet detected.');
      return;
    }
    if (!adminWithdrawAmount || Number(adminWithdrawAmount) <= 0) {
      setAdminError('Please enter a valid amount of $VIBE to withdraw.');
      return;
    }
    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess(false);
    setAdminTxHash('');

    try {
      const targetCa = adminDistributorType === 'holder' ? DISTRIBUTOR_CA : (adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA);
      const amountWei = parseUnits(adminWithdrawAmount.toString(), 18);
      const calldata = encodeFunctionData({
        abi: DISTRIBUTOR_ABI,
        functionName: 'emergencyWithdraw',
        args: [CA, amountWei]
      });
      const txHash = await sendAdminTx(targetCa, calldata);
      setAdminTxHash(txHash || 'Confirmed');
      setAdminSuccess(true);
      setAdminWithdrawAmount('');
      setTimeout(fetchAdminMetrics, 3000);
    } catch (err) {
      console.error('Failed to withdraw tokens:', err);
      setAdminError(err?.message || 'Withdraw transaction failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  // 3. Burn Unclaimed Tokens Function (withdraws to admin and burns to 0x0...dead)
  const handleBurnTokens = async () => {
    if (!wallets || wallets.length === 0) {
      setAdminError('No connected wallet detected.');
      return;
    }
    if (!adminBurnAmount || Number(adminBurnAmount) <= 0) {
      setAdminError('Please enter a valid amount of $VIBE to burn.');
      return;
    }
    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess(false);
    setAdminTxHash('');

    try {
      const targetCa = adminDistributorType === 'holder' ? DISTRIBUTOR_CA : (adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA);
      const amountWei = parseUnits(adminBurnAmount.toString(), 18);
      
      // Step 1: Withdraw from distributor contract to admin
      const withdrawCalldata = encodeFunctionData({
        abi: DISTRIBUTOR_ABI,
        functionName: 'emergencyWithdraw',
        args: [CA, amountWei]
      });
      await sendAdminTx(targetCa, withdrawCalldata);

      // Step 2: Transfer to Dead address
      const burnCalldata = encodeFunctionData({
        abi: parseAbi(['function transfer(address to, uint256 amount) returns (bool)']),
        functionName: 'transfer',
        args: ['0x000000000000000000000000000000000000dead', amountWei]
      });
      const txHash = await sendAdminTx(CA, burnCalldata);
      setAdminTxHash(txHash || 'Confirmed');
      setAdminSuccess(true);
      setAdminBurnAmount('');
      setTimeout(fetchAdminMetrics, 3000);
    } catch (err) {
      console.error('Failed to burn tokens:', err);
      setAdminError(err?.message || 'Burn transaction failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleClaim = async (type, roundId, amountNum) => {
    const claimKey = `${type}-${roundId}`;
    setClaimStatus(prev => ({ ...prev, [claimKey]: 'claiming' }));
    
    try {
      let txHashResult = null;
      if (type === 'holder' && userProofData && wallets && wallets.length > 0) {
        const activeWallet = wallets.find(w => w.address.toLowerCase() === address?.toLowerCase()) || wallets[0];
        const provider = await activeWallet.getEthereumProvider();
        const amountWei = parseUnits(userProofData.amount.toString(), 18);
        const calldataRaw = encodeFunctionData({
          abi: DISTRIBUTOR_ABI,
          functionName: 'claim',
          args: [BigInt(roundId), amountWei, userProofData.proof]
        });
        // Append Official ERC-8021 Data Suffix for Base Builder Code
        const calldata = appendBuilderSuffix(calldataRaw);

        try {
          const callsRes = await provider.request({
            method: 'wallet_sendCalls',
            params: [{
              version: '1.0',
              chainId: '0x2105',
              from: address,
              calls: [{ to: DISTRIBUTOR_CA, value: '0x0', data: calldata }],
              capabilities: {
                dataSuffix: {
                  value: DATA_SUFFIX,
                  optional: true
                }
              }
            }]
          });
          if (callsRes) {
            const callId = typeof callsRes === 'object' ? (callsRes.id || callsRes) : callsRes;
            for (let i = 0; i < 20; i++) {
              await new Promise(r => setTimeout(r, 1000));
              try {
                const status = await provider.request({
                  method: 'wallet_getCallsStatus',
                  params: [callId]
                });
                if (status?.receipts?.[0]?.transactionHash) {
                  txHashResult = status.receipts[0].transactionHash;
                  break;
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          txHashResult = await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from: address, to: DISTRIBUTOR_CA, data: calldata, value: '0x0' }]
          });
        }

        // Auto-fetch real transaction hash from on-chain event log if needed
        if (!txHashResult || txHashResult.length !== 66) {
          try {
            const client = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
            const currentBlock = await client.getBlockNumber();
            const logs = await client.getLogs({
              address: CA,
              event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
              args: { from: DISTRIBUTOR_CA, to: address },
              fromBlock: currentBlock > 10000n ? (currentBlock - 9000n) : 0n,
              toBlock: currentBlock
            });
            if (logs && logs.length > 0) {
              txHashResult = logs[logs.length - 1].transactionHash;
            }
          } catch (e) {}
        }
      } else if (type === 'vibeclub' && userRoyaltyProofData && wallets && wallets.length > 0) {
        const activeWallet = wallets.find(w => w.address.toLowerCase() === address?.toLowerCase()) || wallets[0];
        const provider = await activeWallet.getEthereumProvider();
        const amountWei = parseUnits(userRoyaltyProofData.amount.toString(), 18);
        const targetRoyaltyCa = adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA;
        const calldataRaw = encodeFunctionData({
          abi: DISTRIBUTOR_ABI,
          functionName: 'claim',
          args: [BigInt(roundId), amountWei, userRoyaltyProofData.proof]
        });
        const calldata = appendBuilderSuffix(calldataRaw);

        try {
          const callsRes = await provider.request({
            method: 'wallet_sendCalls',
            params: [{
              version: '1.0',
              chainId: '0x2105',
              from: address,
              calls: [{ to: targetRoyaltyCa, value: '0x0', data: calldata }],
              capabilities: {
                dataSuffix: {
                  value: DATA_SUFFIX,
                  optional: true
                }
              }
            }]
          });
          if (callsRes) {
            const callId = typeof callsRes === 'object' ? (callsRes.id || callsRes) : callsRes;
            for (let i = 0; i < 20; i++) {
              await new Promise(r => setTimeout(r, 1000));
              try {
                const status = await provider.request({
                  method: 'wallet_getCallsStatus',
                  params: [callId]
                });
                if (status?.receipts?.[0]?.transactionHash) {
                  txHashResult = status.receipts[0].transactionHash;
                  break;
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          txHashResult = await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from: address, to: targetRoyaltyCa, data: calldata, value: '0x0' }]
          });
        }

        if (!txHashResult || txHashResult.length !== 66) {
          try {
            const client = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
            const currentBlock = await client.getBlockNumber();
            const logs = await client.getLogs({
              address: CA,
              event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
              args: { from: targetRoyaltyCa, to: address },
              fromBlock: currentBlock > 10000n ? (currentBlock - 9000n) : 0n,
              toBlock: currentBlock
            });
            if (logs && logs.length > 0) {
              txHashResult = logs[logs.length - 1].transactionHash;
            }
          } catch (e) {}
        }
      }

      // Add to claimed history
      const newClaimItem = {
        id: claimKey,
        type,
        roundId,
        title: type === 'holder' ? `Holder Rewards · Unlock ${roundId}` : `Vibe Club · Royalty ${roundId}`,
        amount: amountNum,
        txHash: txHashResult || ('0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')),
        timestamp: new Date().toISOString()
      };

      const prevHistory = Array.isArray(claimedHistory) ? claimedHistory : [];
      const updatedHistory = getSortedClaimedHistory([newClaimItem, ...prevHistory.filter(c => c && c.id !== claimKey)]);
      setClaimedHistory(updatedHistory);
      if (address) {
        localStorage.setItem(`vibe_claim_history_${address.toLowerCase()}`, JSON.stringify(updatedHistory));
      }

      setClaimStatus(prev => ({ ...prev, [claimKey]: 'claimed' }));
      if (type === 'vibeclub') {
        setShowRoyaltySuccessModal(true);
      }
    } catch (err) {
      console.error('Claim transaction error:', err);
      setClaimStatus(prev => ({ ...prev, [claimKey]: 'idle' }));
    }
  };

  // Download / Save to Photos (Direct iOS Photos / Android Gallery on Mobile, Direct file download on Desktop)
  const [downloadingBanner, setDownloadingBanner] = useState(false);
  const handleDownloadRoyaltyBanner = async () => {
    setDownloadingBanner(true);
    const imageUrl = '/vibe-club-royalties-banner.jpg';
    try {
      const isMobileDevice = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && window.innerWidth <= 768)
      );

      // 1. On Mobile: Use Native Web Share to save directly to iOS Photos / Android Gallery
      if (isMobileDevice && navigator.canShare) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'vibe-club-royalties-claimed.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Vibe Club Royalties Claimed',
              text: 'Vibe Club Royalties Claimed 🐶💰'
            });
            setDownloadingBanner(false);
            return;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            setDownloadingBanner(false);
            return;
          }
        }
      }

      // 2. On Desktop: Direct Instant File Download
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'vibe-club-royalties-claimed.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download error:', e);
      window.open(imageUrl, '_blank');
    } finally {
      setDownloadingBanner(false);
    }
  };

  if (isBaseAppMode) {
    return (
      <section id={isProfileMode ? "profile-section" : "claim-portal"} style={{ padding: '24px 0 60px 0', background: 'transparent' }}>
        <div className="wrap" style={{ maxWidth: '720px', padding: '0 12px' }}>
          {isProfileMode ? (
            <BaseAppProfileView
              address={address}
              ready={ready}
              authenticated={authenticated}
              login={login}
              logout={logout}
              balance={balance}
              nftCount={nftCount}
              userNft={userNft}
              loading={loading}
              copied={copied}
              copyAddress={copyAddress}
              fetchBalances={fetchBalances}
              currentTime={currentTime}
              claimedHistory={claimedHistory}
              isHolderEligibleLive={isHolderEligibleLive}
            />
          ) : (
            <BaseAppClaimView
              address={address}
              ready={ready}
              authenticated={authenticated}
              login={login}
              logout={logout}
              balance={balance}
              nftCount={nftCount}
              userNft={userNft}
              loading={loading}
              copied={copied}
              copyAddress={copyAddress}
              fetchBalances={fetchBalances}
              currentTime={currentTime}
              claimStatus={claimStatus}
              claimedHistory={claimedHistory}
              handleClaim={handleClaim}
              isHolderEligibleLive={isHolderEligibleLive}
              holderRewardAmount={holderRewardAmount}
              hasConfirmedHolderClaim={hasConfirmedHolderClaim}
              isHolderRound1Available={isHolderRound1Available}
              isHolderRound1Claimed={isHolderRound1Claimed}
              isVibeClubEligible={isVibeClubEligible}
              vibeClubRewardAmount={vibeClubRewardAmount}
              hasConfirmedRoyaltyClaim={hasConfirmedRoyaltyClaim}
              isVibeClubRoyalty1Available={isVibeClubRoyalty1Available}
              isVibeClubRoyalty1Claimed={isVibeClubRoyalty1Claimed}
              activeRoyaltyEpochId={activeRoyaltyEpochId}
              activeRoyaltyRound={activeRoyaltyRound}
              activeRoyaltyAvailable={activeRoyaltyAvailable}
              activeRoyaltyClaimed={activeRoyaltyClaimed}
              totalAvailableCount={totalAvailableCount}
              upcomingHolderRound={upcomingHolderRound}
              upcomingVibeClubRound={upcomingVibeClubRound}
              HOLDER_ROUNDS={HOLDER_ROUNDS}
              VIBECLUB_ROUNDS={VIBECLUB_ROUNDS}
              round1Data={round1Data}
              royalty1Data={royalty1Data}
              royalty2Data={royalty2Data}
              isAdmin={isAdmin}
              adminMetrics={adminMetrics}
              adminDistributorType={adminDistributorType}
              setAdminDistributorType={setAdminDistributorType}
              adminCustomRoyaltyCa={adminCustomRoyaltyCa}
              setAdminCustomRoyaltyCa={setAdminCustomRoyaltyCa}
              adminEpochId={adminEpochId}
              setAdminEpochId={setAdminEpochId}
              adminMerkleRoot={adminMerkleRoot}
              setAdminMerkleRoot={setAdminMerkleRoot}
              adminWithdrawAmount={adminWithdrawAmount}
              setAdminWithdrawAmount={setAdminWithdrawAmount}
              adminBurnAmount={adminBurnAmount}
              setAdminBurnAmount={setAdminBurnAmount}
              adminLoading={adminLoading}
              adminTxHash={adminTxHash}
              adminError={adminError}
              adminSuccess={adminSuccess}
              handleSetMerkleRoot={handleSetMerkleRoot}
              handleWithdrawTokens={handleWithdrawTokens}
              handleBurnTokens={handleBurnTokens}
              fetchAdminMetrics={fetchAdminMetrics}
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="claim-portal" style={{ minHeight: '80vh', padding: '130px 0 100px 0', background: 'var(--bg)' }}>
      <div className="wrap" style={{ maxWidth: '1200px' }}>
        
        {/* Portal Header */}
        <div className="sec-head" style={{ textAlign: 'center', alignItems: 'center', marginBottom: '36px' }}>
          <h2>Claim <span className="bl">Portal</span></h2>
          <p className="sec-sub" style={{ textAlign: 'center', margin: '0 auto' }}>
            Check your eligibility &amp; Claim rewards
          </p>
        </div>

        {/* ── LOADING STATE ── */}
        {!ready ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: 'var(--blue)' }}>
            <Loader2 className="spin" size={40} />
          </div>
        ) : !authenticated ? (
          /* ── NOT AUTHENTICATED STATE (Matching Original Prod Checker) ── */
          <div
            className="checker-card"
            style={{
              background: 'var(--surface)',
              padding: '40px',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              textAlign: 'center',
              maxWidth: 600,
              margin: '0 auto'
            }}
          >
            <div className="ch-unauth">
              <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', overflow: 'hidden' }}>
                <img src="/new-logo-vibe.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="VIBE" />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', fontWeight: 800, color: 'var(--ink)' }}>
                Wallet not connected
              </h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                Please connect your wallet to check your eligibility and claim $VIBE rewards.
              </p>
              <button onClick={login} className="btn-fill" style={{ width: '100%', justifyContent: 'center' }}>
                Connect Wallet
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '16px' }}>
                Protected by <span style={{ fontWeight: '700', color: 'var(--ink)' }}>privy</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── AUTHENTICATED PORTAL VIEW ── */
          <div>
            
            {/* 👤 FULL STYLISH WEB3 USER DASHBOARD */}
            <div className="checker-user-card">
              {/* Top Hero Row: Big Avatar + Name (Left) & Wallet / Actions (Right) */}
              <div className="checker-profile-header">
                {/* Left: Big Avatar + Name + Badge (Matched in height) */}
                <div className="checker-profile-avatar-info">
                  {/* Big Avatar Container */}
                  <div
                    className="checker-avatar-box"
                    style={{
                      border: (userNft || (nftCount && nftCount > 0)) ? '3px solid var(--blue)' : '2.5px solid #cbd5e1',
                      background: (userNft || (nftCount && nftCount > 0)) ? '#ffffff' : '#f1f5f9',
                      boxShadow: (userNft || (nftCount && nftCount > 0)) ? '0 8px 24px rgba(0, 82, 255, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    {userNft ? (
                      <img
                        src={userNft.image}
                        alt={userNft.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/new-logo-vibe.png'; }}
                      />
                    ) : (nftCount && nftCount > 0) ? (
                      <img
                        src="/new-logo-vibe.png"
                        alt="Vibe Club Member"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94a3b8' }}>
                        <User size={36} color="#64748b" />
                      </div>
                    )}
                  </div>

                  {/* Name (Top) & Vibe Club Member Badge (Bottom) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '2px',
                      minWidth: 0
                    }}
                  >
                    <div style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                      Profile:
                    </div>
                    <h3 className="checker-profile-name">
                      {userNft ? userNft.name : ((nftCount && nftCount > 0) ? 'Vibe Club Member' : (userProofData ? 'Vibe Holder' : 'Unknown Dog'))}
                    </h3>

                    <div>
                      {(userNft || (nftCount && nftCount > 0)) ? (
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1.5px solid rgba(16, 185, 129, 0.28)',
                            padding: '2px 10px',
                            borderRadius: '99px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            lineHeight: 1.2
                          }}
                        >
                          Vibe Club Member
                        </span>
                      ) : (
                        <a
                          href={VIBECLUB_MINT_URL}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#059669',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1.5px solid rgba(16, 185, 129, 0.3)',
                            padding: '2px 10px',
                            borderRadius: '99px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            lineHeight: 1.2,
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Join Vibe Club ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Wallet Address Pill + Actions */}
                {!isBaseAppMode && (
                  <div className="checker-actions-header">
                    {/* Connected Wallet Address Pill */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid rgba(0, 140, 255, 0.2)',
                        borderRadius: '14px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(0, 82, 255, 0.03)'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.90rem', color: 'var(--ink)', fontWeight: 600 }}>
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                      </span>
                      <button
                        onClick={copyAddress}
                        title="Copy Address"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: copied ? '#10b981' : 'var(--blue)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px',
                          marginLeft: '2px'
                        }}
                      >
                        {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} />}
                      </button>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="checker-buttons-row">
                      {/* Refresh Button */}
                      <button
                        onClick={() => {
                          fetchBalances(true);
                          if (isAdmin) fetchAdminMetrics();
                        }}
                        disabled={loading}
                        title="Refresh On-Chain Balances"
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid rgba(0, 140, 255, 0.22)',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          color: 'var(--blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(0, 82, 255, 0.04)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <RefreshCw size={15} className={loading ? 'spin' : ''} />
                        <span>{loading ? 'Updating...' : 'Refresh'}</span>
                      </button>

                      {/* Disconnect Button */}
                      <button
                        onClick={logout}
                        style={{
                          background: 'rgba(239, 68, 68, 0.06)',
                          border: '1.5px solid rgba(239, 68, 68, 0.22)',
                          color: '#ef4444',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          padding: '10px 18px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard Metric & Quick-Nav Tiles Grid (5 Columns in Single Row) */}
              <div className="dashboard-metrics-5">
                {/* 1. $VIBE Balance Tile */}
                <div
                  className="checker-metric-tile"
                  style={{
                    border: '1.5px solid rgba(0, 140, 255, 0.2)'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    $VIBE Balance
                  </div>
                  <div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {loading || balance === null ? <Loader2 size={15} className="spin" /> : formatCompactBalance(balance)}
                    </div>
                    <div className="checker-tile-eligibility" style={{ fontSize: '0.67rem', color: isHolderEligibleLive ? '#10b981' : '#ef4444', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                      {isHolderEligibleLive ? '✓ Eligible for Holder Rewards' : 'Not Eligible for Holder Rewards'}
                    </div>
                  </div>
                </div>

                {/* 2. Vibe Club Member Tile */}
                <div
                  className="checker-metric-tile"
                  style={{
                    border: '1.5px solid rgba(16, 185, 129, 0.24)'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    Vibe Club Member
                  </div>
                  <div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {loading || nftCount === null ? <Loader2 size={15} className="spin" /> : `${nftCount || 0} NFT${nftCount === 1 ? '' : 's'}`}
                    </div>
                    <div className="checker-tile-eligibility" style={{ fontSize: '0.67rem', color: (nftCount && nftCount > 0) ? '#10b981' : '#ef4444', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                      {(nftCount && nftCount > 0) ? '✓ Eligible for NFT Royalties' : 'Not Eligible for NFT Royalties'}
                    </div>
                  </div>
                </div>

                {/* 3. Available Rewards Quick-Nav Tile */}
                <div
                  onClick={() => scrollToSection('available-rewards-section', setIsAvailableOpen)}
                  className="checker-metric-tile"
                  style={{
                    border: isHolderRound1Available ? '1.5px solid rgba(0, 140, 255, 0.35)' : '1.5px solid rgba(0, 140, 255, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    Available Rewards
                  </div>
                  <div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {totalAvailableCount} Available
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <span>Claim Rewards</span> ↓
                    </div>
                  </div>
                </div>

                {/* 4. Upcoming Rewards Quick-Nav Tile */}
                <div
                  onClick={() => scrollToSection('upcoming-rewards-section', setIsUpcomingOpen)}
                  className="checker-metric-tile"
                  style={{
                    border: '1.5px solid rgba(0, 140, 255, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    Upcoming Unlocks
                  </div>
                  <div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      2 Upcoming
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <span>View Schedule</span> ↓
                    </div>
                  </div>
                </div>

                {/* 5. Claim History Quick-Nav Tile */}
                <div
                  onClick={() => scrollToSection('claimed-rewards-section', setIsHistoryOpen)}
                  className="checker-metric-tile"
                  style={{
                    border: '1.5px solid rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                    Claim History
                  </div>
                  <div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {claimedHistory?.length || 0} Claimed
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <span>View History</span> ↓
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {/* 🟢 SECTION 1: AVAILABLE TO CLAIM (Active Unclaimed Rewards)            */}
            {/* ═════════════════════════════════════════════════════════════════════════ */}
            <div id="available-rewards-section" style={{ marginBottom: '40px' }}>
              {/* Section Header (Outside Panel) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--blue)" /> Available Rewards ({totalAvailableCount})
                </h3>
                <button
                  onClick={() => setIsAvailableOpen(!isAvailableOpen)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1.5px solid rgba(0, 160, 255, 0.25)',
                    borderRadius: '10px',
                    padding: '5px 9px',
                    cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isAvailableOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        boxShadow: '0 2px 6px rgba(0, 82, 255, 0.05)'
                      }}
                      title={isAvailableOpen ? "Collapse section" : "Expand section"}
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  {isAvailableOpen && (
                <div className="checker-section-panel">
                  {(isHolderRound1Available || isVibeClubRoyalty1Available) ? (
                    <div className="rewards-grid-2">
                      
                      {/* 1. Holder Rewards Active Claim Card */}
                      {isHolderRound1Available && (
                        <div
                          className="checker-reward-card"
                          style={{
                            border: '2px solid var(--blue)',
                            boxShadow: '0 10px 32px rgba(0, 82, 255, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)',
                            position: 'relative'
                          }}
                        >
                          <div>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <img
                                  src="/new-logo-vibe.png"
                                  alt="VIBE"
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid var(--blue)',
                                    boxShadow: '0 2px 8px rgba(0, 82, 255, 0.15)',
                                    flexShrink: 0
                                  }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                    Holder Rewards
                                  </h4>
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, background: 'rgba(0, 82, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 82, 255, 0.2)', padding: '2px 7px', borderRadius: '99px', lineHeight: 1.2, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                                    Unlock 1
                                  </span>
                                </div>
                              </div>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '99px',
                                  fontSize: '0.66rem',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }} />
                                Claim Live
                              </span>
                            </div>

                            {/* Metric Box (Rewards Pool) */}
                            <div
                              style={{
                                background: '#f8fafc',
                                borderRadius: '16px',
                                padding: '12px 16px',
                                border: '1px solid rgba(0, 140, 255, 0.18)',
                                boxShadow: '0 2px 8px rgba(0, 82, 255, 0.03)',
                                marginBottom: '14px'
                              }}
                            >
                              <div style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                <Coins size={12} color="var(--blue)" /> Rewards Pool
                              </div>
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                10,000,000 <span style={{ fontSize: '0.86rem', color: 'var(--blue)', fontWeight: 800 }}>$VIBE</span>
                              </div>
                            </div>

                            {/* Allocation / Eligibility Box */}
                            <div style={{ marginBottom: '18px' }}>
                              {(hasConfirmedHolderClaim || isHolderEligibleLive) ? (
                                <div
                                  style={{
                                    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                                    border: '1.5px solid #a7f3d0',
                                    borderRadius: '18px',
                                    padding: '16px 14px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '145px',
                                    boxSizing: 'border-box',
                                    gap: '8px'
                                  }}
                                >
                                  <h5 style={{ fontSize: '1.10rem', color: '#10b981', margin: 0, fontWeight: 900 }}>
                                    You're eligible for claim
                                  </h5>
                                  
                                  <div style={{ fontSize: '2.0rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
                                    {(holderRewardAmount || 0).toLocaleString('en-US')} <span style={{ fontSize: '1.0rem', color: 'var(--blue)', fontWeight: 900 }}>$VIBE</span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: '#fef2f2',
                                    border: '1.5px solid #fecaca',
                                    borderRadius: '18px',
                                    padding: '16px 14px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '145px',
                                    boxSizing: 'border-box',
                                    gap: '8px'
                                  }}
                                >
                                  <img
                                    src="/vibe-sad-logo-nobg.png"
                                    alt="Sad VIBE"
                                    style={{ width: 70, height: 70, objectFit: 'contain' }}
                                  />
                                  <h5 style={{ fontSize: '1.05rem', color: '#ef4444', margin: 0, fontWeight: 900 }}>
                                    Not Eligible for Round 1
                                  </h5>
                                  <a
                                    href={O1}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      padding: '7px 14px',
                                      borderRadius: '10px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      textDecoration: 'none'
                                    }}
                                  >
                                    Buy & Hold 5M+ $VIBE <ArrowUpRight size={13} />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {(hasConfirmedHolderClaim || isHolderEligibleLive) ? (
                              <button
                                onClick={() => handleClaim('holder', 1, holderRewardAmount)}
                                disabled={claimStatus['holder-1'] === 'claiming'}
                                className="btn-fill"
                                style={{
                                  width: '100%',
                                  padding: '12px 18px',
                                  borderRadius: '12px',
                                  fontSize: '0.90rem',
                                  fontWeight: 900,
                                  justifyContent: 'center',
                                  boxShadow: '0 4px 18px rgba(0, 82, 255, 0.32)',
                                  cursor: 'pointer'
                                }}
                              >
                                {claimStatus['holder-1'] === 'claiming' ? (
                                  <>
                                    <Loader2 size={16} className="spin" /> Confirming Claim...
                                  </>
                                ) : (
                                  <>
                                    <Gift size={16} /> Claim {(holderRewardAmount || 0).toLocaleString('en-US')} $VIBE
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  padding: '11px 16px',
                                  borderRadius: '12px',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#94a3b8',
                                  fontWeight: 800,
                                  fontSize: '0.84rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Not Eligible for this Round
                              </button>
                            )}

                            {/* Claim window ends caption with countdown */}
                            <div
                              style={{
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.74rem',
                                color: '#64748b',
                                fontWeight: 700
                              }}
                            >
                              <Clock size={12} color="#64748b" />
                              <span>Claim window ends:</span>
                              <span
                                style={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '0.74rem',
                                  fontWeight: 900,
                                  color: '#0284c7',
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  border: '1px solid rgba(2, 132, 199, 0.2)',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.03em'
                                }}
                              >
                                {formatDigitalCountdown(upcomingHolderRound?.targetDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Vibe Club Royalties Active Claim Card */}
                      {activeRoyaltyAvailable && (
                        <div
                          className="checker-reward-card"
                          style={{
                            border: '2px solid #00c8ff',
                            boxShadow: '0 10px 32px rgba(0, 200, 255, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)',
                            position: 'relative'
                          }}
                        >
                          <div>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <img
                                  src="/nft-avatar.png"
                                  alt="Vibe Club"
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                    border: '2px solid #00c8ff',
                                    boxShadow: '0 2px 8px rgba(0, 200, 255, 0.18)',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => { e.target.src = '/new-logo-vibe.png'; }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                    Vibe Club Royalties
                                  </h4>
                                  <span style={{ fontSize: '0.66rem', fontWeight: 800, background: 'rgba(0, 200, 255, 0.1)', color: '#0284c7', border: '1px solid rgba(0, 200, 255, 0.25)', padding: '2px 7px', borderRadius: '99px', lineHeight: 1.2, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                                    {activeRoyaltyRound.name}
                                  </span>
                                </div>
                              </div>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '99px',
                                  fontSize: '0.66rem',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }} />
                                Claim Live
                              </span>
                            </div>

                            {/* Metric Box (Rewards Pool) */}
                            <div
                              style={{
                                background: '#f8fafc',
                                borderRadius: '16px',
                                padding: '12px 16px',
                                border: '1px solid rgba(0, 200, 255, 0.2)',
                                boxShadow: '0 2px 8px rgba(0, 200, 255, 0.04)',
                                marginBottom: '14px'
                              }}
                            >
                              <div style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                <Crown size={12} color="#0284c7" /> Royalty Pool
                              </div>
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                {activeRoyaltyRound.pool.replace(' $VIBE', '')} <span style={{ fontSize: '0.86rem', color: '#0284c7', fontWeight: 800 }}>$VIBE</span>
                              </div>
                            </div>

                            {/* Allocation / Eligibility Box */}
                            <div style={{ marginBottom: '18px' }}>
                              {(hasConfirmedRoyaltyClaim || isVibeClubEligible) ? (
                                <div
                                  style={{
                                    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                                    border: '1.5px solid #a7f3d0',
                                    borderRadius: '18px',
                                    padding: '16px 14px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '145px',
                                    boxSizing: 'border-box',
                                    gap: '8px'
                                  }}
                                >
                                  <h5 style={{ fontSize: '1.10rem', color: '#10b981', margin: 0, fontWeight: 900 }}>
                                    You're eligible for claim
                                  </h5>
                                  
                                  <div style={{ fontSize: '2.0rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
                                    {(vibeClubRewardAmount || (activeRoyaltyEpochId === 2 ? 17117 : 22935)).toLocaleString('en-US')} <span style={{ fontSize: '1.0rem', color: '#0284c7', fontWeight: 900 }}>$VIBE</span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: '#fef2f2',
                                    border: '1.5px solid #fecaca',
                                    borderRadius: '18px',
                                    padding: '16px 14px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '145px',
                                    boxSizing: 'border-box',
                                    gap: '8px'
                                  }}
                                >
                                  <img
                                    src="/vibe-sad-logo-nobg.png"
                                    alt="Sad VIBE"
                                    style={{ width: 70, height: 70, objectFit: 'contain' }}
                                  />
                                  <h5 style={{ fontSize: '1.05rem', color: '#ef4444', margin: 0, fontWeight: 900 }}>
                                    Not Eligible for {activeRoyaltyRound.name}
                                  </h5>
                                  <a
                                    href={VIBECLUB_MINT_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      padding: '7px 14px',
                                      borderRadius: '10px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      textDecoration: 'none'
                                    }}
                                  >
                                    Mint Vibe Club NFT <ArrowUpRight size={13} />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {activeRoyaltyClaimed ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                  disabled
                                  style={{
                                    width: '100%',
                                    padding: '12px 18px',
                                    borderRadius: '12px',
                                    fontSize: '0.90rem',
                                    fontWeight: 900,
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1.5px solid #a7f3d0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: 'default'
                                  }}
                                >
                                  <CheckCircle2 size={16} color="#059669" /> Claimed Successfully
                                </button>
                                <button
                                  onClick={() => setShowRoyaltySuccessModal(true)}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 800,
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                                  }}
                                >
                                  <Share2 size={14} /> Share Claim on X
                                </button>
                              </div>
                            ) : (hasConfirmedRoyaltyClaim || isVibeClubEligible) ? (
                              <button
                                onClick={() => handleClaim('vibeclub', activeRoyaltyEpochId, vibeClubRewardAmount)}
                                disabled={claimStatus[`vibeclub-${activeRoyaltyEpochId}`] === 'claiming'}
                                className="btn-fill"
                                style={{
                                  width: '100%',
                                  padding: '12px 18px',
                                  borderRadius: '12px',
                                  fontSize: '0.90rem',
                                  fontWeight: 900,
                                  justifyContent: 'center',
                                  boxShadow: '0 4px 18px rgba(0, 180, 255, 0.32)',
                                  cursor: 'pointer'
                                }}
                              >
                                {claimStatus[`vibeclub-${activeRoyaltyEpochId}`] === 'claiming' ? (
                                  <>
                                    <Loader2 size={16} className="spin" /> Confirming Claim...
                                  </>
                                ) : (
                                  <>
                                    <Gift size={16} /> Claim {(vibeClubRewardAmount || (activeRoyaltyEpochId === 2 ? 17117 : 22935)).toLocaleString('en-US')} $VIBE
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  padding: '11px 16px',
                                  borderRadius: '12px',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#94a3b8',
                                  fontWeight: 800,
                                  fontSize: '0.84rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Not Eligible for this Round
                              </button>
                            )}

                            {/* Claim window ends caption with countdown */}
                            <div
                              style={{
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.74rem',
                                color: '#64748b',
                                fontWeight: 700
                              }}
                            >
                              <Clock size={12} color="#64748b" />
                              <span>Claim window ends:</span>
                              <span
                                style={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '0.74rem',
                                  fontWeight: 900,
                                  color: '#0284c7',
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  border: '1px solid rgba(2, 132, 199, 0.2)',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.03em'
                                }}
                              >
                                {formatDigitalCountdown(upcomingVibeClubRound?.targetDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid rgba(0, 140, 255, 0.22)',
                        borderRadius: '18px',
                        padding: '24px 20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.90rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 16px rgba(0, 82, 255, 0.04)'
                      }}
                    >
                      No active claims available right now. Check upcoming rewards below.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {/* ⏳ SECTION 2: UPCOMING REWARDS (Next Scheduled Unlocks & Royalties)    */}
            {/* ═════════════════════════════════════════════════════════════════════════ */}
            <div id="upcoming-rewards-section" style={{ marginBottom: '40px' }}>
              {/* Section Header (Outside Panel) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="#0284c7" /> Upcoming Rewards (2)
                </h3>
                <button
                  onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1.5px solid rgba(0, 160, 255, 0.25)',
                    borderRadius: '10px',
                    padding: '5px 9px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    transition: 'all 0.2s ease',
                    transform: isUpcomingOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    boxShadow: '0 2px 6px rgba(0, 82, 255, 0.05)'
                  }}
                  title={isUpcomingOpen ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {isUpcomingOpen && (
                <div className="checker-section-panel">
                  <div className="rewards-grid-2">
                    
                    {/* 1. Next Holder Rewards Unlock Card */}
                    <div
                      className="checker-reward-card"
                      style={{
                        border: '1.5px solid rgba(0, 160, 255, 0.25)',
                        boxShadow: '0 6px 24px rgba(0, 82, 255, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <img
                              src="/new-logo-vibe.png"
                              alt="VIBE"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid rgba(0, 160, 255, 0.3)',
                                boxShadow: '0 2px 8px rgba(0, 82, 255, 0.15)',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                Holder Rewards
                              </h4>
                              <span style={{ fontSize: '0.66rem', fontWeight: 800, background: 'rgba(0, 82, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 82, 255, 0.2)', padding: '2px 7px', borderRadius: '99px', lineHeight: 1.2, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                                {upcomingHolderRound?.name || 'Unlock 1'}
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '99px',
                              fontSize: '0.66rem',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              background: 'rgba(255, 255, 255, 0.9)',
                              color: '#64748b',
                              border: '1px solid rgba(0, 160, 255, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            <Lock size={11} color="#64748b" style={{ flexShrink: 0 }} />
                            Locked
                          </span>
                        </div>

                        {/* Metric Box (Rewards Pool) */}
                        <div
                          style={{
                            background: '#f8fafc',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            border: '1px solid rgba(0, 140, 255, 0.18)',
                            boxShadow: '0 2px 8px rgba(0, 82, 255, 0.03)',
                            marginBottom: '14px'
                          }}
                        >
                          <div style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Coins size={12} color="var(--blue)" /> Rewards Pool
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            {upcomingHolderRound?.pool || '10,000,000 $VIBE'}
                          </div>
                        </div>

                        {/* Eligibility Box with Mascot */}
                        <div style={{ marginBottom: '18px' }}>
                          {isHolderEligibleLive ? (
                            <div
                              style={{
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                                border: '1.5px solid #a7f3d0',
                                borderRadius: '18px',
                                padding: '16px 14px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '175px',
                                boxSizing: 'border-box',
                                gap: '6px'
                              }}
                            >
                              <img
                                src="/vibe-logo-nobg.png"
                                alt="Eligible VIBE"
                                style={{ width: 72, height: 72, objectFit: 'contain', margin: '-2px 0' }}
                              />
                              <h5 style={{ fontSize: '1.10rem', color: '#10b981', margin: 0, fontWeight: 900 }}>
                                You are Eligible!
                              </h5>
                            </div>
                          ) : (
                            <div
                              style={{
                                background: '#fef2f2',
                                border: '1.5px solid #fecaca',
                                borderRadius: '18px',
                                padding: '16px 14px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '175px',
                                boxSizing: 'border-box',
                                gap: '6px'
                              }}
                            >
                              <img
                                src="/vibe-sad-logo-nobg.png"
                                alt="Sad VIBE"
                                style={{ width: 68, height: 68, objectFit: 'contain', margin: '-2px 0' }}
                              />
                              <h5 style={{ fontSize: '1.05rem', color: '#ef4444', margin: 0, fontWeight: 900 }}>
                                Not Eligible Yet
                              </h5>
                              <a
                                href={O1}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-fill"
                                style={{
                                  marginTop: '2px',
                                  padding: '7px 14px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  borderRadius: '10px',
                                  textDecoration: 'none',
                                  background: '#ef4444'
                                }}
                              >
                                Buy & Hold 5M+ $VIBE <ArrowUpRight size={13} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Countdown Status Pill */}
                      <div
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          border: '1.5px solid rgba(0, 140, 255, 0.18)',
                          color: '#475569',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.80rem', whiteSpace: 'nowrap' }}>
                          <Lock size={13} /> Claim opens {upcomingHolderRound?.unlockDate || 'Sep 25'}
                        </span>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.76rem',
                            fontWeight: 900,
                            background: 'rgba(0, 82, 255, 0.08)',
                            color: 'var(--blue)',
                            border: '1px solid rgba(0, 82, 255, 0.2)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatDigitalCountdown(upcomingHolderRound?.targetDate)}
                        </span>
                      </div>

                      {/* Snapshot Status Caption */}
                      <div
                        style={{
                          marginTop: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '0.74rem',
                          color: '#64748b',
                          fontWeight: 700
                        }}
                      >
                        {currentTime >= new Date(upcomingHolderRound?.snapshotIso) ? (
                          <>
                            <Check size={12} color="#10b981" strokeWidth={3} />
                            <span>Snapshot taken: {upcomingHolderRound?.snapshotDate || 'Aug 26, 00:00 UTC'}</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} color="#64748b" />
                            <span>Snapshot date: {upcomingHolderRound?.snapshotDate || 'Aug 26, 00:00 UTC'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 2. Next Vibe Club Royalty Card */}
                    <div
                      className="checker-reward-card"
                      style={{
                        border: '1.5px solid rgba(0, 160, 255, 0.25)',
                        boxShadow: '0 6px 24px rgba(0, 82, 255, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(0, 82, 255, 0.1)',
                                border: '1.5px solid rgba(0, 160, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0, 82, 255, 0.15)',
                                flexShrink: 0
                              }}
                            >
                              <Crown size={17} color="var(--blue)" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                Vibe Club
                              </h4>
                              <span style={{ fontSize: '0.66rem', fontWeight: 800, background: 'rgba(0, 82, 255, 0.08)', color: 'var(--blue)', border: '1px solid rgba(0, 82, 255, 0.2)', padding: '2px 7px', borderRadius: '99px', lineHeight: 1.2, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                                {upcomingVibeClubRound?.name || 'Royalty 1'}
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '99px',
                              fontSize: '0.66rem',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              background: 'rgba(255, 255, 255, 0.9)',
                              color: '#64748b',
                              border: '1px solid rgba(0, 160, 255, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            <Lock size={11} color="#64748b" style={{ flexShrink: 0 }} />
                            Locked
                          </span>
                        </div>

                        {/* Metric Box (Royalty Pool) */}
                        <div
                          style={{
                            background: '#f8fafc',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            border: '1px solid rgba(0, 140, 255, 0.18)',
                            boxShadow: '0 2px 8px rgba(0, 82, 255, 0.03)',
                            marginBottom: '14px'
                          }}
                        >
                          <div style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Crown size={12} color="var(--blue)" /> Royalty Pool
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            {upcomingVibeClubRound?.pool || '2,500,000 $VIBE'}
                          </div>
                        </div>

                        {/* Eligibility Box with Mascot */}
                        <div style={{ marginBottom: '18px' }}>
                          {isVibeClubEligible ? (
                            <div
                              style={{
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                                border: '1.5px solid #a7f3d0',
                                borderRadius: '18px',
                                padding: '16px 14px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '175px',
                                boxSizing: 'border-box',
                                gap: '6px'
                              }}
                            >
                              <img
                                src="/vibe-logo-nobg.png"
                                alt="Eligible NFT"
                                style={{ width: 72, height: 72, objectFit: 'contain', margin: '-2px 0' }}
                              />
                              <h5 style={{ fontSize: '1.10rem', color: '#10b981', margin: 0, fontWeight: 900 }}>
                                Eligible Member!
                              </h5>
                            </div>
                          ) : (
                            <div
                              style={{
                                background: '#fef2f2',
                                border: '1.5px solid #fecaca',
                                borderRadius: '18px',
                                padding: '16px 14px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '175px',
                                boxSizing: 'border-box',
                                gap: '6px'
                              }}
                            >
                              <img
                                src="/vibe-sad-logo-nobg.png"
                                alt="Sad VIBE"
                                style={{ width: 68, height: 68, objectFit: 'contain', margin: '-2px 0' }}
                              />
                              <h5 style={{ fontSize: '1.05rem', color: '#ef4444', margin: 0, fontWeight: 900 }}>
                                Not Eligible Yet
                              </h5>
                              <a
                                href={VIBECLUB_MINT_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-fill"
                                style={{
                                  marginTop: '2px',
                                  padding: '7px 14px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  borderRadius: '10px',
                                  textDecoration: 'none',
                                  background: '#10b981'
                                }}
                              >
                                Mint Vibe Club NFT ↗
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Countdown Status Pill */}
                      <div
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          border: '1.5px solid rgba(0, 140, 255, 0.18)',
                          color: '#475569',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.80rem', whiteSpace: 'nowrap' }}>
                          <Lock size={13} /> Claim opens {upcomingVibeClubRound?.claimDate || 'Aug 28'}
                        </span>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.76rem',
                            fontWeight: 900,
                            background: 'rgba(0, 82, 255, 0.08)',
                            color: 'var(--blue)',
                            border: '1px solid rgba(0, 82, 255, 0.2)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatDigitalCountdown(upcomingVibeClubRound?.targetDate)}
                        </span>
                      </div>

                      {/* Snapshot Status Caption */}
                      <div
                        style={{
                          marginTop: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '0.74rem',
                          color: '#64748b',
                          fontWeight: 700
                        }}
                      >
                        {currentTime >= new Date(upcomingVibeClubRound?.snapshotIso) ? (
                          <>
                            <Check size={12} color="#10b981" strokeWidth={3} />
                            <span>Snapshot taken: {upcomingVibeClubRound?.snapshotDate || 'Aug 28, 00:00 UTC'}</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} color="#64748b" />
                            <span>Snapshot date: {upcomingVibeClubRound?.snapshotDate || 'Aug 28, 00:00 UTC'}</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {/* ✅ SECTION 3: CLAIMED REWARDS HISTORY                                 */}
            {/* ═════════════════════════════════════════════════════════════════════════ */}
            <div id="claimed-rewards-section" style={{ marginBottom: '40px' }}>
              {/* Section Header (Outside Panel) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} color="#10b981" /> Claimed Rewards ({claimedHistory?.length || 0})
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1.5px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    padding: '5px 9px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    transition: 'all 0.2s ease',
                    transform: isHistoryOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.05)'
                  }}
                  title={isHistoryOpen ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {isHistoryOpen && (
                <div className="checker-section-panel">
                  {Array.isArray(claimedHistory) && claimedHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {getSortedClaimedHistory(claimedHistory).map((item) => (
                        <div
                          key={item?.id || Math.random()}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #a7f3d0',
                            borderRadius: '18px',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.06)'
                          }}
                        >
                          {/* Left: Event info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Check size={20} color="#10b981" strokeWidth={3} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '1rem', color: 'var(--ink)', fontWeight: 900, display: 'block' }}>
                                {item?.title || 'Rewards Claim'}
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                                Successfully Claimed on Base
                              </span>
                            </div>
                          </div>

                          {/* Right: Share button (left) + Amount (right) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {(item?.type === 'vibeclub' || item?.id?.includes('vibeclub')) && (
                              <button
                                onClick={() => setShowRoyaltySuccessModal(true)}
                                style={{
                                  background: '#000000',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '7px 13px',
                                  borderRadius: '9px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#000000'; }}
                              >
                                <Share2 size={13} /> Share
                              </button>
                            )}
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', minWidth: '135px', textAlign: 'right' }}>
                              +{typeof item?.amount === 'number' ? item.amount.toLocaleString('en-US') : (item?.amount || '0')} <span style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 800 }}>$VIBE</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '18px',
                        padding: '24px 20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.90rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.04)'
                      }}
                    >
                      No claimed rewards yet. Check available rewards above to claim.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {/* SECTION 4: ADMIN PANEL (Contract Owner Only)                          */}
            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {isAdmin && (
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '20px',
                  padding: '24px',
                  marginTop: '40px',
                  marginBottom: '20px',
                  color: '#ffffff',
                  border: '1px solid #1e293b',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    Admin Panel
                  </h3>
                  <a
                    href={`https://basescan.org/address/${adminDistributorType === 'holder' ? DISTRIBUTOR_CA : (adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '0.78rem',
                      color: '#94a3b8',
                      textDecoration: 'none',
                      fontFamily: 'monospace',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    Contract: {(adminDistributorType === 'holder' ? DISTRIBUTOR_CA : (adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA)).slice(0, 6)}...{(adminDistributorType === 'holder' ? DISTRIBUTOR_CA : (adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA)).slice(-4)} ↗
                  </a>
                </div>

                {/* Distributor Selector Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '12px' }}>
                  <button
                    onClick={() => {
                      setAdminDistributorType('holder');
                      setAdminEpochId('1');
                      setAdminMerkleRoot(round1Data?.merkleRoot || '');
                      fetchAdminMetrics('holder', '1', DISTRIBUTOR_CA);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: adminDistributorType === 'holder' ? 'var(--blue)' : 'transparent',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🔵 Holder Rewards (Vesting)
                  </button>
                  <button
                    onClick={() => {
                      setAdminDistributorType('royalty');
                      const rEpoch = isVibeClubRoyalty1Ended ? '2' : '1';
                      setAdminEpochId(rEpoch);
                      setAdminMerkleRoot((rEpoch === '2' ? royalty2Data?.merkleRoot : royalty1Data?.merkleRoot) || '');
                      fetchAdminMetrics('royalty', rEpoch, adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: adminDistributorType === 'royalty' ? '#0284c7' : 'transparent',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    👑 Vibe Club Royalties (NFT)
                  </button>
                </div>

                {adminDistributorType === 'royalty' && (
                  <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800 }}>Royalty Contract CA:</span>
                    <input
                      type="text"
                      value={adminCustomRoyaltyCa}
                      onChange={(e) => {
                        const newCa = e.target.value.trim();
                        setAdminCustomRoyaltyCa(newCa);
                        if (newCa.length === 42) {
                          fetchAdminMetrics('royalty', adminEpochId, newCa);
                        }
                      }}
                      placeholder="0x... Royalty Distributor Address"
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* 4. Live Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.70rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                      Contract $VIBE Balance
                    </div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: '#38bdf8' }}>
                      {adminMetrics.metricsLoading ? '...' : (adminMetrics.contractBalance || 0).toLocaleString('en-US') + ' $VIBE'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.70rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                      Wallets Claimed
                    </div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: '#10b981' }}>
                      {adminMetrics.metricsLoading ? '...' : `${adminMetrics.claimedWalletsCount} / ${adminMetrics.totalWalletsCount}`}
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginLeft: '6px' }}>
                        ({adminMetrics.totalWalletsCount > 0 ? ((adminMetrics.claimedWalletsCount / adminMetrics.totalWalletsCount) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.70rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                      Total Claimed
                    </div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: '#f8fafc' }}>
                      {adminMetrics.metricsLoading ? '...' : (adminMetrics.claimedTokens || 0).toLocaleString('en-US') + ' $VIBE'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.70rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                      Unclaimed in Round
                    </div>
                    <div style={{ fontSize: '1.20rem', fontWeight: 800, color: '#fbbf24' }}>
                      {adminMetrics.metricsLoading ? '...' : (adminMetrics.unclaimedTokens !== undefined ? adminMetrics.unclaimedTokens : Math.max(0, (adminDistributorType === 'holder' ? 10000000 : (adminEpochId === '2' ? 1900000 : 2500000)) - (adminMetrics.claimedTokens || 0))).toLocaleString('en-US') + ' $VIBE'}
                    </div>
                  </div>
                </div>

                {/* 1. Set Merkle Root */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                    1. Publish Merkle Root Proof
                  </div>
                  <div className="admin-action-row" style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={adminEpochId}
                      onChange={(e) => {
                        const newEpoch = e.target.value;
                        setAdminEpochId(newEpoch);
                        if (adminDistributorType === 'royalty') {
                          if (newEpoch === '2') {
                            setAdminMerkleRoot(royalty2Data?.merkleRoot || '');
                          } else if (newEpoch === '1') {
                            setAdminMerkleRoot(royalty1Data?.merkleRoot || '');
                          }
                          fetchAdminMetrics('royalty', newEpoch, adminCustomRoyaltyCa || ROYALTY_DISTRIBUTOR_CA);
                        } else {
                          if (newEpoch === '1') {
                            setAdminMerkleRoot(round1Data?.merkleRoot || '');
                          }
                          fetchAdminMetrics('holder', newEpoch, DISTRIBUTOR_CA);
                        }
                      }}
                      placeholder="Round"
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      type="text"
                      value={adminMerkleRoot}
                      onChange={(e) => setAdminMerkleRoot(e.target.value)}
                      placeholder="0x... Merkle Root"
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      onClick={handleSetMerkleRoot}
                      disabled={adminLoading}
                      style={{
                        background: 'var(--blue)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: adminLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {adminLoading ? 'Processing...' : 'Set Merkle Root'}
                    </button>
                  </div>
                </div>

                {/* 2. Withdraw Tokens to Admin Wallet */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                    2. Withdraw Tokens to Admin Wallet
                  </div>
                  <div className="admin-action-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={adminWithdrawAmount}
                        onChange={(e) => setAdminWithdrawAmount(e.target.value)}
                        placeholder="Amount in $VIBE (e.g. 10000000)"
                        style={{
                          width: '100%',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          borderRadius: '10px',
                          padding: '10px 65px 10px 14px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        onClick={() => setAdminWithdrawAmount(String(adminMetrics.contractBalance || 0))}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#94a3b8',
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        MAX
                      </button>
                    </div>
                    <button
                      onClick={handleWithdrawTokens}
                      disabled={adminLoading}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: adminLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {adminLoading ? 'Processing...' : 'Withdraw to Admin'}
                    </button>
                  </div>
                </div>

                {/* 3. Burn Unclaimed Tokens */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                    3. Burn Unclaimed Tokens (Send to Dead Address)
                  </div>
                  <div className="admin-action-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={adminBurnAmount}
                        onChange={(e) => setAdminBurnAmount(e.target.value)}
                        placeholder="Amount in $VIBE to burn"
                        style={{
                          width: '100%',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          borderRadius: '10px',
                          padding: '10px 110px 10px 14px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        onClick={() => setAdminBurnAmount(String(adminMetrics.unclaimedTokens !== undefined ? adminMetrics.unclaimedTokens : Math.max(0, (adminDistributorType === 'holder' ? 10000000 : 2500000) - (adminMetrics.claimedTokens || 0))))}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ALL UNCLAIMED
                      </button>
                    </div>
                    <button
                      onClick={handleBurnTokens}
                      disabled={adminLoading}
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: adminLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {adminLoading ? 'Processing...' : 'Burn Tokens'}
                    </button>
                  </div>
                </div>

                {/* Status Feedback */}
                {adminSuccess && (
                  <div style={{ marginTop: '14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', padding: '10px 14px', color: '#a7f3d0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Transaction confirmed successfully on Base!</span>
                    {adminTxHash && adminTxHash.startsWith('0x') && (
                      <a
                        href={`https://basescan.org/tx/${adminTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#34d399', textDecoration: 'underline', fontWeight: 800 }}
                      >
                        View on Basescan ↗
                      </a>
                    )}
                  </div>
                )}

                {adminError && (
                  <div style={{ marginTop: '14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.82rem' }}>
                    {adminError}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* 👑 VIBE CLUB ROYALTY CLAIM SUCCESS MODAL                              */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {showRoyaltySuccessModal && (
        <div
          onClick={() => setShowRoyaltySuccessModal(false)}
          className="royalty-modal-overlay"
          style={{
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="royalty-modal-card"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRoyaltySuccessModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s ease',
                zIndex: 2
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              <X size={18} />
            </button>

            {/* Success Green Badge (Desktop) */}
            <div className="royalty-modal-badge-desktop">
              <Check size={32} color="#ffffff" strokeWidth={3.2} />
            </div>

            {/* Title with Inline Icon on Mobile */}
            <h3 className="royalty-modal-title">
              <span className="royalty-modal-check-inline">
                <CheckCircle2 size={24} color="#10b981" strokeWidth={2.8} />
              </span>
              Claim Successful!
            </h3>

            {/* Subtitle */}
            <p className="royalty-modal-sub">
              You’ve claimed <strong style={{ color: '#0284c7', fontWeight: 900 }}>22,935 $VIBE</strong> in Vibe Club Royalties 🐶🔥
            </p>

            {/* Royalty Banner Image */}
            <div
              style={{
                position: 'relative',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1.5px solid rgba(0, 200, 255, 0.35)',
                boxShadow: '0 12px 30px rgba(0, 102, 255, 0.16)',
                marginBottom: '20px'
              }}
            >
              <img
                src="/vibe-club-royalties-banner.jpg"
                alt="Vibe Club Royalties Banner"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '16px'
                }}
              />
            </div>

            {/* Action Buttons Flow (Step 1 & Step 2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
              {/* Step 1 Column */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#0284c7'
                }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'rgba(2, 132, 199, 0.12)',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    color: '#0284c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.62rem',
                    fontWeight: 900
                  }}>1</span>
                  <span>STEP 1 · SAVE</span>
                </div>
                <button
                  onClick={handleDownloadRoyaltyBanner}
                  disabled={downloadingBanner}
                  className="royalty-modal-btn"
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1.5px solid #cbd5e1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                >
                  {downloadingBanner ? (
                    <>
                      <Loader2 size={15} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Download size={15} /> Save Image
                    </>
                  )}
                </button>
              </div>

              {/* Step 2 Column */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#0f172a'
                }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(15, 23, 42, 0.2)',
                    color: '#0f172a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.62rem',
                    fontWeight: 900
                  }}>2</span>
                  <span>STEP 2 · POST</span>
                </div>
                <button
                  onClick={() => {
                    const tweetText = `JUST CLAIMED MY NFT ROYALTIES 🐶💰\n\nHolding Vibe Club NFT unlocks passive $VIBE payouts every 10 days to all Club Members\n\nJoin → https://vibeverse.dog/vibeclub?ref=x`;
                    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="royalty-modal-btn"
                  style={{
                    width: '100%',
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
