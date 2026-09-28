import { useState, useEffect, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { parseAbi, encodeFunctionData } from 'viem';
import { publicClient } from '../config/rpc';
import { appendBuilderSuffix, DATA_SUFFIX } from '../config/builderCode';

export const VIBE_CHECKIN_CONTRACT_ADDRESS =
  import.meta.env?.VITE_CHECKIN_CONTRACT_ADDRESS ||
  '0x64f88d890e9629b871d411d7884051af261a56a2';

export const CHECKIN_ABI = parseAbi([
  'function checkIn() payable external',
  'function checkInFor(address user) payable external',
  'function checkInFee() view returns (uint256)',
  'function getCheckInInfo(address user) view returns (uint256 currentStreak, uint256 longestStreak, uint256 totalCheckIns, uint256 lastCheckInTimestamp, bool canCheckInToday, uint256 secondsUntilNextCheckIn)',
  'function canCheckIn(address user) view returns (bool)',
  'function userCheckIns(address) view returns (uint256 currentStreak, uint256 longestStreak, uint256 totalCheckIns, uint256 lastCheckInTimestamp, uint256 lastCheckInDay)',
  'function totalUsers() view returns (uint256)',
  'function totalGlobalCheckIns() view returns (uint256)',
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner) external',
  'function setCheckInFee(uint256 newFee) external',
  'function withdrawETH() external',
  'function paused() view returns (bool)',
  'event CheckedIn(address indexed user, uint256 currentStreak, uint256 totalCheckIns, uint256 timestamp)'
]);

const EVENT_NAME = 'vibe_checkin_update';

function getStorageKey(address) {
  return address ? `vibe_checkin_${address.toLowerCase()}` : null;
}

function isSameUtcDay(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

function getInitialLocalState(address) {
  if (!address) {
    return {
      streak: 0,
      lastCheckIn: null,
      totalCheckIns: 0,
      hasCheckedInToday: false
    };
  }

  try {
    const key = getStorageKey(address);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const checkedToday = isSameUtcDay(parsed.lastCheckIn, new Date());
      return {
        streak: Number(parsed.streak) || 0,
        lastCheckIn: parsed.lastCheckIn || null,
        totalCheckIns: Number(parsed.totalCheckIns) || 0,
        hasCheckedInToday: checkedToday
      };
    }
  } catch (e) {
    console.warn('Error reading local check-in state:', e);
  }

  return {
    streak: 0,
    lastCheckIn: null,
    totalCheckIns: 0,
    hasCheckedInToday: false
  };
}

export function useVibeCheckIn(address) {
  const { wallets } = useWallets();
  const [state, setState] = useState(() => getInitialLocalState(address));
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeUntilNext, setTimeUntilNext] = useState('');

  const isContractActive = Boolean(
    VIBE_CHECKIN_CONTRACT_ADDRESS &&
    VIBE_CHECKIN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'
  );

  // Fetch live on-chain check-in details
  const fetchOnChainState = useCallback(async () => {
    if (!address) {
      setState({
        streak: 0,
        lastCheckIn: null,
        totalCheckIns: 0,
        hasCheckedInToday: false
      });
      return;
    }

    if (!isContractActive) {
      const local = getInitialLocalState(address);
      setState(local);
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: VIBE_CHECKIN_CONTRACT_ADDRESS,
        abi: CHECKIN_ABI,
        functionName: 'getCheckInInfo',
        args: [address]
      });

      if (data) {
        const [
          currentStreak,
          longestStreak,
          totalCheckIns,
          lastCheckInTimestamp,
          canCheckInToday,
          secondsUntilNextCheckIn
        ] = data;

        const lastCheckInDate = lastCheckInTimestamp > 0n
          ? new Date(Number(lastCheckInTimestamp) * 1000).toISOString()
          : null;

        const newState = {
          streak: Number(currentStreak),
          longestStreak: Number(longestStreak),
          totalCheckIns: Number(totalCheckIns),
          lastCheckIn: lastCheckInDate,
          hasCheckedInToday: !canCheckInToday
        };

        setState(newState);

        // Also persist to local cache
        const key = getStorageKey(address);
        if (key) {
          localStorage.setItem(key, JSON.stringify(newState));
        }
      }
    } catch (err) {
      console.warn('Error reading on-chain check-in info, using fallback:', err);
      const local = getInitialLocalState(address);
      setState(local);
    }
  }, [address, isContractActive]);

  useEffect(() => {
    fetchOnChainState();
    window.addEventListener(EVENT_NAME, fetchOnChainState);
    window.addEventListener('storage', fetchOnChainState);
    const interval = setInterval(fetchOnChainState, 20000);
    return () => {
      window.removeEventListener(EVENT_NAME, fetchOnChainState);
      window.removeEventListener('storage', fetchOnChainState);
      clearInterval(interval);
    };
  }, [fetchOnChainState]);

  // Next UTC reset countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ));
      const diff = nextUtcMidnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeUntilNext('00H 00M 00S');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const pad = (n) => String(n).padStart(2, '0');
      setTimeUntilNext(`${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const performCheckIn = async () => {
    if (!address || state.hasCheckedInToday || isCheckingIn) return;

    setIsCheckingIn(true);
    setCheckInSuccess(false);
    setErrorMessage('');
    setTxHash(null);

    try {
      if (isContractActive) {
        // Find connected wallet
        const activeWallet = wallets.find(
          (w) => w.address?.toLowerCase() === address.toLowerCase()
        ) || wallets[0];

        if (!activeWallet) {
          throw new Error('Wallet not connected');
        }

        let provider;
        if (typeof window !== 'undefined' && window.ethereum && activeWallet.walletClientType !== 'privy') {
          provider = window.ethereum;
        } else {
          provider = await activeWallet.getEthereumProvider();
        }

        // Encode calldata for checkIn()
        const rawCalldata = encodeFunctionData({
          abi: CHECKIN_ABI,
          functionName: 'checkIn',
          args: []
        });

        // Attach Base ERC-8021 Builder Code suffix
        const calldataWithSuffix = appendBuilderSuffix(rawCalldata);

        // Fetch current check-in fee from contract (default 0.000001 ETH)
        let feeWei = 1000000000000n;
        try {
          const fee = await publicClient.readContract({
            address: VIBE_CHECKIN_CONTRACT_ADDRESS,
            abi: CHECKIN_ABI,
            functionName: 'checkInFee'
          });
          if (fee !== undefined) feeWei = fee;
        } catch (e) {}

        const hexValue = '0x' + feeWei.toString(16);

        // Send transaction: First attempt EIP-5792 wallet_sendCalls for Smart Wallets, fallback to eth_sendTransaction for EOAs
        let hash = null;
        try {
          const callsResponse = await provider.request({
            method: 'wallet_sendCalls',
            params: [{
              version: '1.0',
              chainId: '0x2105', // Base Mainnet (8453)
              from: address,
              calls: [{
                to: VIBE_CHECKIN_CONTRACT_ADDRESS,
                value: hexValue,
                data: calldataWithSuffix
              }],
              capabilities: DATA_SUFFIX ? {
                dataSuffix: {
                  value: DATA_SUFFIX,
                  optional: true
                }
              } : undefined
            }]
          });

          if (callsResponse) {
            if (typeof callsResponse === 'string' && callsResponse.startsWith('0x') && callsResponse.length === 66) {
              hash = callsResponse;
            } else {
              const callId = typeof callsResponse === 'object' ? (callsResponse.id || callsResponse) : callsResponse;
              for (let i = 0; i < 30; i++) {
                await new Promise((r) => setTimeout(r, 1000));
                try {
                  const status = await provider.request({
                    method: 'wallet_getCallsStatus',
                    params: [callId]
                  });
                  if (status?.receipts?.[0]?.transactionHash) {
                    hash = status.receipts[0].transactionHash;
                    break;
                  }
                  if (status?.status === 'CONFIRMED' || status?.status === 'SUCCESS') {
                    if (status.receipts?.[0]?.transactionHash) {
                      hash = status.receipts[0].transactionHash;
                      break;
                    }
                  }
                } catch (err) {}
              }
            }
          }
        } catch (e) {
          console.log('wallet_sendCalls not supported or failed, falling back to eth_sendTransaction:', e?.message || e);
        }

        if (!hash) {
          hash = await provider.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: address,
                to: VIBE_CHECKIN_CONTRACT_ADDRESS,
                data: calldataWithSuffix,
                value: hexValue
              }
            ]
          });
        }

        if (hash) {
          setTxHash(hash);
          try {
            await publicClient.waitForTransactionReceipt({ hash });
          } catch (e) {
            console.warn('Waiting for transaction receipt warning:', e);
          }
        }

        // Refresh on-chain state
        await fetchOnChainState();
      } else {
        // Local simulation fallback
        await new Promise((resolve) => setTimeout(resolve, 800));

        const nowIso = new Date().toISOString();
        const newStreak = (state.streak || 0) + 1;
        const newTotal = (state.totalCheckIns || 0) + 1;

        const newState = {
          streak: newStreak,
          lastCheckIn: nowIso,
          totalCheckIns: newTotal,
          hasCheckedInToday: true
        };

        const key = getStorageKey(address);
        if (key) {
          localStorage.setItem(key, JSON.stringify(newState));
        }

        setState(newState);
      }

      setCheckInSuccess(true);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error('Check-in error:', err);
      setErrorMessage(err?.message || 'Check-in transaction failed');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return {
    streak: state.streak,
    lastCheckIn: state.lastCheckIn,
    totalCheckIns: state.totalCheckIns,
    hasCheckedInToday: state.hasCheckedInToday,
    canCheckInToday: !state.hasCheckedInToday && Boolean(address),
    isCheckingIn,
    checkInSuccess,
    txHash,
    errorMessage,
    timeUntilNext,
    performCheckIn,
    refetch: fetchOnChainState,
    isContractActive
  };
}
