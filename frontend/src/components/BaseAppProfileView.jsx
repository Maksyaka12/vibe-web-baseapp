import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, Gift, Clock, Coins, ArrowRight, Lock, Sparkles, Flame } from 'lucide-react';
import { formatUnits } from 'viem';
import { getPublicClient } from '../config/rpc';
import { STAKING_CONTRACT, STAKING_VAULTS_INFO } from '../Checker';
import { useVibeCheckIn } from '../hooks/useVibeCheckIn';

const STREAK_MILESTONES = [
  { day: 1, label: 'START', sub: 'DAY 1' },
  { day: 7, label: 'MILESTONE', sub: 'DAY 7' },
  { day: 14, label: 'MILESTONE', sub: 'DAY 14' },
  { day: 30, label: 'SBT BADGE', sub: 'DAY 30' }
];

function getStreakProgressPercent(streak) {
  if (!streak || streak <= 0) return 0;
  if (streak === 1) return 8;
  if (streak < 7) return 8 + ((streak - 1) / 6) * 25.33;
  if (streak === 7) return 33.33;
  if (streak < 14) return 33.33 + ((streak - 7) / 7) * 33.33;
  if (streak === 14) return 66.66;
  if (streak < 30) return 66.66 + ((streak - 14) / 16) * 33.34;
  return 100;
}

function getNftFontSize(name) {
  if (!name) return '13px';
  const len = name.length;
  if (len <= 10) return '13.5px';
  if (len <= 14) return '12px';
  if (len <= 18) return '10.5px';
  if (len <= 22) return '9px';
  return '8px';
}

export function BaseAppProfileView(props) {
  const {
    address,
    login,
    balance,
    nftCount,
    userNft,
    loading,
    fetchBalances,
    claimedHistory,
    isHolderEligibleLive,
    totalAvailableCount = 0,
    totalAvailableTokens = 0,
    totalExpiredCount = 0,
    totalExpiredTokens = 0
  } = props;

  const [stakingStats, setStakingStats] = useState({ participationByVault: [], loading: false });
  const {
    streak,
    hasCheckedInToday,
    canCheckInToday,
    isCheckingIn,
    timeUntilNext,
    performCheckIn
  } = useVibeCheckIn(address);

  useEffect(() => {
    if (!address) {
      setStakingStats({ participationByVault: [], loading: false });
      return;
    }

    let isMounted = true;
    const fetchStaking = async () => {
      try {
        const client = getPublicClient();
        const uParam = address.toLowerCase().slice(2).padStart(64, '0');
        const results = await Promise.all(
          STAKING_VAULTS_INFO.map(async (v) => {
            try {
              const res = await client.call({
                to: STAKING_CONTRACT,
                data: '0xeb48471e' + v.id.slice(2) + uParam
              });
              if (res.data && res.data.length >= 194) {
                const activeStaked = BigInt('0x' + res.data.slice(2, 66));
                const totalDeposited = BigInt('0x' + res.data.slice(66, 130));
                const lotsCount = BigInt('0x' + res.data.slice(130, 194));
                const hasDeposit = (totalDeposited > 0n || activeStaked > 1n || lotsCount > 0n);
                return { roundId: v.roundId, hasDeposit };
              }
            } catch (e) {}
            return { roundId: v.roundId, hasDeposit: false };
          })
        );

        if (isMounted) {
          setStakingStats({ participationByVault: results, loading: false });
        }
      } catch (err) {
        console.warn('Profile staking stats fetch error:', err);
      }
    };

    fetchStaking();
    return () => { isMounted = false; };
  }, [address]);

  // Exact Staking Rewards: sum of user's claimed rewards from Staking claims
  const stakingClaims = (claimedHistory || []).filter(c => c && (c.type === 'staking' || c.id?.startsWith('staking-')));
  const totalStakingEarned = stakingClaims.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);

  // Epochs participated: count of vaults where user either has on-chain stake or has a claim
  const totalStakingEpochs = STAKING_VAULTS_INFO.filter(v => {
    const hasClaim = stakingClaims.some(c => c && c.roundId === v.roundId);
    const hasDeposit = stakingStats?.participationByVault?.some(p => p && p.roundId === v.roundId && p.hasDeposit);
    return Boolean(hasClaim || hasDeposit);
  }).length;

  // Portal Claimed (ONLY Holder Rewards & Vibe Club Royalties, Staking is counted separately in Tile 4)
  const portalClaims = (claimedHistory || []).filter(c => c && c.type !== 'staking' && !c.id?.startsWith('staking-'));
  const totalClaimedCount = portalClaims.length;
  const totalClaimedTokens = portalClaims.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  const hasNft = Boolean(nftCount && nftCount > 0);
  const nftDisplayName = hasNft ? (userNft?.name || `Vibe Club #${userNft?.id || 1}`) : 'Unknown Dog';

  // Dynamic achievement unlock calculations
  const isHolderUnlocked = Boolean(isHolderEligibleLive || (balance && Number(balance) >= 5000000));
  const isNftHolderUnlocked = Boolean(hasNft && nftCount > 0);
  const isStakerUnlocked = false; // criteria in progress
  const isClaimerUnlocked = false; // criteria in progress
  const isActiveUnlocked = false; // criteria in progress

  const ACHIEVEMENTS_LIST = [
    {
      id: 'holder',
      name: '5M+ HOLDER',
      image: '/achievements/holder.jfif',
      unlocked: isHolderUnlocked
    },
    {
      id: 'nft-holder',
      name: 'VIBE CLUB MEMBER',
      image: '/achievements/nft-holder.jfif',
      unlocked: isNftHolderUnlocked
    },
    {
      id: 'staker',
      name: 'STAKING EXPERT',
      image: '/achievements/staker.jfif',
      unlocked: isStakerUnlocked
    },
    {
      id: 'claimer',
      name: 'RICH DOG',
      image: '/achievements/claimer.jfif',
      unlocked: isClaimerUnlocked
    },
    {
      id: 'active',
      name: 'ACTIVE DOG',
      image: '/achievements/active.jfif',
      unlocked: isActiveUnlocked
    }
  ];

  const unlockedCount = ACHIEVEMENTS_LIST.filter(a => a.unlocked).length;

  const getLinkPath = (path) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
      return `/app${path}`;
    }
    return path;
  };

  return (
    <div className="profile-view-container" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. MODERN PROFILE HERO HEADER ── */}
      <div
        className="rewards-hero-header"
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
          className="rewards-hero-title"
          style={{
            fontSize: '18px',
            margin: '0 0 12px 0',
            letterSpacing: '0.6px',
            color: '#ffffff',
            fontFamily: "'Press Start 2P', monospace",
            textAlign: 'center',
            width: '100%',
            lineHeight: 1.3
          }}
        >
          USER <span style={{ color: '#00f5ff' }}>PROFILE</span>
        </h2>

        {/* Subtitle Status Pill */}
        <div
          className="rewards-hero-pill"
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
          <span className="rewards-hero-pill-text" style={{ fontSize: '6.5px', color: '#00f5ff', letterSpacing: '0.5px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
            BASE DOG IDENTITY &amp; DASHBOARD
          </span>
        </div>
      </div>

      {/* ── 2. USER PROFILE CARD (FULL HEIGHT NFT IMAGE + CLEAN RIGHT INFO) ── */}
      {!address ? (
        <div
          className="profile-user-card profile-connect-card"
          style={{
            background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
            border: '1.5px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '18px',
            padding: '28px 16px',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div
            className="profile-avatar-box"
            style={{
              width: '84px',
              height: '84px',
              margin: '0 auto 16px auto',
              borderRadius: '16px',
              border: '2px solid rgba(0, 245, 255, 0.5)',
              overflow: 'hidden',
              background: '#020b1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 245, 255, 0.35)'
            }}
          >
            <img src="/new-logo-vibe.png" alt="Vibe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="profile-connect-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", marginBottom: '8px', fontWeight: 900 }}>
            CONNECT YOUR WALLET
          </div>
          <p className="profile-connect-desc" style={{ fontSize: '7px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 0 18px 0' }}>
            Connect to view your identity, holding balances and Vibe Club status.
          </p>
          <button
            onClick={login}
            className="profile-connect-btn"
            style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #00b8ff 100%)',
              border: '1.5px solid #00f5ff',
              color: '#020b1a',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '8.5px',
              fontWeight: 900,
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(0, 245, 255, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            CONNECT WALLET ↗
          </button>
        </div>
      ) : (
        <div className="profile-user-card profile-connected-card">
          {/* Main NFT Card Frame (Identical to Vibe Club NFT section) */}
          <div className="profile-nft-card-frame">
            <img
              src={hasNft ? (userNft?.image || '/nft/images/5.png') : '/new-logo-vibe.png'}
              alt={nftDisplayName}
              className="profile-nft-main-img"
              style={{
                filter: hasNft ? 'none' : 'grayscale(1) brightness(0.7)'
              }}
            />

            {/* Top-left floating status badge (Green for Vibe Club Member, Orange for Unknown Dog) */}
            {hasNft ? (
              <div className="profile-nft-member-badge member-green">
                <span className="profile-nft-member-badge-dot member-green-dot" />
                <span>VIBE CLUB MEMBER</span>
              </div>
            ) : (
              <div className="profile-nft-member-badge member-orange">
                <span className="profile-nft-member-badge-dot member-orange-dot" />
                <span>UNKNOWN DOG</span>
              </div>
            )}

            {/* Bottom badge: NFT name if holder, or interactive MINT & JOIN CTA if non-holder */}
            {hasNft ? (
              <div className="profile-nft-name-badge">
                <span>{nftDisplayName.toUpperCase()}</span>
              </div>
            ) : (
              <Link to={getLinkPath('/nft')} className="profile-nft-name-badge profile-nft-mint-cta-badge mint-orange">
                <span>MINT YOUR NFT &amp; JOIN VIBE CLUB</span>
                <ArrowRight size={11} strokeWidth={2.5} className="profile-mint-arrow-icon mint-orange-arrow" />
              </Link>
            )}
          </div>

          {/* Desktop Right Column: Achievements (Replacing previous balance/controls) */}
          <div className="profile-desktop-achievements-panel">
            <div className="profile-card-achievements-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="profile-section-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', flexShrink: 0, display: 'inline-block' }} />
                <h3 className="profile-section-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900, lineHeight: 1 }}>
                  ACHIEVEMENTS
                </h3>
              </div>
              <div className="profile-achievements-tracker" style={{ background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.4)', borderRadius: '8px', padding: '5px 10px', fontSize: '7px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88' }} />
                <span>{unlockedCount}/5 UNLOCKED</span>
              </div>
            </div>

            <div className="profile-card-achievements-grid">
              {ACHIEVEMENTS_LIST.map((ach) => (
                <div
                  key={ach.id}
                  className={`profile-achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="profile-achievement-img-box">
                    <img
                      src={ach.image}
                      alt={ach.name}
                      className="profile-achievement-img"
                    />
                    <div className="profile-achievement-badge">
                      {ach.unlocked ? (
                        <>
                          <span className="profile-achievement-badge-dot" />
                          <span>UNLOCKED</span>
                        </>
                      ) : (
                        <>
                          <Lock size={9} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                          <span>LOCKED</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="profile-achievement-name" title={ach.name}>
                    {ach.name}
                  </div>
                </div>
              ))}

              {/* 6th Slot: More Achievements Coming Soon */}
              <div className="profile-achievement-card profile-achievement-placeholder">
                <div className="profile-placeholder-icon-box">
                  <Sparkles size={20} color="#00f5ff" />
                </div>
                <div className="profile-placeholder-text-box">
                  <div className="profile-placeholder-title">MORE COMING</div>
                  <div className="profile-placeholder-sub">NEW ACHIEVEMENTS SOON</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. DAILY CHECK-IN & STREAK ZONE ── */}
      <div className="profile-checkin-zone" style={{ marginBottom: '24px' }}>
        <div
          className="profile-section-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="profile-section-dot"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ffaa00',
                boxShadow: '0 0 8px #ffaa00',
                flexShrink: 0,
                display: 'inline-block'
              }}
            />
            <h3
              className="profile-section-title"
              style={{
                fontSize: '10px',
                color: '#ffffff',
                fontFamily: "'Press Start 2P', monospace",
                margin: 0,
                fontWeight: 900,
                lineHeight: 1
              }}
            >
              DAILY CHECK-IN
            </h3>
          </div>
          <div
            style={{
              background: 'rgba(255, 170, 0, 0.12)',
              border: '1px solid rgba(255, 170, 0, 0.4)',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '6.5px',
              color: '#ffaa00',
              fontFamily: "'Press Start 2P', monospace",
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Flame size={10} color="#ffaa00" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 170, 0, 0.8))' }} />
            <span>ON-CHAIN STREAK</span>
          </div>
        </div>

        {/* Main Check-In Card */}
        <div
          className="profile-checkin-card"
          style={{
            background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
            border: '1.5px solid rgba(255, 170, 0, 0.35)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 170, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Top Row: Info & Streak Counter + CTA Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            {/* Left: Flame Icon Box + Text Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: '1 1 auto' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 170, 0, 0.1)',
                  border: '1.5px solid rgba(255, 170, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(255, 170, 0, 0.25)',
                  flexShrink: 0
                }}
              >
                <Flame size={22} color="#ffaa00" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 170, 0, 0.8))' }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '8px',
                    color: '#ffaa00',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900,
                    letterSpacing: '0.4px',
                    marginBottom: '4px'
                  }}
                >
                  KEEP YOUR STREAK
                </div>
                <div
                  style={{
                    fontSize: '6px',
                    color: '#88aacc',
                    fontFamily: "'Press Start 2P', monospace",
                    lineHeight: 1.5
                  }}
                >
                  Check in daily to build streak and unlock milestone SBT achievements.
                </div>
              </div>
            </div>

            {/* Right: Current Streak Pill + Action Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                flexShrink: 0
              }}
            >
              {/* Streak Stat Display */}
              <div
                style={{
                  background: 'rgba(4, 14, 36, 0.9)',
                  border: '1.5px solid rgba(255, 170, 0, 0.45)',
                  boxShadow: '0 0 10px rgba(255, 170, 0, 0.2)',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none'
                }}
              >
                <span
                  style={{
                    fontSize: '5px',
                    color: '#88aacc',
                    fontFamily: "'Press Start 2P', monospace",
                    letterSpacing: '0.3px',
                    marginBottom: '3px'
                  }}
                >
                  CURRENT STREAK
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={12} color="#ffaa00" />
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#ffaa00',
                      fontFamily: "'Press Start 2P', monospace",
                      fontWeight: 900,
                      textShadow: '0 0 8px rgba(255, 170, 0, 0.6)'
                    }}
                  >
                    {streak} {streak === 1 ? 'DAY' : 'DAYS'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {!address ? (
                <button
                  onClick={login}
                  style={{
                    background: 'linear-gradient(135deg, #00f5ff 0%, #00b8ff 100%)',
                    border: '1.5px solid #00f5ff',
                    color: '#020b1a',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    fontWeight: 900,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(0, 245, 255, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  CONNECT WALLET
                </button>
              ) : hasCheckedInToday ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(0, 255, 136, 0.12)',
                      border: '1.5px solid rgba(0, 255, 136, 0.45)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#00ff88',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      fontWeight: 900,
                      boxShadow: '0 0 12px rgba(0, 255, 136, 0.25)',
                      userSelect: 'none'
                    }}
                  >
                    <CheckCircle2 size={12} color="#00ff88" />
                    <span>CHECKED IN</span>
                  </div>
                  <span
                    style={{
                      fontSize: '5.5px',
                      color: '#88aacc',
                      fontFamily: "'Press Start 2P', monospace",
                      letterSpacing: '0.2px'
                    }}
                  >
                    NEXT IN: {timeUntilNext}
                  </span>
                </div>
              ) : (
                <button
                  onClick={performCheckIn}
                  disabled={isCheckingIn}
                  style={{
                    background: 'linear-gradient(135deg, #ffaa00 0%, #ff5500 100%)',
                    border: '1.5px solid #ffaa00',
                    color: '#020b1a',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    fontWeight: 900,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    cursor: isCheckingIn ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 16px rgba(255, 170, 0, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    opacity: isCheckingIn ? 0.7 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Flame size={12} color="#020b1a" strokeWidth={2.5} />
                  <span>{isCheckingIn ? 'CHECKING IN...' : 'CHECK IN NOW'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Milestone Progress Rail (1 - 7 - 14 - 30 Days) */}
          <div
            style={{
              background: 'rgba(2, 11, 26, 0.75)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              padding: '14px 12px 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 4px',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <span
                style={{
                  fontSize: '6px',
                  color: '#00f5ff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: 900,
                  letterSpacing: '0.4px'
                }}
              >
                MILESTONE PATH
              </span>
              <span
                style={{
                  fontSize: '5.5px',
                  color: '#88aacc',
                  fontFamily: "'Press Start 2P', monospace"
                }}
              >
                {streak >= 30 ? 'ALL MILESTONES UNLOCKED 🏆' : `NEXT GOAL: DAY ${streak < 1 ? 1 : streak < 7 ? 7 : streak < 14 ? 14 : 30}`}
              </span>
            </div>

            {/* Horizontal Rail */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '0 6px',
                marginTop: '4px'
              }}
            >
              {/* Background Connecting Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '25px',
                  right: '25px',
                  height: '3px',
                  background: 'rgba(0, 245, 255, 0.15)',
                  borderRadius: '2px',
                  zIndex: 1
                }}
              />

              {/* Active Progress Fill Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '25px',
                  width: `calc((100% - 50px) * ${getStreakProgressPercent(streak) / 100})`,
                  height: '3px',
                  background: 'linear-gradient(90deg, #00ff88 0%, #ffaa00 100%)',
                  borderRadius: '2px',
                  zIndex: 2,
                  boxShadow: '0 0 8px rgba(255, 170, 0, 0.6)',
                  transition: 'width 0.4s ease'
                }}
              />

              {/* Milestones Nodes */}
              {STREAK_MILESTONES.map((m) => {
                const isReached = streak >= m.day;
                return (
                  <div
                    key={m.day}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 3,
                      position: 'relative',
                      minWidth: '50px'
                    }}
                  >
                    {/* Circle / Badge */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: isReached ? 'rgba(255, 170, 0, 0.25)' : 'rgba(2, 11, 26, 0.95)',
                        border: isReached ? '1.5px solid #ffaa00' : '1.5px solid rgba(0, 245, 255, 0.25)',
                        boxShadow: isReached ? '0 0 10px rgba(255, 170, 0, 0.4)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isReached ? (
                        m.day === 30 ? (
                          <span style={{ fontSize: '10px' }}>🏆</span>
                        ) : (
                          <Flame size={12} color="#ffaa00" />
                        )
                      ) : (
                        <Lock size={10} color="#88aacc" />
                      )}
                    </div>

                    {/* Day label */}
                    <span
                      style={{
                        fontSize: '6px',
                        color: isReached ? '#ffaa00' : '#88aacc',
                        fontFamily: "'Press Start 2P', monospace",
                        fontWeight: 900,
                        marginBottom: '2px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {m.sub}
                    </span>

                    {/* Milestone title */}
                    <span
                      style={{
                        fontSize: '5px',
                        color: isReached ? '#ffffff' : '#557799',
                        fontFamily: "'Press Start 2P', monospace",
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. ACHIEVEMENTS SECTION (MOBILE ONLY WHEN CONNECTED, OR STANDALONE) ── */}
      <div className={`profile-achievements-zone ${address ? 'profile-achievements-zone-mobile-only' : ''}`} style={{ marginBottom: '24px' }}>
        <div className="profile-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="profile-section-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', flexShrink: 0, display: 'inline-block' }} />
            <h3 className="profile-section-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900, lineHeight: 1 }}>
              ACHIEVEMENTS
            </h3>
          </div>
          <div className="profile-achievements-tracker" style={{ background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.4)', borderRadius: '8px', padding: '5px 10px', fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88' }} />
            <span>{unlockedCount}/5 UNLOCKED</span>
          </div>
        </div>

        <div className="profile-achievements-grid">
          {ACHIEVEMENTS_LIST.map((ach) => (
            <div
              key={ach.id}
              className={`profile-achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="profile-achievement-img-box">
                <img
                  src={ach.image}
                  alt={ach.name}
                  className="profile-achievement-img"
                />
                <div className="profile-achievement-badge">
                  {ach.unlocked ? (
                    <>
                      <span className="profile-achievement-badge-dot" />
                      <span>UNLOCKED</span>
                    </>
                  ) : (
                    <>
                      <Lock size={9} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span>LOCKED</span>
                    </>
                  )}
                </div>
              </div>
              <div className="profile-achievement-name" title={ach.name}>
                {ach.name}
              </div>
            </div>
          ))}

          {/* 6th Slot: More Achievements Coming Soon */}
          <div className="profile-achievement-card profile-achievement-placeholder">
            <div className="profile-placeholder-icon-box">
              <Sparkles size={20} color="#00f5ff" />
            </div>
            <div className="profile-placeholder-text-box">
              <div className="profile-placeholder-title">MORE COMING</div>
              <div className="profile-placeholder-sub">NEW ACHIEVEMENTS SOON</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. REWARD DASHBOARD ZONE ── */}
      <div className="profile-dashboard-zone" style={{ marginBottom: '24px' }}>
        <div className="profile-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="profile-section-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', flexShrink: 0, display: 'inline-block' }} />
          <h3 className="profile-section-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900, lineHeight: 1 }}>
            REWARD DASHBOARD
          </h3>
        </div>

        <div className="profile-stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Tile 1: Total Claimed (Green) */}
          <div
            className="profile-stat-card"
            style={{
              background: 'rgba(4, 20, 48, 0.9)',
              border: '1px solid rgba(0, 255, 136, 0.35)',
              borderRadius: '14px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="profile-stat-label" style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                TOTAL CLAIMED
              </span>
              <CheckCircle2 size={13} color="#00ff88" className="profile-stat-icon" />
            </div>
            <div>
              <div className="profile-stat-val" style={{ fontSize: '9px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px', textShadow: '0 0 8px rgba(0, 255, 136, 0.3)' }}>
                +{totalClaimedTokens > 0 ? Math.round(totalClaimedTokens).toLocaleString('en-US') : '0'} $VIBE
              </div>
              <div className="profile-stat-sub" style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalClaimedCount} {totalClaimedCount === 1 ? 'CLAIM' : 'CLAIMS'} COMPLETED
              </div>
            </div>
          </div>

          {/* Tile 2: Staking Rewards (Signature Staking Purple) */}
          <div
            className="profile-stat-card"
            style={{
              background: 'rgba(4, 20, 48, 0.9)',
              border: totalStakingEarned > 0 ? '1.5px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '14px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              boxShadow: totalStakingEarned > 0 ? '0 0 16px rgba(168, 85, 247, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="profile-stat-label" style={{ fontSize: '6px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                STAKING REWARDS
              </span>
              <Coins size={13} color="#c084fc" className="profile-stat-icon" />
            </div>
            <div>
              <div className="profile-stat-val" style={{ fontSize: '9px', color: '#c084fc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px', textShadow: '0 0 8px rgba(168, 85, 247, 0.35)' }}>
                +{totalStakingEarned > 0 ? Math.round(totalStakingEarned).toLocaleString('en-US') : '0'} $VIBE
              </div>
              <div className="profile-stat-sub" style={{ fontSize: '5.5px', color: totalStakingEpochs > 0 ? '#d8b4fe' : '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalStakingEpochs} {totalStakingEpochs === 1 ? 'EPOCH' : 'EPOCHS'} PARTICIPATED
              </div>
            </div>
          </div>

          {/* Tile 3: Available to Claim (Cyan) */}
          <div
            className="profile-stat-card"
            style={{
              background: 'rgba(4, 20, 48, 0.9)',
              border: totalAvailableCount > 0 ? '1.5px solid #00f5ff' : '1px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '14px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              boxShadow: totalAvailableCount > 0 ? '0 0 16px rgba(0, 245, 255, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="profile-stat-label" style={{ fontSize: '6px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                AVAILABLE NOW
              </span>
              <Gift size={13} color="#00f5ff" className="profile-stat-icon" />
            </div>
            <div>
              <div className="profile-stat-val" style={{ fontSize: '9px', color: totalAvailableCount > 0 ? '#00f5ff' : '#88aacc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px', textShadow: totalAvailableCount > 0 ? '0 0 8px rgba(0, 245, 255, 0.35)' : 'none' }}>
                +{totalAvailableTokens > 0 ? Math.round(totalAvailableTokens).toLocaleString('en-US') : '0'} $VIBE
              </div>
              <div className="profile-stat-sub" style={{ fontSize: '5.5px', color: totalAvailableCount > 0 ? '#00ff88' : '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalAvailableCount} {totalAvailableCount === 1 ? 'REWARD' : 'REWARDS'} READY
              </div>
            </div>
          </div>

          {/* Tile 4: Expired Claims (Red/Muted) */}
          <div
            className="profile-stat-card"
            style={{
              background: 'rgba(4, 20, 48, 0.9)',
              border: totalExpiredCount > 0 ? '1.5px solid rgba(255, 68, 102, 0.5)' : '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '14px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="profile-stat-label" style={{ fontSize: '6px', color: totalExpiredCount > 0 ? '#ff4466' : '#88aacc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                EXPIRED CLAIMS
              </span>
              <Clock size={13} color={totalExpiredCount > 0 ? '#ff4466' : '#88aacc'} className="profile-stat-icon" />
            </div>
            <div>
              <div className="profile-stat-val" style={{ fontSize: '9px', color: totalExpiredCount > 0 ? '#ff4466' : '#88aacc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px' }}>
                {totalExpiredTokens > 0 ? `${Math.round(totalExpiredTokens).toLocaleString('en-US')}` : '0'} $VIBE
              </div>
              <div className="profile-stat-sub" style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalExpiredCount} {totalExpiredCount === 1 ? 'REWARD' : 'REWARDS'} MISSED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

