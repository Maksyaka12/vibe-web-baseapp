import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Coins, Lock, ArrowUpRight, ChevronDown, Info, Sparkles, CheckCircle2, XCircle, Clock, Check } from 'lucide-react';
import round1Data from '../data/round_1_proofs.json';
import royalty1Data from '../data/royalty_1_proofs.json';
import royalty2Data from '../data/royalty_2_proofs.json';

function formatClaimCountdown(targetDate) {
  if (!targetDate) return '';
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}D ${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
  }
  return `${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
}

function ActiveClaimCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(() => formatClaimCountdown(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(formatClaimCountdown(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
}

function BaseAppClaimCountdownButton({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!targetDate) return '';
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - now;
    if (diff <= 0) return '00H 00M 00S';
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
  });

  const [isReached, setIsReached] = useState(() => {
    if (!targetDate) return false;
    return new Date().getTime() >= new Date(targetDate).getTime();
  });

  useEffect(() => {
    const updateCountdown = () => {
      if (!targetDate) return;
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setIsReached(true);
        setTimeLeft('00H 00M 00S');
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        const pad = (n) => String(n).padStart(2, '0');
        setTimeLeft(`${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`);
      }
    };
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (isReached) {
    return (
      <Link
        to="/claim"
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textDecoration: 'none',
          background: 'rgba(0, 255, 136, 0.12)',
          border: '1.5px solid #00ff88',
          color: '#00ff88',
          borderRadius: '10px',
          fontFamily: "'Press Start 2P', monospace",
          fontWeight: 900,
          transition: 'all 0.2s',
          boxSizing: 'border-box',
          textShadow: 'none'
        }}
      >
        <span style={{ color: '#00ff88' }}>CLAIM ROYALTIES</span> <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
      </Link>
    );
  }

  return (
    <button
      disabled
      style={{
        width: '100%',
        padding: '12px',
        fontSize: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'rgba(0, 255, 136, 0.12)',
        border: '1.5px solid #00ff88',
        color: '#00ff88',
        borderRadius: '10px',
        fontFamily: "'Press Start 2P', monospace",
        fontWeight: 900,
        boxSizing: 'border-box',
        textShadow: 'none',
        cursor: 'default',
        boxShadow: '0 0 16px rgba(0, 255, 136, 0.2)'
      }}
    >
      <Clock size={13} color="#00ff88" strokeWidth={2.5} />
      <span style={{ color: '#00ff88' }}>CLAIM IN {timeLeft}</span>
    </button>
  );
}

const stripYear = (str) => {
  if (!str) return '';
  return str.replace(/\s\d{4},/, ',');
};

const getEpochStatus = (ep, currentTime = new Date()) => {
  const current = currentTime instanceof Date ? currentTime : new Date(currentTime);
  if (ep.endDateObj && current >= ep.endDateObj) {
    return 'ended';
  }
  if (ep.startDateObj && current >= ep.startDateObj) {
    return 'active';
  }
  return 'upcoming';
};

const getRewardEpochStatus = (ep, currentTime = new Date()) => {
  const current = currentTime instanceof Date ? currentTime : new Date(currentTime);
  if (ep.status === 'ended' || ep.status === 'completed' || (ep.nextSnapshotDate && current >= ep.nextSnapshotDate)) {
    return 'ended';
  }
  const start = ep.snapshotDateObj || ep.dateObj;
  if (start && current >= start) {
    return 'active';
  }
  return 'upcoming';
};

export default function BaseAppRewardsView({
  HOLDER_UNLOCKS,
  VIBECLUB_EPOCHS,
  STAKING_EPOCHS,
  GIVEAWAYS_DATA,
  O1_STAKING_VAULT,
  now
}) {
  const { authenticated, user } = usePrivy();
  const address = user?.wallet?.address;
  const userAddress = address ? address.toLowerCase() : null;

  const [currentTab, setCurrentTab] = useState('holders');
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Cached / live states for balances
  const [userBalance, setUserBalance] = useState(() => {
    if (!userAddress) return 0;
    return Number(localStorage.getItem(`vibe_balance_${userAddress}`) || 0);
  });
  const [userNftCount, setUserNftCount] = useState(() => {
    if (!userAddress) return 0;
    return Number(localStorage.getItem(`vibe_nfts_${userAddress}`) || 0);
  });

  useEffect(() => {
    if (!userAddress) return;
    const cachedBal = Number(localStorage.getItem(`vibe_balance_${userAddress}`) || 0);
    const cachedNfts = Number(localStorage.getItem(`vibe_nfts_${userAddress}`) || 0);
    setUserBalance(cachedBal);
    setUserNftCount(cachedNfts);
  }, [userAddress]);

  // Holder calculations
  const activeHolders = HOLDER_UNLOCKS.filter(u => now >= u.dateObj);
  const featuredHolder = activeHolders[0] || HOLDER_UNLOCKS[0];
  const upcomingHolders = HOLDER_UNLOCKS.filter(u => u.unlock !== featuredHolder.unlock);

  // Dynamic eligibility calculation for featured/active Holder Reward
  // (Checks Merkle proof snapshot for Unlock 1, or 5M+ holding balance for active/subsequent unlocks)
  const isHolderActiveEligible = (() => {
    if (!authenticated || !userAddress) return false;
    const unlockNum = parseInt(featuredHolder?.unlock?.replace(/\D/g, '') || '1', 10);
    if (unlockNum === 1 && round1Data?.claims?.[userAddress]) {
      return true;
    }
    if (userBalance >= 5000000) {
      return true;
    }
    return false;
  })();

  // Vibe Club calculations
  const activeVibeClubs = VIBECLUB_EPOCHS.filter(u => getRewardEpochStatus(u, now) === 'active');
  const endedVibeClubs = VIBECLUB_EPOCHS.filter(u => getRewardEpochStatus(u, now) === 'ended');
  const upcomingVibeClubs = VIBECLUB_EPOCHS.filter(u => getRewardEpochStatus(u, now) === 'upcoming');

  const featuredVibeClub = activeVibeClubs[0] || upcomingVibeClubs[0] || endedVibeClubs[endedVibeClubs.length - 1] || VIBECLUB_EPOCHS[0];
  const featuredVibeClubStatus = getRewardEpochStatus(featuredVibeClub, now);
  const isFeaturedVibeClubClaimLive = featuredVibeClubStatus === 'active' && featuredVibeClub.dateObj && now >= featuredVibeClub.dateObj;

  const otherUpcomingVibeClubs = upcomingVibeClubs.filter(u => u.epoch !== featuredVibeClub.epoch);
  const otherEndedVibeClubs = endedVibeClubs.filter(u => u.epoch !== featuredVibeClub.epoch);

  // Dynamic eligibility calculation for featured/active Vibe Club Royalty
  // (Checks Merkle proof snapshot for Royalty 1/2, or Vibe Club NFT ownership)
  const isVibeClubActiveEligible = (() => {
    if (!authenticated || !userAddress) return false;
    const epochNum = parseInt(featuredVibeClub?.epoch?.replace(/\D/g, '') || '1', 10);
    if (epochNum === 1 && royalty1Data?.claims?.[userAddress]) {
      return true;
    }
    if (epochNum === 2 && royalty2Data?.claims?.[userAddress]) {
      return true;
    }
    if (userNftCount > 0) {
      return true;
    }
    return false;
  })();

  // Dynamic Staking calculations based on timestamps
  const activeStakings = STAKING_EPOCHS.filter(e => getEpochStatus(e, now) === 'active');
  const endedStakings = STAKING_EPOCHS.filter(e => getEpochStatus(e, now) === 'ended');
  const upcomingStakings = STAKING_EPOCHS.filter(e => getEpochStatus(e, now) === 'upcoming');

  const featuredStaking = activeStakings[0] || upcomingStakings[0] || endedStakings[endedStakings.length - 1] || STAKING_EPOCHS[0];
  const featuredStakingStatus = getEpochStatus(featuredStaking, now);

  const otherUpcomingStakings = upcomingStakings.filter(e => e.epoch !== featuredStaking.epoch);
  const otherEndedStakings = endedStakings.filter(e => e.epoch !== featuredStaking.epoch);

  // Giveaways calculations (All active ongoing vs Past ended)
  const activeGiveaways = GIVEAWAYS_DATA.filter(e => e.status === 'ongoing');
  const pastGiveaways = GIVEAWAYS_DATA.filter(e => e.status === 'ended');

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. MODERN REWARDS HERO HEADER (CENTERED & LARGER) ── */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '22px',
          padding: '12px 8px 8px 8px'
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            margin: '0 0 12px 0',
            letterSpacing: '0.6px',
            color: '#ffffff',
            fontFamily: "'Press Start 2P', monospace",
            textShadow: 'none',
            textAlign: 'center',
            width: '100%',
            lineHeight: 1.3
          }}
        >
          REWARDS <span style={{ color: '#00f5ff' }}>HUB</span>
        </h2>

        {/* Subtitle Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(0, 245, 255, 0.08)',
            border: '1.5px solid rgba(0, 245, 255, 0.35)',
            borderRadius: '99px',
            padding: '7px 16px',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', flexShrink: 0 }} />
          <span style={{ fontSize: '6.5px', color: '#00f5ff', letterSpacing: '0.5px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
            TRACK ACTIVE REWARDS. JOIN &amp; EARN
          </span>
        </div>
      </div>

      {/* ── 2. PREMIUM CYBERPUNK / WEB3 CATEGORY SWITCHER (TURQUOISE OUTLINES) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '6px',
          background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
          border: '1.5px solid rgba(0, 245, 255, 0.25)',
          borderRadius: '16px',
          padding: '6px',
          marginBottom: '22px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {[
          { id: 'holders', label: 'Holders', icon: '💎', count: `${activeHolders.length} LIVE` },
          { id: 'vibe-club', label: 'Vibe Club', icon: '👑', count: `${activeVibeClubs.length} LIVE` },
          { id: 'staking', label: 'Staking', icon: '💰', count: `${activeStakings.length} LIVE` },
          { id: 'giveaways', label: 'Giveaways', icon: '🎁', count: `${activeGiveaways.length} EVENTS` }
        ].map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCurrentTab(tab.id);
                setActiveTooltip(null);
              }}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #0052ff 0%, #0036b3 100%)'
                  : 'rgba(255, 255, 255, 0.02)',
                color: isActive ? '#ffffff' : '#88aacc',
                border: isActive
                  ? '1.5px solid #00f5ff'
                  : '1.5px solid rgba(0, 245, 255, 0.45)',
                borderRadius: '12px',
                padding: '10px 2px',
                minHeight: '74px',
                fontSize: '6.5px',
                fontFamily: "'Press Start 2P', monospace",
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: isActive
                  ? '0 4px 16px rgba(0, 82, 255, 0.45), 0 0 10px rgba(0, 245, 255, 0.35)'
                  : 'none',
                transition: 'all 0.18s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ fontSize: '13px', filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' : 'grayscale(0.2)' }}>
                {tab.icon}
              </span>
              <span style={{ whiteSpace: 'nowrap', color: isActive ? '#ffffff' : '#e2e8f0', fontWeight: 900 }}>
                {tab.label}
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '5px',
                    color: '#00ff88',
                    letterSpacing: '0.2px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 3. CATEGORY VIEW: 💎 HOLDER REWARDS ── */}
      {currentTab === 'holders' && (
        <div>
          {/* Smart Rule Strip */}
          <div
            style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1.5px solid #ffd700',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: '6.5px', color: '#ffd700', lineHeight: 1.5, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                Hold 5M+ $VIBE at snapshot time to share the prize pool.
              </span>
            </div>
            <a
              href="/tokenomics#vesting-details"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '6.5px',
                color: '#ffd700',
                border: '1px solid #ffd700',
                padding: '4px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                flexShrink: 0,
                background: 'rgba(255, 215, 0, 0.15)',
                fontFamily: "'Press Start 2P', monospace",
                textShadow: 'none'
              }}
            >
              Rules ↗
            </a>
          </div>

          {/* Featured Spotlight Active Card */}
          {featuredHolder && (
            <div
              style={{
                background: 'rgba(4, 20, 48, 0.94)',
                border: '2px solid #00ff88',
                borderRadius: '18px',
                padding: '18px 16px',
                marginBottom: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/new-logo-vibe.png" alt="VIBE" style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #00ff88' }} />
                  <div>
                    <div style={{ fontSize: '9px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{featuredHolder.unlock}</div>
                    <div style={{ fontSize: '6.5px', color: '#00ff88', marginTop: '3px', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>CLAIM IS LIVE</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', padding: '4px 8px', borderRadius: '8px', fontSize: '6.5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
                  <ActiveClaimCountdown targetDate={featuredHolder.nextSnapshotDate} />
                </div>
              </div>

              {/* Rewards Pool highlight (Clean Turquoise, No Neon Blur) */}
              <div style={{ background: 'rgba(2, 11, 26, 0.85)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>REWARDS POOL</div>
                <div style={{ fontSize: '13px', color: '#00f5ff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  {featuredHolder.poolAmount} <span style={{ fontSize: '8px', color: '#00f5ff' }}>$VIBE</span>
                </div>
              </div>

              {/* Two info pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '6px', color: '#88aacc', marginBottom: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>REQUIREMENT</div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", whiteSpace: 'nowrap', textShadow: 'none' }}>Holder 5M+ $VIBE</div>
                </div>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <CheckCircle2 size={9} color="#00ff88" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", textShadow: 'none', fontWeight: 800 }}>SNAPSHOT COMPLETED</span>
                  </div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{stripYear(featuredHolder.snapshotTime)}</div>
                </div>
              </div>

              {/* Direct Claim Action Button (Explicit Green text & border) */}
              <Link
                to="/claim"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  background: 'rgba(0, 255, 136, 0.12)',
                  border: '1.5px solid #00ff88',
                  color: '#00ff88',
                  borderRadius: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: 900,
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  textShadow: 'none'
                }}
              >
                <span style={{ color: '#00ff88' }}>CLAIM REWARD</span> <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
              </Link>

              {/* Dynamic Eligibility Indicator Under Claim Button */}
              {authenticated ? (
                isHolderActiveEligible ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                    <CheckCircle2 size={13} color="#00ff88" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '7px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                      You are eligible
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', textAlign: 'center' }}>
                    <XCircle size={13} color="#ff4466" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '6px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, lineHeight: 1.4 }}>
                      Unfortunately, you are not eligible for this unlock distribution! You didn't hold 5M+ $VIBE at snapshot
                    </span>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                  <Info size={11} color="#88aacc" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                    Connect wallet to check eligibility
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Schedule Timeline List */}
          <div style={{ background: 'rgba(4, 20, 48, 0.88)', border: '1.5px solid rgba(0, 245, 255, 0.25)', borderRadius: '16px', padding: '16px 14px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>UNLOCK SCHEDULE</div>
              <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{upcomingHolders.length} ROUNDS</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingHolders.map(u => {
                const isTooltipOpen = activeTooltip === u.unlock;
                return (
                  <div key={u.unlock} style={{ position: 'relative' }}>
                    <div
                      style={{
                        background: 'rgba(2, 11, 26, 0.75)',
                        border: isTooltipOpen ? '1px solid #ffd700' : '1px solid rgba(0, 245, 255, 0.15)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '7.5px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.unlock}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTooltip(isTooltipOpen ? null : u.unlock);
                            }}
                            onMouseEnter={() => setActiveTooltip(u.unlock)}
                            onMouseLeave={() => setActiveTooltip(null)}
                            style={{
                              background: isTooltipOpen ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 245, 255, 0.15)',
                              border: isTooltipOpen ? '1px solid #ffd700' : '1px solid rgba(0, 245, 255, 0.4)',
                              color: isTooltipOpen ? '#ffd700' : '#00f5ff',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              flexShrink: 0
                            }}
                          >
                            <Info size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                        <div style={{ fontSize: '6.5px', color: '#ffd700', marginTop: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                          {stripYear(u.unlockDate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', color: '#00f5ff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.poolAmount} $VIBE</div>
                        <div style={{ fontSize: '6px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                          <Lock size={9} /> LOCKED
                        </div>
                      </div>
                    </div>

                    {/* Snapshot Info Tooltip Dropdown */}
                    {isTooltipOpen && (
                      <div
                        style={{
                          marginTop: '4px',
                          background: 'rgba(0, 20, 40, 0.98)',
                          border: '1.5px solid #ffd700',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
                          fontFamily: "'Press Start 2P', monospace"
                        }}
                      >
                        <div style={{ fontSize: '6.5px', color: '#ffd700', fontWeight: 800, marginBottom: '3px', textShadow: 'none' }}>
                          📸 Snapshot: {stripYear(u.snapshotTime)}
                        </div>
                        <div style={{ fontSize: '6px', color: '#cbd5e1', lineHeight: 1.5, textShadow: 'none' }}>
                          Hold 5M+ $VIBE at snapshot time to be eligible.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. CATEGORY VIEW: 👑 VIBE CLUB ── */}
      {currentTab === 'vibe-club' && (
        <div>
          {/* Smart Rule Strip (Updated copy: TO SHARE ROYALTY POOL) */}
          <div
            style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1.5px solid #ffd700',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: '6.5px', color: '#ffd700', lineHeight: 1.5, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                Hold Vibe Club NFT at snapshot time to share royalty pool.
              </span>
            </div>
            <Link
              to="/vibeclub"
              style={{
                fontSize: '6.5px',
                color: '#ffd700',
                border: '1px solid #ffd700',
                padding: '4px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                flexShrink: 0,
                background: 'rgba(255, 215, 0, 0.15)',
                fontFamily: "'Press Start 2P', monospace",
                textShadow: 'none'
              }}
            >
              Mint NFT ↗
            </Link>
          </div>

          {/* Featured Active Royalty Card */}
          {featuredVibeClub && (
            <div
              style={{
                background: 'rgba(4, 20, 48, 0.94)',
                border: '2px solid #00ff88',
                borderRadius: '18px',
                padding: '18px 16px',
                marginBottom: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/new-logo-vibe.png" alt="VIBE" style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #00ff88' }} />
                  <div>
                    <div style={{ fontSize: '9px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{featuredVibeClub.epoch}</div>
                    <div style={{ fontSize: '6.5px', color: (isFeaturedVibeClubClaimLive || featuredVibeClubStatus === 'active') ? '#00ff88' : featuredVibeClubStatus === 'ended' ? '#00f5ff' : '#ffd700', marginTop: '3px', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                      {isFeaturedVibeClubClaimLive ? 'CLAIM IS LIVE' : featuredVibeClubStatus === 'active' ? 'ACTIVE' : featuredVibeClubStatus === 'ended' ? 'ENDED' : 'UPCOMING'}
                    </div>
                  </div>
                </div>
                <div style={{ background: (isFeaturedVibeClubClaimLive || featuredVibeClubStatus === 'active') ? 'rgba(0, 255, 136, 0.15)' : featuredVibeClubStatus === 'ended' ? 'rgba(0, 245, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)', border: (isFeaturedVibeClubClaimLive || featuredVibeClubStatus === 'active') ? '1px solid #00ff88' : featuredVibeClubStatus === 'ended' ? '1px solid #00f5ff' : '1px solid rgba(255, 255, 255, 0.2)', color: (isFeaturedVibeClubClaimLive || featuredVibeClubStatus === 'active') ? '#00ff88' : featuredVibeClubStatus === 'ended' ? '#00f5ff' : '#94a3b8', padding: '4px 8px', borderRadius: '8px', fontSize: '6.5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  {(isFeaturedVibeClubClaimLive || featuredVibeClubStatus === 'active') && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />}
                  {isFeaturedVibeClubClaimLive ? (
                    <ActiveClaimCountdown targetDate={featuredVibeClub.nextSnapshotDate} />
                  ) : featuredVibeClubStatus === 'active' ? (
                    'ACTIVE'
                  ) : featuredVibeClubStatus === 'ended' ? (
                    'ENDED'
                  ) : (
                    'UPCOMING'
                  )}
                </div>
              </div>

              {/* Royalty Pool highlight */}
              <div style={{ background: 'rgba(2, 11, 26, 0.85)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>ROYALTY POOL</div>
                <div style={{ fontSize: '11px', color: '#00f5ff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  {featuredVibeClub.poolAmount}
                </div>
              </div>

              {/* Two info pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '6px', color: '#88aacc', marginBottom: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>REQUIREMENT</div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", whiteSpace: 'nowrap', textShadow: 'none' }}>Vibe Club NFT Holder</div>
                </div>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px', overflow: 'hidden' }}>
                    <CheckCircle2 size={8} color="#00ff88" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '4.8px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", textShadow: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}>SNAPSHOT COMPLETED</span>
                  </div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{stripYear(featuredVibeClub.snapshotTime)}</div>
                </div>
              </div>

              {/* Direct Claim / Pre-claim Countdown / Disabled Action Button */}
              {isFeaturedVibeClubClaimLive ? (
                <Link
                  to="/claim"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    background: 'rgba(0, 255, 136, 0.12)',
                    border: '1.5px solid #00ff88',
                    color: '#00ff88',
                    borderRadius: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900,
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    textShadow: 'none'
                  }}
                >
                  <span style={{ color: '#00ff88' }}>CLAIM ROYALTIES</span> <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
                </Link>
              ) : featuredVibeClubStatus === 'active' ? (
                <BaseAppClaimCountdownButton targetDate={featuredVibeClub.dateObj} />
              ) : featuredVibeClubStatus === 'ended' ? (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900
                  }}
                >
                  CLAIM ENDED
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900
                  }}
                >
                  LOCKED
                </button>
              )}

              {/* Dynamic Eligibility Indicator Under Claim Button */}
              {authenticated ? (
                isVibeClubActiveEligible ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                    <CheckCircle2 size={13} color="#00ff88" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '7px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                      You are eligible
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', textAlign: 'center' }}>
                    <XCircle size={13} color="#ff4466" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '6px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, lineHeight: 1.4 }}>
                      Unfortunately, you are not eligible for this royalty payout! You didn't hold a Vibe Club NFT at snapshot
                    </span>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                  <Info size={11} color="#88aacc" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                    Connect wallet to check eligibility
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Royalty Schedule (Header: EVERY 10 DAYS + 11th Extra Card) */}
          <div style={{ background: 'rgba(4, 20, 48, 0.88)', border: '1.5px solid rgba(0, 245, 255, 0.25)', borderRadius: '16px', padding: '16px 14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>MORE ROYALTY PAYOUTS</div>
              <div style={{ fontSize: '6.5px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", textShadow: 'none', fontWeight: 800 }}>EVERY 10 DAYS</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {otherUpcomingVibeClubs.map((u, i) => {
                const roundKey = u.epoch || `vibe-epoch-${i}`;
                const isTooltipOpen = activeTooltip === roundKey;
                return (
                  <div key={roundKey} style={{ position: 'relative' }}>
                    <div
                      style={{
                        background: 'rgba(2, 11, 26, 0.75)',
                        border: isTooltipOpen ? '1px solid #ffd700' : '1px solid rgba(0, 245, 255, 0.15)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '7.5px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.epoch}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTooltip(isTooltipOpen ? null : roundKey);
                            }}
                            onMouseEnter={() => setActiveTooltip(roundKey)}
                            onMouseLeave={() => setActiveTooltip(null)}
                            style={{
                              background: isTooltipOpen ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 245, 255, 0.15)',
                              border: isTooltipOpen ? '1px solid #ffd700' : '1px solid rgba(0, 245, 255, 0.4)',
                              color: isTooltipOpen ? '#ffd700' : '#00f5ff',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              flexShrink: 0
                            }}
                          >
                            <Info size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                        <div style={{ fontSize: '6.5px', color: '#ffd700', marginTop: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                          {stripYear(u.claimDate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.poolAmount}</div>
                        <div style={{ fontSize: '6px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                          <Lock size={9} /> LOCKED
                        </div>
                      </div>
                    </div>

                    {/* Snapshot Info Tooltip */}
                    {isTooltipOpen && (
                      <div
                        style={{
                          marginTop: '4px',
                          background: 'rgba(0, 20, 40, 0.98)',
                          border: '1.5px solid #ffd700',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
                          fontFamily: "'Press Start 2P', monospace"
                        }}
                      >
                        <div style={{ fontSize: '6.5px', color: '#ffd700', fontWeight: 800, marginBottom: '3px', textShadow: 'none' }}>
                          📸 Snapshot: {stripYear(u.snapshotTime || 'Snapshot Date')}
                        </div>
                        <div style={{ fontSize: '6px', color: '#cbd5e1', lineHeight: 1.5, textShadow: 'none' }}>
                          Hold Vibe Club NFT at snapshot time to be eligible.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Extra Card: More Royalty Epochs Notice */}
              <div
                style={{
                  background: 'rgba(2, 11, 26, 0.75)',
                  border: '1px dashed rgba(255, 215, 0, 0.45)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '6.5px', color: '#ffd700', lineHeight: 1.6, fontFamily: "'Press Start 2P', monospace", textShadow: 'none', display: 'block' }}>
                  More royalty epochs will be added every 10 days
                </span>
              </div>
            </div>
          </div>

          {/* Previous Royalty Payouts */}
          {otherEndedVibeClubs.length > 0 && (
            <div style={{ background: 'rgba(4, 20, 48, 0.88)', border: '1.5px solid rgba(0, 245, 255, 0.25)', borderRadius: '16px', padding: '16px 14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>PREVIOUS ROYALTY PAYOUTS</div>
                <div style={{ fontSize: '6.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", textShadow: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={10} color="#00ff88" strokeWidth={3} />
                  <span>COMPLETED</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {otherEndedVibeClubs.map((u, i) => (
                  <div
                    key={u.epoch || i}
                    style={{
                      background: 'rgba(2, 11, 26, 0.75)',
                      border: '1px solid rgba(0, 245, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '7.5px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.epoch}</div>
                      <div style={{ fontSize: '6.5px', color: '#88aacc', marginTop: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                        ENDED: 7 Sep, 00:00 UTC
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none', whiteSpace: 'nowrap' }}>
                        {u.poolAmount && u.poolAmount.includes('$VIBE') ? u.poolAmount : (u.poolAmount !== 'TBA' ? `${u.poolAmount} $VIBE` : u.poolAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. CATEGORY VIEW: ⚡ STAKING ── */}
      {currentTab === 'staking' && (
        <div>
          {/* Smart Rule Strip */}
          <div
            style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1.5px solid #ffd700',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: '6.5px', color: '#ffd700', lineHeight: 1.5, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                Stake $VIBE in active vault on o1 exchange to earn passive yield.
              </span>
            </div>
            <a
              href={O1_STAKING_VAULT}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '6.5px',
                color: '#ffd700',
                border: '1px solid #ffd700',
                padding: '4px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                flexShrink: 0,
                background: 'rgba(255, 215, 0, 0.15)',
                fontFamily: "'Press Start 2P', monospace",
                textShadow: 'none'
              }}
            >
              Vault ↗
            </a>
          </div>

          {/* Featured Staking Spotlight Card (Dynamic: Active / Ended / Upcoming) */}
          {featuredStaking && (
            <div
              style={{
                background: 'rgba(4, 20, 48, 0.94)',
                border: featuredStakingStatus === 'active' ? '2px solid #00ff88' : featuredStakingStatus === 'ended' ? '2px solid #00f5ff' : '2px solid rgba(0, 245, 255, 0.4)',
                borderRadius: '18px',
                padding: '18px 16px',
                marginBottom: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/new-logo-vibe.png" alt="VIBE" style={{ width: '34px', height: '34px', borderRadius: '50%', border: featuredStakingStatus === 'active' ? '2px solid #00ff88' : '2px solid #00f5ff' }} />
                  <div>
                    <div style={{ fontSize: '9px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{featuredStaking.epoch}</div>
                    <div style={{ fontSize: '6.5px', color: featuredStakingStatus === 'active' ? '#00ff88' : featuredStakingStatus === 'ended' ? '#00f5ff' : '#ffd700', marginTop: '3px', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                      {featuredStakingStatus === 'active' ? 'STAKING IS LIVE' : featuredStakingStatus === 'ended' ? 'EPOCH ENDED' : 'STARTING SOON'}
                    </div>
                  </div>
                </div>
                <div style={{ background: featuredStakingStatus === 'active' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 245, 255, 0.15)', border: featuredStakingStatus === 'active' ? '1px solid #00ff88' : '1px solid #00f5ff', color: featuredStakingStatus === 'active' ? '#00ff88' : '#00f5ff', padding: '4px 8px', borderRadius: '8px', fontSize: '6.5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  {featuredStakingStatus === 'active' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />}
                  {featuredStakingStatus === 'active' ? 'ACTIVE VAULT' : featuredStakingStatus === 'ended' ? 'ENDED' : 'UPCOMING'}
                </div>
              </div>

              {/* Pool highlight */}
              <div style={{ background: 'rgba(2, 11, 26, 0.85)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>REWARDS POOL</div>
                <div style={{ fontSize: '13px', color: '#00f5ff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  {featuredStaking.poolAmount} {featuredStaking.poolAmount !== 'TBA' && <span style={{ fontSize: '8px', color: '#00f5ff' }}>$VIBE</span>}
                </div>
              </div>

              {/* Two info pills without Year (only Date and Time) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '6px', color: '#88aacc', marginBottom: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>START</div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{stripYear(featuredStaking.startTime)}</div>
                </div>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '6px', color: '#88aacc', marginBottom: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>END</div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{stripYear(featuredStaking.endTime)}</div>
                </div>
              </div>

              {/* Direct Action Button (Explicit Green text & border) */}
              {featuredStakingStatus === 'active' ? (
                <a
                  href={featuredStaking.link || O1_STAKING_VAULT}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    background: 'rgba(0, 255, 136, 0.12)',
                    border: '1.5px solid #00ff88',
                    color: '#00ff88',
                    borderRadius: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900,
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    textShadow: 'none'
                  }}
                >
                  <span style={{ color: '#00ff88' }}>STAKE &amp; EARN</span> <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
                </a>
              ) : featuredStakingStatus === 'ended' ? (
                <a
                  href={featuredStaking.link || O1_STAKING_VAULT}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '7.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    background: 'rgba(0, 245, 255, 0.12)',
                    border: '1.5px solid #00f5ff',
                    color: '#00f5ff',
                    borderRadius: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900,
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    textShadow: 'none'
                  }}
                >
                  <span style={{ color: '#00f5ff' }}>WITHDRAW &amp; CLAIM YIELD</span> <ArrowUpRight size={14} color="#00f5ff" strokeWidth={2.5} />
                </a>
              ) : (
                <div
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900
                  }}
                >
                  COMING SOON
                </div>
              )}
            </div>
          )}

          {/* Staking Upcoming Epochs List */}
          <div style={{ background: 'rgba(4, 20, 48, 0.88)', border: '1.5px solid rgba(0, 245, 255, 0.25)', borderRadius: '16px', padding: '16px 14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>MORE STAKING EPOCHS</div>
              <div style={{ fontSize: '6.5px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", textShadow: 'none', fontWeight: 800 }}>EVERY 10 DAYS</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {otherUpcomingStakings.map((u, i) => (
                <div
                  key={u.epoch || i}
                  style={{
                    background: 'rgba(2, 11, 26, 0.75)',
                    border: '1px solid rgba(0, 245, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '7.5px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.epoch}</div>
                    <div style={{ fontSize: '6.5px', color: '#ffd700', marginTop: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                      {stripYear(u.startTime)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '8px', color: '#00f5ff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                      {u.poolAmount} {u.poolAmount !== 'TBA' && '$VIBE'}
                    </div>
                    <div style={{ fontSize: '6px', color: '#64748b', marginTop: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>UPCOMING</div>
                  </div>
                </div>
              ))}

              {/* More Staking Vaults Notice */}
              <div
                style={{
                  background: 'rgba(2, 11, 26, 0.75)',
                  border: '1px dashed rgba(255, 215, 0, 0.45)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '6.5px', color: '#ffd700', lineHeight: 1.6, fontFamily: "'Press Start 2P', monospace", textShadow: 'none', display: 'block' }}>
                  More staking vaults will be added every 10 days
                </span>
              </div>
            </div>
          </div>

          {/* Staking Previous Epochs List */}
          {otherEndedStakings.length > 0 && (
            <div style={{ background: 'rgba(4, 20, 48, 0.88)', border: '1.5px solid rgba(0, 245, 255, 0.25)', borderRadius: '16px', padding: '16px 14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>PREVIOUS STAKING EPOCHS</div>
                <div style={{ fontSize: '6.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", textShadow: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={10} color="#00ff88" strokeWidth={3} />
                  <span>COMPLETED</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {otherEndedStakings.map((u, i) => (
                  <div
                    key={u.epoch || i}
                    style={{
                      background: 'rgba(2, 11, 26, 0.75)',
                      border: '1px solid rgba(0, 245, 255, 0.3)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '7.5px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.epoch}</div>
                      <div style={{ fontSize: '6.5px', color: '#88aacc', marginTop: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                        ENDED: {stripYear(u.endTime)}
                      </div>
                    </div>
                    <div>
                      <a
                        href={u.link || O1_STAKING_VAULT}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '6.5px',
                          color: '#00f5ff',
                          border: '1px solid #00f5ff',
                          background: 'rgba(0, 245, 255, 0.15)',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: "'Press Start 2P', monospace",
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ color: '#00f5ff' }}>Withdraw &amp; Claim</span> <ArrowUpRight size={10} color="#00f5ff" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. CATEGORY VIEW: 🎁 GIVEAWAYS (ALL ACTIVE CARDS STACKED) ── */}
      {currentTab === 'giveaways' && (
        <div>
          {/* Smart Rule Strip */}
          <div
            style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1.5px solid #ffd700',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
            <span style={{ fontSize: '6.5px', color: '#ffd700', lineHeight: 1.5, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
              Community giveaways distributed directly to eligible winners.
            </span>
          </div>

          {/* All Active Ongoing Giveaways as Full Rich Cards */}
          {activeGiveaways.map((g) => (
            <div
              key={g.id}
              style={{
                background: 'rgba(4, 20, 48, 0.94)',
                border: '2px solid #00ff88',
                borderRadius: '18px',
                padding: '18px 16px',
                marginBottom: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="/new-logo-vibe.png"
                    alt="VIBE"
                    style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #00ff88', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '9px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                      {g.title}
                    </div>
                    <div style={{ fontSize: '6.5px', color: '#00ff88', marginTop: '3px', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                      EVENT IS LIVE
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', padding: '4px 8px', borderRadius: '8px', fontSize: '6.5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                  ONGOING
                </div>
              </div>

              {/* Prize Pool highlight */}
              <div style={{ background: 'rgba(2, 11, 26, 0.85)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '4px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>PRIZE POOL</div>
                <div style={{ fontSize: '13px', color: '#00f5ff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                  {g.prizePool}
                </div>
              </div>

              {/* Two info pills: Distribution & Deadline / Winners */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '6px', color: '#88aacc', marginBottom: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>DISTRIBUTION</div>
                  <div style={{ fontSize: '7px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                    {g.distribution || 'Not Started'}
                  </div>
                </div>
                <div style={{ background: 'rgba(2, 11, 26, 0.75)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '6px', color: '#88aacc', marginBottom: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                    {g.deadlineDate ? 'DEADLINE' : 'WINNERS'}
                  </div>
                  <div style={{ fontSize: '7px', color: g.deadlineDate ? '#00ff88' : '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                    {g.deadlineDate ? <ActiveClaimCountdown targetDate={g.deadlineDate} /> : (g.winners || 'TBA')}
                  </div>
                </div>
              </div>

              {/* Direct Join Action Button (Links to Tweet) */}
              <a
                href={g.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  background: 'rgba(0, 255, 136, 0.12)',
                  border: '1.5px solid #00ff88',
                  color: '#00ff88',
                  borderRadius: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: 900,
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  textShadow: 'none'
                }}
              >
                <span style={{ color: '#00ff88' }}>JOIN GIVEAWAY</span> <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
              </a>
            </div>
          ))}

          {/* Past Giveaways (7 NFTs Vibe Club & Base App Welcome Bonus with 350 Winners & View Button) */}
          {pastGiveaways.length > 0 && (
            <div style={{ background: 'rgba(4, 20, 48, 0.88)', border: '1.5px solid rgba(0, 245, 255, 0.25)', borderRadius: '16px', padding: '16px 14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>PAST GIVEAWAYS</div>
                <div style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{pastGiveaways.length} EVENTS</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pastGiveaways.map((u, i) => (
                  <div
                    key={u.id || i}
                    style={{
                      background: 'rgba(2, 11, 26, 0.75)',
                      border: '1px solid rgba(0, 245, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '7.5px', color: '#ffffff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.title}</div>
                      <div style={{ fontSize: '6.5px', color: '#88aacc', marginTop: '3px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.winners}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 800, fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>{u.prizePool}</div>
                        <div style={{ fontSize: '6px', color: '#64748b', marginTop: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>ENDED</div>
                      </div>
                      <a
                        href={u.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '6.5px',
                          color: '#00f5ff',
                          border: '1px solid #00f5ff',
                          background: 'rgba(0, 245, 255, 0.15)',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: "'Press Start 2P', monospace",
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ color: '#00f5ff' }}>View</span> <ArrowUpRight size={10} color="#00f5ff" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 7. FAQ ACCORDION (COMPACT) ── */}
      <div style={{ marginTop: '20px', marginBottom: '40px' }}>
        <div style={{ fontSize: '8.5px', color: '#ffffff', fontWeight: 900, textAlign: 'center', marginBottom: '12px', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
          RULES &amp; FAQ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            {
              question: 'How to claim rewards?',
              answer: 'Claim active Holder & Vibe Club rewards directly via the Claim button at snapshot dates.'
            },
            {
              question: 'How does staking yield work?',
              answer: 'Stake $VIBE into open epochs on the o1 vault to earn rewards automatically.'
            },
            {
              question: 'What happens to unclaimed tokens?',
              answer: 'Unclaimed rewards after the claim deadline are permanently burned.'
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(4, 20, 48, 0.88)',
                  border: '1px solid rgba(0, 245, 255, 0.25)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7px',
                    color: '#ffffff',
                    textShadow: 'none'
                  }}
                >
                  <span style={{ color: '#ffffff' }}>{faq.question}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      color: '#00f5ff',
                      flexShrink: 0
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 14px 12px 14px', fontSize: '6.5px', color: '#cbd5e1', lineHeight: 1.6, borderTop: '1px solid rgba(0, 245, 255, 0.15)', fontFamily: "'Press Start 2P', monospace", textShadow: 'none' }}>
                    <div style={{ paddingTop: '8px' }}>{faq.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
