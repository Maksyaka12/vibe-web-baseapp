import { useState, useEffect, useCallback } from 'react';
import { formatUnits, parseAbi } from 'viem';
import { publicClient } from '../config/rpc';

const CA = '0xb200000000000000000000df24ecb8bf51100a01';
const NFT_CA = '0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886';

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)'
]);

const NFT_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function walletMintCount(address owner) view returns (uint256)'
]);

export const formatConcise = (num) => {
  const n = parseFloat(num || 0);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1e9) {
    const val = (n / 1e9).toFixed(2);
    return (val.endsWith('.00') ? val.slice(0, -3) : val.endsWith('0') ? val.slice(0, -1) : val) + 'B';
  }
  if (n >= 1e6) {
    const val = (n / 1e6).toFixed(2);
    return (val.endsWith('.00') ? val.slice(0, -3) : val.endsWith('0') ? val.slice(0, -1) : val) + 'M';
  }
  if (n >= 1e3) {
    const val = (n / 1e3).toFixed(2);
    return (val.endsWith('.00') ? val.slice(0, -3) : val.endsWith('0') ? val.slice(0, -1) : val) + 'K';
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export function useVibeBalances(address) {
  const [balance, setBalance] = useState(() => {
    if (!address) return 0;
    try {
      const cached = localStorage.getItem('vibe_balance_' + address.toLowerCase());
      return cached !== null ? Number(cached) : 0;
    } catch {
      return 0;
    }
  });

  const [nftCount, setNftCount] = useState(() => {
    if (!address) return 0;
    try {
      const cached = localStorage.getItem('vibe_nfts_' + address.toLowerCase());
      return cached !== null ? Number(cached) : 0;
    } catch {
      return 0;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync with localStorage on any change (e.g. after Checker updates balances)
  useEffect(() => {
    if (!address) {
      setBalance(0);
      setNftCount(0);
      return;
    }
    const syncFromCache = () => {
      try {
        const cachedBal = localStorage.getItem('vibe_balance_' + address.toLowerCase());
        if (cachedBal !== null) setBalance(Number(cachedBal));
        const cachedNfts = localStorage.getItem('vibe_nfts_' + address.toLowerCase());
        if (cachedNfts !== null) setNftCount(Number(cachedNfts));
      } catch {}
    };

    syncFromCache();
    window.addEventListener('storage', syncFromCache);
    return () => window.removeEventListener('storage', syncFromCache);
  }, [address]);

  const fetchBalances = useCallback(async () => {
    if (!address) {
      setBalance(0);
      setNftCount(0);
      return;
    }

    try {
      setLoading(true);
      const results = await publicClient.multicall({
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
          }
        ],
        allowFailure: true
      });

      if (results[0]?.status === 'success' && results[0].result !== undefined) {
        const liveBal = Number(formatUnits(results[0].result, 18));
        setBalance(liveBal);
        try {
          localStorage.setItem('vibe_balance_' + address.toLowerCase(), liveBal.toString());
        } catch {}
      }

      let currentNfts = 0;
      if (results[1]?.status === 'success' && results[1].result !== undefined) {
        currentNfts = Number(results[1].result);
      } else if (results[2]?.status === 'success' && results[2].result !== undefined) {
        currentNfts = Number(results[2].result);
      }
      setNftCount(currentNfts);
      try {
        localStorage.setItem('vibe_nfts_' + address.toLowerCase(), currentNfts.toString());
      } catch {}
    } catch (err) {
      console.warn('Failed to fetch VIBE balances:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [address, fetchBalances]);

  return {
    balance,
    nftCount,
    loading,
    refetch: fetchBalances,
    formattedBalance: formatConcise(balance)
  };
}
