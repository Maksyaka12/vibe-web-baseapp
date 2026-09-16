import { useState, useEffect, useCallback } from 'react';

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

function getInitialState(address) {
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
    console.warn('Error reading check-in state:', e);
  }

  // Default initial state for new wallet
  return {
    streak: 0,
    lastCheckIn: null,
    totalCheckIns: 0,
    hasCheckedInToday: false
  };
}

export function useVibeCheckIn(address) {
  const [state, setState] = useState(() => getInitialState(address));
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  // Sync state whenever address or custom event changes
  const syncState = useCallback(() => {
    if (!address) {
      setState({
        streak: 0,
        lastCheckIn: null,
        totalCheckIns: 0,
        hasCheckedInToday: false
      });
      return;
    }
    const current = getInitialState(address);
    setState(current);
  }, [address]);

  useEffect(() => {
    syncState();
    window.addEventListener(EVENT_NAME, syncState);
    window.addEventListener('storage', syncState);
    return () => {
      window.removeEventListener(EVENT_NAME, syncState);
      window.removeEventListener('storage', syncState);
    };
  }, [syncState]);

  // Next UTC reset countdown
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

    try {
      // Brief simulated delay (will be replaced by smart contract call)
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
      setCheckInSuccess(true);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error('Check-in error:', err);
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
    timeUntilNext,
    performCheckIn
  };
}
