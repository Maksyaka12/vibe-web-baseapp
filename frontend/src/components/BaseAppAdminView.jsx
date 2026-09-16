import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useDisconnect } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits, encodeFunctionData, parseAbi } from 'viem';
import { publicClient } from '../config/rpc';
import { DATA_SUFFIX, appendBuilderSuffix } from '../config/builderCode';
import {
  Coins,
  Crown,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Wallet
} from 'lucide-react';

export const ADMIN_WALLET = '0x4c91d3bed372c11795b9ce9a9017dfe447bf050a';
export const VIBE_TOKEN_CA = '0xb200000000000000000000df24ecb8bf51100a01';
export const DISTRIBUTOR_CA = '0x87760A9560fA386127eC630D421976a4454f73bF';
export const ROYALTY_DISTRIBUTOR_CA = '0xb091395ee1323381e479c4a4f89d3d3ef4237f8a';
export const NFT_CONTRACT_ADDRESS = '0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886';
export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

const DISTRIBUTOR_ABI = parseAbi([
  'function setMerkleRoot(uint256 epochId, bytes32 _merkleRoot) external',
  'function emergencyWithdraw(address token, uint256 amount) external',
  'function merkleRoots(uint256 epochId) view returns (bytes32)',
  'function isClaimed(uint256 epochId, uint256 index) view returns (bool)'
]);

const NFT_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function MAX_PER_WALLET() view returns (uint256)',
  'function ethPrice() view returns (uint256)',
  'function vibePrice() view returns (uint256)',
  'function mintLive() view returns (bool)',
  'function totalMintedCount() view returns (uint256)',
  'function getRemainingTokens() view returns (uint256)',
  'function aggregatorRouter() view returns (address)',
  'function isTokenMinted(uint256 tokenId) view returns (bool)',
  'function setPrices(uint256 _ethPrice, uint256 _vibePrice) external',
  'function setMintLive(bool _live) external',
  'function adminMint(address to, uint256 tokenId) external',
  'function adminSwapAndBurn(uint256 ethAmount, bytes customSwapCalldata) external',
  'function executeManualBurn(uint256 vibeAmount) external',
  'function setAggregatorRouter(address _newAggregator) external',
  'function withdrawETH() external',
  'function withdrawVIBE() external',
  'function withdrawERC20(address token) external'
]);

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
]);

export function BaseAppAdminView() {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();

  const activeAddress = user?.wallet?.address || wallets?.[0]?.address || wagmiAddress;
  const isAdmin = !!(activeAddress && activeAddress.toLowerCase() === ADMIN_WALLET.toLowerCase());

  // Active module tab: 'holder' | 'royalty' | 'nft'
  const [activeTab, setActiveTab] = useState('holder');

  // Generic status & feedback state
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ═════════════════════════════════════════════════════════════════════════
  // 1. HOLDER & ROYALTIES VESTING STATES
  // ═════════════════════════════════════════════════════════════════════════
  const [holderEpochId, setHolderEpochId] = useState('1');
  const [holderMerkleRoot, setHolderMerkleRoot] = useState('0xac99116798ace01d3ebcb6f4c6e60ccd8c5d464b94da5de34aa04f602cb9115a');
  const [holderWithdrawAmount, setHolderWithdrawAmount] = useState('');
  const [holderBurnAmount, setHolderBurnAmount] = useState('');

  const [royaltyEpochId, setRoyaltyEpochId] = useState('2');
  const [royaltyMerkleRoot, setRoyaltyMerkleRoot] = useState('0xa86db60c2394541bfec649c253b26c63b84db5b32ecce16597ea94e4304db96c');
  const [royaltyCustomCa, setRoyaltyCustomCa] = useState(ROYALTY_DISTRIBUTOR_CA);
  const [royaltyWithdrawAmount, setRoyaltyWithdrawAmount] = useState('');
  const [royaltyBurnAmount, setRoyaltyBurnAmount] = useState('');

  // Multicall Metrics
  const [holderMetrics, setHolderMetrics] = useState({
    contractBalance: 0,
    claimedTokens: 0,
    claimedWalletsCount: 0,
    totalWalletsCount: 0,
    unclaimedTokens: 0,
    loading: false
  });

  const [royaltyMetrics, setRoyaltyMetrics] = useState({
    contractBalance: 0,
    claimedTokens: 0,
    claimedWalletsCount: 0,
    totalWalletsCount: 0,
    unclaimedTokens: 0,
    loading: false
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 2. NFT CLUB GENESIS CONTRACT STATES
  // ═════════════════════════════════════════════════════════════════════════
  const [nftState, setNftState] = useState({
    totalMinted: 0,
    maxSupply: 333,
    remainingTokens: 333,
    mintLive: true,
    ethBalance: '0',
    vibeBalance: '0',
    ethPrice: '0.005',
    vibePrice: '1000000',
    aggregatorRouter: '',
    loading: false
  });

  const [editNftEthPrice, setEditNftEthPrice] = useState('0.005');
  const [editNftVibePrice, setEditNftVibePrice] = useState('1000000');
  const [adminMintRecipient, setAdminMintRecipient] = useState(ADMIN_WALLET);
  const [adminMintTokenId, setAdminMintTokenId] = useState('1');
  const [adminSwapEthAmount, setAdminSwapEthAmount] = useState('0.01');
  const [adminManualBurnVibe, setAdminManualBurnVibe] = useState('100000');
  const [newAggregatorRouter, setNewAggregatorRouter] = useState('0x6131B5fae19EA4f9D964eAc0408E4408b66337b5');

  // Generic Admin Transaction Sender (supports Smart Wallet batching & EOA)
  const sendAdminTx = async (to, data, value = '0x0') => {
    const activeWallet = wallets.find(w => w.address.toLowerCase() === activeAddress?.toLowerCase()) || wallets[0];
    if (!activeWallet) throw new Error('No active wallet found. Please connect your admin wallet.');

    const provider = await activeWallet.getEthereumProvider();
    const calldata = appendBuilderSuffix(data);

    try {
      const callsRes = await provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x2105',
          from: activeAddress,
          calls: [{ to, value, data: calldata }],
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
        params: [{ from: activeAddress, to, data: calldata, value }]
      });
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // FETCH HOLDER & ROYALTIES METRICS
  // ═════════════════════════════════════════════════════════════════════════
  const fetchDistributorMetrics = useCallback(async (type = 'holder') => {
    try {
      const isHolder = type === 'holder';
      if (isHolder) setHolderMetrics(prev => ({ ...prev, loading: true }));
      else setRoyaltyMetrics(prev => ({ ...prev, loading: true }));

      const targetCa = isHolder ? DISTRIBUTOR_CA : (royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA);
      const epochId = isHolder ? holderEpochId : royaltyEpochId;

      // 1. Fetch Contract $VIBE Balance
      const balanceWei = await publicClient.readContract({
        address: VIBE_TOKEN_CA,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [targetCa]
      }).catch(() => BigInt(0));

      const contractBalance = Math.round(Number(formatUnits(balanceWei, 18)));

      // Load static proof data for claimed stats
      let proofData = null;
      if (isHolder) {
        try {
          const res = await import('../data/round_1_proofs.json');
          proofData = res.default || res;
        } catch (e) {}
      } else {
        try {
          const res = epochId === '2' 
            ? await import('../data/royalty_2_proofs.json')
            : await import('../data/royalty_1_proofs.json');
          proofData = res.default || res;
        } catch (e) {}
      }

      let claimedTokens = 0;
      let claimedWalletsCount = 0;
      let totalWalletsCount = 0;
      let totalAllocated = isHolder ? 10000000 : (epochId === '2' ? 1900000 : 2500000);

      if (proofData?.claims) {
        const claimsList = Object.values(proofData.claims);
        totalWalletsCount = claimsList.length;

        // Sample check first 40 claims for live percentage estimation
        const sampleSize = Math.min(claimsList.length, 40);
        if (sampleSize > 0) {
          const calls = claimsList.slice(0, sampleSize).map(c => ({
            address: targetCa,
            abi: DISTRIBUTOR_ABI,
            functionName: 'isClaimed',
            args: [BigInt(epochId), BigInt(c.index)]
          }));

          const results = await publicClient.multicall({ contracts: calls }).catch(() => []);
          let sampleClaimedCount = 0;
          let sampleClaimedAmount = 0;
          let sampleTotalAmount = 0;

          results.forEach((res, idx) => {
            const item = claimsList[idx];
            const amt = Number(formatUnits(BigInt(item.amount || '0'), 18));
            sampleTotalAmount += amt;
            if (res.status === 'success' && res.result === true) {
              sampleClaimedCount++;
              sampleClaimedAmount += amt;
            }
          });

          const ratio = sampleTotalAmount > 0 ? (sampleClaimedAmount / sampleTotalAmount) : 0;
          claimedTokens = Math.round(totalAllocated * ratio);
          claimedWalletsCount = Math.round(totalWalletsCount * (sampleClaimedCount / sampleSize));
        }
      }

      const unclaimedTokens = Math.max(0, totalAllocated - claimedTokens);

      const metricsObj = {
        contractBalance,
        claimedTokens,
        claimedWalletsCount,
        totalWalletsCount,
        unclaimedTokens,
        loading: false
      };

      if (isHolder) setHolderMetrics(metricsObj);
      else setRoyaltyMetrics(metricsObj);
    } catch (e) {
      console.error('Failed to fetch distributor metrics:', e);
      if (type === 'holder') setHolderMetrics(prev => ({ ...prev, loading: false }));
      else setRoyaltyMetrics(prev => ({ ...prev, loading: false }));
    }
  }, [holderEpochId, royaltyEpochId, royaltyCustomCa]);

  // ═════════════════════════════════════════════════════════════════════════
  // FETCH NFT CONTRACT STATE
  // ═════════════════════════════════════════════════════════════════════════
  const fetchNftContractState = useCallback(async () => {
    try {
      setNftState(prev => ({ ...prev, loading: true }));

      const [
        totalMintedCount,
        maxSupplyVal,
        remainingVal,
        mintLiveVal,
        ethBalWei,
        vibeBalWei,
        ethPriceWeiVal,
        vibePriceWeiVal,
        aggregatorRouterVal
      ] = await Promise.all([
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'totalMintedCount' }).catch(() => 0),
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'MAX_SUPPLY' }).catch(() => 333),
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'getRemainingTokens' }).catch(() => 333),
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'mintLive' }).catch(() => true),
        publicClient.getBalance({ address: NFT_CONTRACT_ADDRESS }).catch(() => BigInt(0)),
        publicClient.readContract({ address: VIBE_TOKEN_CA, abi: ERC20_ABI, functionName: 'balanceOf', args: [NFT_CONTRACT_ADDRESS] }).catch(() => BigInt(0)),
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'ethPrice' }).catch(() => parseEther('0.005')),
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'vibePrice' }).catch(() => parseUnits('1000000', 18)),
        publicClient.readContract({ address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, functionName: 'aggregatorRouter' }).catch(() => '')
      ]);

      const totalMinted = Number(totalMintedCount);
      const maxSupply = Number(maxSupplyVal);
      const remainingTokens = Number(remainingVal);
      const mintLive = Boolean(mintLiveVal);
      const ethBalance = formatEther(ethBalWei);
      const vibeBalance = Math.round(Number(formatUnits(vibeBalWei, 18))).toLocaleString('en-US');
      const ethPrice = formatEther(ethPriceWeiVal);
      const vibePrice = formatUnits(vibePriceWeiVal, 18);
      const aggregatorRouter = String(aggregatorRouterVal || '');

      setNftState({
        totalMinted,
        maxSupply,
        remainingTokens,
        mintLive,
        ethBalance,
        vibeBalance,
        ethPrice,
        vibePrice,
        aggregatorRouter,
        loading: false
      });

      setEditNftEthPrice(ethPrice);
      setEditNftVibePrice(vibePrice);
      if (aggregatorRouter) setNewAggregatorRouter(aggregatorRouter);
    } catch (e) {
      console.error('Failed to fetch NFT contract state:', e);
      setNftState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchDistributorMetrics('holder');
      fetchDistributorMetrics('royalty');
      fetchNftContractState();
    }
  }, [isAdmin, fetchDistributorMetrics, fetchNftContractState]);

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS: HOLDER & ROYALTIES
  // ═════════════════════════════════════════════════════════════════════════
  const handleSetMerkleRoot = async (type = 'holder') => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const isHolder = type === 'holder';
      const targetCa = isHolder ? DISTRIBUTOR_CA : (royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA);
      const epoch = isHolder ? holderEpochId : royaltyEpochId;
      const root = isHolder ? holderMerkleRoot : royaltyMerkleRoot;

      if (!root || !root.startsWith('0x') || root.length !== 66) {
        throw new Error('Please provide a valid 32-byte bytes32 Merkle root (0x + 64 hex characters).');
      }

      const calldata = encodeFunctionData({
        abi: DISTRIBUTOR_ABI,
        functionName: 'setMerkleRoot',
        args: [BigInt(epoch || '1'), root]
      });

      const hash = await sendAdminTx(targetCa, calldata);
      setTxHash(hash);
      setSuccessMessage(`✅ Merkle root published successfully for ${isHolder ? 'Holder Vesting' : 'Royalties'} Epoch #${epoch}!`);
      setTimeout(() => fetchDistributorMetrics(type), 3000);
    } catch (e) {
      console.error('Failed to set Merkle root:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawDistributorTokens = async (type = 'holder') => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const isHolder = type === 'holder';
      const targetCa = isHolder ? DISTRIBUTOR_CA : (royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA);
      const amountStr = isHolder ? holderWithdrawAmount : royaltyWithdrawAmount;

      if (!amountStr || Number(amountStr) <= 0) {
        throw new Error('Please enter a valid $VIBE amount to withdraw.');
      }

      const amountWei = parseUnits(amountStr.toString(), 18);
      const calldata = encodeFunctionData({
        abi: DISTRIBUTOR_ABI,
        functionName: 'emergencyWithdraw',
        args: [VIBE_TOKEN_CA, amountWei]
      });

      const hash = await sendAdminTx(targetCa, calldata);
      setTxHash(hash);
      setSuccessMessage(`✅ Withdrew ${Number(amountStr).toLocaleString()} $VIBE to Admin Wallet!`);
      if (isHolder) setHolderWithdrawAmount('');
      else setRoyaltyWithdrawAmount('');
      setTimeout(() => fetchDistributorMetrics(type), 3000);
    } catch (e) {
      console.error('Withdraw failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Withdraw transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBurnDistributorTokens = async (type = 'holder') => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const isHolder = type === 'holder';
      const targetCa = isHolder ? DISTRIBUTOR_CA : (royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA);
      const amountStr = isHolder ? holderBurnAmount : royaltyBurnAmount;

      if (!amountStr || Number(amountStr) <= 0) {
        throw new Error('Please enter a valid $VIBE amount to burn.');
      }

      const amountWei = parseUnits(amountStr.toString(), 18);

      // Step 1: Withdraw from contract to Admin
      const withdrawCalldata = encodeFunctionData({
        abi: DISTRIBUTOR_ABI,
        functionName: 'emergencyWithdraw',
        args: [VIBE_TOKEN_CA, amountWei]
      });
      await sendAdminTx(targetCa, withdrawCalldata);

      // Step 2: Transfer to Dead address
      const burnCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [DEAD_ADDRESS, amountWei]
      });
      const hash = await sendAdminTx(VIBE_TOKEN_CA, burnCalldata);

      setTxHash(hash);
      setSuccessMessage(`🔥 Burned ${Number(amountStr).toLocaleString()} $VIBE (sent to 0x0...dEaD)!`);
      if (isHolder) setHolderBurnAmount('');
      else setRoyaltyBurnAmount('');
      setTimeout(() => fetchDistributorMetrics(type), 3000);
    } catch (e) {
      console.error('Burn tokens failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Burn transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS: NFT CLUB CONTRACT
  // ═════════════════════════════════════════════════════════════════════════
  const handleToggleMintLive = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const newStatus = !nftState.mintLive;
      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'setMintLive',
        args: [newStatus]
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage(`✅ NFT Mint is now ${newStatus ? 'ACTIVE (LIVE)' : 'PAUSED'}!`);
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Toggle mint live failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Failed to toggle mint status.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNftPrices = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const ethWei = parseEther(editNftEthPrice.toString());
      const vibeWei = parseUnits(editNftVibePrice.toString(), 18);

      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'setPrices',
        args: [ethWei, vibeWei]
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage(`✅ Prices updated: ${editNftEthPrice} ETH / ${editNftVibePrice} $VIBE!`);
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Update prices failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Failed to update NFT prices.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDirectMint = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const to = adminMintRecipient?.trim() || activeAddress;
      const tokenId = BigInt(adminMintTokenId);

      if (!to || !to.startsWith('0x') || to.length !== 42) {
        throw new Error('Please provide a valid 0x recipient wallet address.');
      }
      if (tokenId < 1 || tokenId > 333) {
        throw new Error('Token ID must be between 1 and 333.');
      }

      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'adminMint',
        args: [to, tokenId]
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage(`🎉 Admin direct minted Vibe Club #${tokenId} to ${to.slice(0, 6)}...${to.slice(-4)}!`);
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Admin direct mint failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Admin direct mint failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSwapAndBurn = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const ethAmountWei = parseEther(adminSwapEthAmount.toString());
      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'adminSwapAndBurn',
        args: [ethAmountWei, '0x']
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage(`🔥 Executed Swap & Burn for ${adminSwapEthAmount} ETH from contract balance!`);
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Swap & Burn failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Admin swap and burn failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminManualBurn = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const vibeAmountWei = parseUnits(adminManualBurnVibe.toString(), 18);
      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'executeManualBurn',
        args: [vibeAmountWei]
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage(`🔥 Burned ${Number(adminManualBurnVibe).toLocaleString()} $VIBE from contract!`);
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Manual burn failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Manual burn failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawNftEth = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'withdrawETH'
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage('✅ Withdrew all ETH from NFT contract to Admin Wallet!');
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Withdraw NFT ETH failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Withdraw ETH failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawNftVibe = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'withdrawVIBE'
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage('✅ Withdrew all $VIBE from NFT contract to Admin Wallet!');
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Withdraw NFT VIBE failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Withdraw VIBE failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAggregatorRouter = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      if (!newAggregatorRouter || !newAggregatorRouter.startsWith('0x') || newAggregatorRouter.length !== 42) {
        throw new Error('Please provide a valid 0x aggregator router address.');
      }

      const calldata = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'setAggregatorRouter',
        args: [newAggregatorRouter.trim()]
      });

      const hash = await sendAdminTx(NFT_CONTRACT_ADDRESS, calldata);
      setTxHash(hash);
      setSuccessMessage(`✅ Aggregator Router updated to ${newAggregatorRouter.slice(0, 6)}...${newAggregatorRouter.slice(-4)}!`);
      setTimeout(fetchNftContractState, 3000);
    } catch (e) {
      console.error('Set router failed:', e);
      setErrorMessage(e?.shortMessage || e?.message || 'Failed to update router.');
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // UNAUTHORIZED / NON-ADMIN VIEW
  // ═════════════════════════════════════════════════════════════════════════
  if (!isAdmin) {
    return (
      <div className="admin-view-container" style={{ padding: '40px 16px 80px 16px', maxWidth: '640px', margin: '0 auto', textAlign: 'center', boxSizing: 'border-box' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
            border: '2px solid rgba(255, 68, 102, 0.45)',
            borderRadius: '20px',
            padding: '40px 24px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(255, 68, 102, 0.2)'
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 68, 102, 0.12)', border: '2px solid #ff4466', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 0 20px rgba(255, 68, 102, 0.35)' }}>
            <AlertTriangle size={32} color="#ff4466" />
          </div>
          <h2 style={{ fontSize: '15px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", margin: '0 0 14px 0', letterSpacing: '0.6px' }}>
            ACCESS DENIED
          </h2>
          <p style={{ fontSize: '8.5px', color: '#cbd5e1', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.8, margin: '0 0 24px 0' }}>
            {activeAddress
              ? `Connected wallet (${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}) is not authorized as Admin.`
              : 'Please connect the owner/admin wallet to access the control panel.'}
          </p>

          {!activeAddress ? (
            <button
              onClick={login}
              style={{
                background: 'linear-gradient(135deg, #00f5ff 0%, #00b8ff 100%)',
                border: '1.5px solid #00f5ff',
                color: '#020b1a',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9.5px',
                fontWeight: 900,
                padding: '14px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 0 18px rgba(0, 245, 255, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Wallet size={16} />
              <span>CONNECT ADMIN WALLET</span>
            </button>
          ) : (
            <button
              onClick={() => {
                disconnect?.();
                logout?.();
              }}
              style={{
                background: 'rgba(255, 68, 102, 0.15)',
                border: '1.5px solid #ff4466',
                color: '#ff4466',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                fontWeight: 900,
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              DISCONNECT WALLET
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // AUTHORIZED ADMIN PANEL VIEW
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="admin-view-container" style={{ padding: '20px 14px 80px 14px', maxWidth: '1040px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Hero Header */}
      <div
        className="rewards-hero-header"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '24px',
          padding: '12px 8px 8px 8px'
        }}
      >
        <h2
          className="rewards-hero-title"
          style={{
            fontSize: '20px',
            margin: '0 0 12px 0',
            letterSpacing: '0.6px',
            color: '#ffffff',
            fontFamily: "'Press Start 2P', monospace",
            textAlign: 'center',
            width: '100%',
            lineHeight: 1.3
          }}
        >
          ADMIN <span style={{ color: '#00f5ff' }}>PANEL</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            className="rewards-hero-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(0, 255, 136, 0.12)',
              border: '1.5px solid #00ff88',
              borderRadius: '99px',
              padding: '7px 16px',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', flexShrink: 0 }} />
            <span className="rewards-hero-pill-text" style={{ fontSize: '7px', color: '#00ff88', letterSpacing: '0.5px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
              AUTHENTICATED OWNER: {activeAddress?.slice(0, 6)}...{activeAddress?.slice(-4)}
            </span>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'holder') fetchDistributorMetrics('holder');
              else if (activeTab === 'royalty') fetchDistributorMetrics('royalty');
              else fetchNftContractState();
            }}
            style={{
              background: 'rgba(4, 20, 48, 0.9)',
              border: '1.5px solid rgba(0, 245, 255, 0.35)',
              color: '#00f5ff',
              borderRadius: '8px',
              padding: '7px 12px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '7px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={12} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner (Success / Error / TxHash) */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(255, 68, 102, 0.15)',
            border: '1.5px solid #ff4466',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '8px',
            color: '#ff6688',
            fontFamily: "'Press Start 2P', monospace",
            lineHeight: 1.6,
            marginBottom: '20px',
            boxShadow: '0 0 16px rgba(255, 68, 102, 0.2)'
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.15)',
            border: '1.5px solid #00ff88',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '8.5px',
            color: '#00ff88',
            fontFamily: "'Press Start 2P', monospace",
            lineHeight: 1.6,
            marginBottom: '20px',
            boxShadow: '0 0 16px rgba(0, 255, 136, 0.25)'
          }}
        >
          {successMessage}
          {txHash && (
            <div style={{ marginTop: '8px' }}>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#00f5ff', textDecoration: 'underline', fontSize: '7.5px' }}
              >
                VIEW TX ON BASESCAN ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* 3 Main Module Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(4, 14, 36, 0.8)',
          border: '1.5px solid rgba(0, 245, 255, 0.25)',
          borderRadius: '14px',
          padding: '6px',
          marginBottom: '24px'
        }}
      >
        <button
          onClick={() => setActiveTab('holder')}
          style={{
            padding: '12px 8px',
            borderRadius: '10px',
            border: activeTab === 'holder' ? '1.5px solid #00f5ff' : '1px solid transparent',
            background: activeTab === 'holder' ? 'linear-gradient(135deg, rgba(0, 245, 255, 0.25) 0%, rgba(0, 184, 255, 0.15) 100%)' : 'transparent',
            color: activeTab === 'holder' ? '#00f5ff' : '#88aacc',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7.5px',
            fontWeight: 900,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'center'
          }}
        >
          <Coins size={16} color={activeTab === 'holder' ? '#00f5ff' : '#88aacc'} />
          <span>HOLDER VESTING</span>
        </button>

        <button
          onClick={() => setActiveTab('royalty')}
          style={{
            padding: '12px 8px',
            borderRadius: '10px',
            border: activeTab === 'royalty' ? '1.5px solid #c084fc' : '1px solid transparent',
            background: activeTab === 'royalty' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(192, 132, 252, 0.15) 100%)' : 'transparent',
            color: activeTab === 'royalty' ? '#c084fc' : '#88aacc',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7.5px',
            fontWeight: 900,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'center'
          }}
        >
          <Crown size={16} color={activeTab === 'royalty' ? '#c084fc' : '#88aacc'} />
          <span>ROYALTIES VESTING</span>
        </button>

        <button
          onClick={() => setActiveTab('nft')}
          style={{
            padding: '12px 8px',
            borderRadius: '10px',
            border: activeTab === 'nft' ? '1.5px solid #ffd700' : '1px solid transparent',
            background: activeTab === 'nft' ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 170, 0, 0.15) 100%)' : 'transparent',
            color: activeTab === 'nft' ? '#ffd700' : '#88aacc',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7.5px',
            fontWeight: 900,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'center'
          }}
        >
          <Sparkles size={16} color={activeTab === 'nft' ? '#ffd700' : '#88aacc'} />
          <span>NFT CLUB MINT</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: HOLDER REWARDS (VESTING)                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'holder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header & Contract Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
              <h3 style={{ fontSize: '11px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
                HOLDER REWARDS VESTING CONTROLS
              </h3>
            </div>
            <a
              href={`https://basescan.org/address/${DISTRIBUTOR_CA}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '7.5px', color: '#88aacc', textDecoration: 'none', fontFamily: "'Press Start 2P', monospace" }}
            >
              CA: {DISTRIBUTOR_CA.slice(0, 6)}...{DISTRIBUTOR_CA.slice(-4)} ↗
            </a>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 245, 255, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                CONTRACT $VIBE BALANCE
              </div>
              <div style={{ fontSize: '12px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {holderMetrics.loading ? '...' : `${holderMetrics.contractBalance.toLocaleString()} $VIBE`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 255, 136, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                WALLETS CLAIMED
              </div>
              <div style={{ fontSize: '12px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {holderMetrics.loading ? '...' : `${holderMetrics.claimedWalletsCount} / ${holderMetrics.totalWalletsCount}`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 245, 255, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                TOTAL CLAIMED
              </div>
              <div style={{ fontSize: '12px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {holderMetrics.loading ? '...' : `+${holderMetrics.claimedTokens.toLocaleString()} $VIBE`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(255, 215, 0, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                UNCLAIMED IN ROUND
              </div>
              <div style={{ fontSize: '12px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {holderMetrics.loading ? '...' : `${holderMetrics.unclaimedTokens.toLocaleString()} $VIBE`}
              </div>
            </div>
          </div>

          {/* Action 1: Set Merkle Root */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(0, 245, 255, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              1. PUBLISH MERKLE ROOT PROOF
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={holderEpochId}
                onChange={(e) => setHolderEpochId(e.target.value)}
                placeholder="Round"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(0, 245, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#ffffff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                value={holderMerkleRoot}
                onChange={(e) => setHolderMerkleRoot(e.target.value)}
                placeholder="0x... Merkle Root"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(0, 245, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#00f5ff',
                  fontFamily: 'monospace',
                  fontSize: '8.5px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleSetMerkleRoot('holder')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #00f5ff 0%, #00b8ff 100%)',
                  border: '1.5px solid #00f5ff',
                  color: '#020b1a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'PROCESSING...' : 'SET MERKLE ROOT'}
              </button>
            </div>
          </div>

          {/* Action 2: Withdraw Tokens */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(0, 245, 255, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              2. WITHDRAW TOKENS TO ADMIN WALLET
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={holderWithdrawAmount}
                  onChange={(e) => setHolderWithdrawAmount(e.target.value)}
                  placeholder="Amount in $VIBE (e.g. 10000000)"
                  style={{
                    width: '100%',
                    background: 'rgba(2, 11, 26, 0.9)',
                    border: '1.5px solid rgba(0, 245, 255, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 65px 10px 14px',
                    color: '#ffffff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => setHolderWithdrawAmount(String(holderMetrics.contractBalance || 0))}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 245, 255, 0.15)',
                    border: '1px solid #00f5ff',
                    color: '#00f5ff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '6.5px',
                    fontWeight: 900,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  MAX
                </button>
              </div>
              <button
                onClick={() => handleWithdrawDistributorTokens('holder')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #00f5ff 0%, #00b8ff 100%)',
                  border: '1.5px solid #00f5ff',
                  color: '#020b1a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'PROCESSING...' : 'WITHDRAW TO ADMIN'}
              </button>
            </div>
          </div>

          {/* Action 3: Burn Unclaimed Tokens */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(255, 68, 102, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              3. BURN UNCLAIMED TOKENS (SEND TO DEAD ADDRESS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={holderBurnAmount}
                onChange={(e) => setHolderBurnAmount(e.target.value)}
                placeholder="Amount in $VIBE to burn"
                style={{
                  width: '100%',
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(255, 68, 102, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ff4466',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => handleBurnDistributorTokens('holder')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #ff4466 0%, #cc0033 100%)',
                  border: '1.5px solid #ff4466',
                  color: '#ffffff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 16px rgba(255, 68, 102, 0.3)'
                }}
              >
                {loading ? 'PROCESSING...' : '🔥 BURN TOKENS'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: VIBE CLUB ROYALTIES (NFT)                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'royalty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header & Custom CA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 8px #c084fc' }} />
              <h3 style={{ fontSize: '11px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
                VIBE CLUB ROYALTIES CONTROLS
              </h3>
            </div>
            <a
              href={`https://basescan.org/address/${royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '7.5px', color: '#c084fc', textDecoration: 'none', fontFamily: "'Press Start 2P', monospace" }}
            >
              CA: {(royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA).slice(0, 6)}...{(royaltyCustomCa || ROYALTY_DISTRIBUTOR_CA).slice(-4)} ↗
            </a>
          </div>

          {/* Custom Royalty CA Input */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '7.5px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
              ROYALTY DISTRIBUTOR CA:
            </span>
            <input
              type="text"
              value={royaltyCustomCa}
              onChange={(e) => {
                const val = e.target.value.trim();
                setRoyaltyCustomCa(val);
                if (val.length === 42) fetchDistributorMetrics('royalty');
              }}
              placeholder="0x... Royalty Contract Address"
              style={{
                flex: 1,
                minWidth: '240px',
                background: 'rgba(2, 11, 26, 0.9)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '8px',
                outline: 'none'
              }}
            />
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                CONTRACT $VIBE BALANCE
              </div>
              <div style={{ fontSize: '12px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {royaltyMetrics.loading ? '...' : `${royaltyMetrics.contractBalance.toLocaleString()} $VIBE`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 255, 136, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                WALLETS CLAIMED
              </div>
              <div style={{ fontSize: '12px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {royaltyMetrics.loading ? '...' : `${royaltyMetrics.claimedWalletsCount} / ${royaltyMetrics.totalWalletsCount}`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                TOTAL CLAIMED
              </div>
              <div style={{ fontSize: '12px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {royaltyMetrics.loading ? '...' : `+${royaltyMetrics.claimedTokens.toLocaleString()} $VIBE`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(255, 215, 0, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                UNCLAIMED IN ROUND
              </div>
              <div style={{ fontSize: '12px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {royaltyMetrics.loading ? '...' : `${royaltyMetrics.unclaimedTokens.toLocaleString()} $VIBE`}
              </div>
            </div>
          </div>

          {/* Action 1: Set Merkle Root */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              1. PUBLISH ROYALTIES MERKLE ROOT
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={royaltyEpochId}
                onChange={(e) => {
                  const ep = e.target.value;
                  setRoyaltyEpochId(ep);
                  if (ep === '2') setRoyaltyMerkleRoot('0xa86db60c2394541bfec649c253b26c63b84db5b32ecce16597ea94e4304db96c');
                  else if (ep === '1') setRoyaltyMerkleRoot('0xb07d57c152a5a549646b9bb74b62fbe755910c2cfae868a2bf613e5bc8565a0c');
                  fetchDistributorMetrics('royalty');
                }}
                placeholder="Epoch"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#ffffff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                value={royaltyMerkleRoot}
                onChange={(e) => setRoyaltyMerkleRoot(e.target.value)}
                placeholder="0x... Merkle Root"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#c084fc',
                  fontFamily: 'monospace',
                  fontSize: '8.5px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleSetMerkleRoot('royalty')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                  border: '1.5px solid #c084fc',
                  color: '#020b1a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'PROCESSING...' : 'SET MERKLE ROOT'}
              </button>
            </div>
          </div>

          {/* Action 2: Withdraw Tokens */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              2. WITHDRAW TOKENS TO ADMIN WALLET
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={royaltyWithdrawAmount}
                  onChange={(e) => setRoyaltyWithdrawAmount(e.target.value)}
                  placeholder="Amount in $VIBE"
                  style={{
                    width: '100%',
                    background: 'rgba(2, 11, 26, 0.9)',
                    border: '1.5px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 65px 10px 14px',
                    color: '#ffffff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => setRoyaltyWithdrawAmount(String(royaltyMetrics.contractBalance || 0))}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid #c084fc',
                    color: '#c084fc',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '6.5px',
                    fontWeight: 900,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  MAX
                </button>
              </div>
              <button
                onClick={() => handleWithdrawDistributorTokens('royalty')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                  border: '1.5px solid #c084fc',
                  color: '#020b1a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'PROCESSING...' : 'WITHDRAW TO ADMIN'}
              </button>
            </div>
          </div>

          {/* Action 3: Burn Tokens */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(255, 68, 102, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              3. BURN UNCLAIMED TOKENS (SEND TO DEAD ADDRESS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={royaltyBurnAmount}
                onChange={(e) => setRoyaltyBurnAmount(e.target.value)}
                placeholder="Amount in $VIBE to burn"
                style={{
                  width: '100%',
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(255, 68, 102, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ff4466',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => handleBurnDistributorTokens('royalty')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #ff4466 0%, #cc0033 100%)',
                  border: '1.5px solid #ff4466',
                  color: '#ffffff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'PROCESSING...' : '🔥 BURN TOKENS'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: VIBE CLUB NFT MINT CONTROLS                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'nft' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header & Contract Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
              <h3 style={{ fontSize: '11px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
                VIBE CLUB GENESIS NFT CONTROLS
              </h3>
            </div>
            <a
              href={`https://basescan.org/address/${NFT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '7.5px', color: '#ffd700', textDecoration: 'none', fontFamily: "'Press Start 2P', monospace" }}
            >
              CA: {NFT_CONTRACT_ADDRESS.slice(0, 6)}...{NFT_CONTRACT_ADDRESS.slice(-4)} ↗
            </a>
          </div>

          {/* 6 NFT Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 245, 255, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                TOTAL MINTED / MAX
              </div>
              <div style={{ fontSize: '12px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {nftState.loading ? '...' : `${nftState.totalMinted} / ${nftState.maxSupply}`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: nftState.mintLive ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid rgba(255, 68, 102, 0.4)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                MINT STATUS
              </div>
              <div style={{ fontSize: '12px', color: nftState.mintLive ? '#00ff88' : '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {nftState.loading ? '...' : (nftState.mintLive ? '● ACTIVE (LIVE)' : '⏸ PAUSED')}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(255, 215, 0, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                CONTRACT ETH BALANCE
              </div>
              <div style={{ fontSize: '12px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {nftState.loading ? '...' : `${Number(nftState.ethBalance).toFixed(4)} ETH`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 245, 255, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                CONTRACT $VIBE BALANCE
              </div>
              <div style={{ fontSize: '12px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {nftState.loading ? '...' : `${nftState.vibeBalance} $VIBE`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(0, 245, 255, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                CURRENT PRICES
              </div>
              <div style={{ fontSize: '9px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                {nftState.loading ? '...' : `${nftState.ethPrice} ETH / ${Number(nftState.vibePrice).toLocaleString()} $VIBE`}
              </div>
            </div>

            <div style={{ background: 'rgba(4, 20, 48, 0.9)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '6px' }}>
                KYBER ROUTER
              </div>
              <div style={{ fontSize: '8px', color: '#c084fc', fontFamily: 'monospace', fontWeight: 900 }}>
                {nftState.loading ? '...' : (nftState.aggregatorRouter ? `${nftState.aggregatorRouter.slice(0, 6)}...${nftState.aggregatorRouter.slice(-4)}` : 'DEFAULT')}
              </div>
            </div>
          </div>

          {/* Action 1: Toggle Mint Live & Update Prices */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(0, 245, 255, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '14px' }}>
              1. MINT STATUS &amp; PRICE CONTROLS
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
              {/* Toggle Pause / Live */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '7px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                  MINT ACTIVE STATUS:
                </span>
                <button
                  onClick={handleToggleMintLive}
                  disabled={loading}
                  style={{
                    background: nftState.mintLive ? 'rgba(255, 68, 102, 0.15)' : 'rgba(0, 255, 136, 0.15)',
                    border: nftState.mintLive ? '1.5px solid #ff4466' : '1.5px solid #00ff88',
                    color: nftState.mintLive ? '#ff4466' : '#00ff88',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 900,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {nftState.mintLive ? '⏸ PAUSE MINT' : '▶️ UNPAUSE MINT (SET LIVE)'}
                </button>
              </div>

              {/* Edit Prices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '7px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                  SET ETH &amp; $VIBE PRICES:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={editNftEthPrice}
                    onChange={(e) => setEditNftEthPrice(e.target.value)}
                    placeholder="ETH (0.005)"
                    style={{
                      flex: 1,
                      background: 'rgba(2, 11, 26, 0.9)',
                      border: '1.5px solid rgba(0, 245, 255, 0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#00f5ff',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={editNftVibePrice}
                    onChange={(e) => setEditNftVibePrice(e.target.value)}
                    placeholder="$VIBE"
                    style={{
                      flex: 1,
                      background: 'rgba(2, 11, 26, 0.9)',
                      border: '1.5px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#ffd700',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleUpdateNftPrices}
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #00f5ff 0%, #00b8ff 100%)',
                      border: '1.5px solid #00f5ff',
                      color: '#020b1a',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      fontWeight: 900,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action 2: Admin Direct Mint (Free) */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(255, 215, 0, 0.35)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '14px' }}>
              2. FREE ADMIN DIRECT MINT (ANY RECIPIENT &amp; TOKEN ID)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={adminMintRecipient}
                onChange={(e) => setAdminMintRecipient(e.target.value)}
                placeholder="0x... Recipient Address"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '8.5px',
                  outline: 'none'
                }}
              />
              <input
                type="number"
                min="1"
                max="333"
                value={adminMintTokenId}
                onChange={(e) => setAdminMintTokenId(e.target.value)}
                placeholder="ID (1-333)"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#ffd700',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAdminDirectMint}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                  border: '1.5px solid #ffd700',
                  color: '#020b1a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'MINTING...' : '👑 ADMIN MINT ↗'}
              </button>
            </div>
          </div>

          {/* Action 3: Contract Swap & Burn & Manual VIBE Burn */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {/* Swap & Burn Contract ETH */}
            <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(255, 68, 102, 0.3)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '7.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '10px' }}>
                3. SWAP CONTRACT ETH &amp; BURN 80%
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={adminSwapEthAmount}
                  onChange={(e) => setAdminSwapEthAmount(e.target.value)}
                  placeholder="ETH Amount"
                  style={{
                    flex: 1,
                    background: 'rgba(2, 11, 26, 0.9)',
                    border: '1px solid rgba(255, 68, 102, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#ff4466',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleAdminSwapAndBurn}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #ff4466 0%, #cc0033 100%)',
                    border: '1.5px solid #ff4466',
                    color: '#ffffff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7px',
                    fontWeight: 900,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  SWAP &amp; BURN
                </button>
              </div>
            </div>

            {/* Manual Burn Contract VIBE */}
            <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(255, 68, 102, 0.3)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '7.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '10px' }}>
                4. BURN CONTRACT $VIBE
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={adminManualBurnVibe}
                  onChange={(e) => setAdminManualBurnVibe(e.target.value)}
                  placeholder="$VIBE Amount"
                  style={{
                    flex: 1,
                    background: 'rgba(2, 11, 26, 0.9)',
                    border: '1px solid rgba(255, 68, 102, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#ff4466',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleAdminManualBurn}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #ff4466 0%, #cc0033 100%)',
                    border: '1.5px solid #ff4466',
                    color: '#ffffff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7px',
                    fontWeight: 900,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  BURN $VIBE
                </button>
              </div>
            </div>
          </div>

          {/* Action 4: Withdrawals from NFT Contract */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(0, 245, 255, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              5. WITHDRAW FUNDS FROM NFT CONTRACT
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleWithdrawNftEth}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  background: 'rgba(0, 245, 255, 0.12)',
                  border: '1.5px solid #00f5ff',
                  color: '#00f5ff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                WITHDRAW ALL ETH ({Number(nftState.ethBalance).toFixed(4)} ETH)
              </button>

              <button
                onClick={handleWithdrawNftVibe}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  background: 'rgba(255, 215, 0, 0.12)',
                  border: '1.5px solid #ffd700',
                  color: '#ffd700',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                WITHDRAW ALL $VIBE ({nftState.vibeBalance} $VIBE)
              </button>
            </div>
          </div>

          {/* Action 5: Set Aggregator Router */}
          <div style={{ background: 'rgba(4, 20, 48, 0.85)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '8px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '12px' }}>
              6. SET KYBERSWAP / AGGREGATOR ROUTER
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={newAggregatorRouter}
                onChange={(e) => setNewAggregatorRouter(e.target.value)}
                placeholder="0x... Kyber Router Address"
                style={{
                  background: 'rgba(2, 11, 26, 0.9)',
                  border: '1.5px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#c084fc',
                  fontFamily: 'monospace',
                  fontSize: '8.5px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSetAggregatorRouter}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                  border: '1.5px solid #c084fc',
                  color: '#020b1a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7.5px',
                  fontWeight: 900,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'SAVING...' : 'SET ROUTER'}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default BaseAppAdminView;

