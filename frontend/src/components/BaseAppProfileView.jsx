import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, Gift, Clock, Coins, ArrowRight, Copy, Check, Lock, Sparkles } from 'lucide-react';
import { formatUnits } from 'viem';
import { getPublicClient } from '../config/rpc';
import { STAKING_CONTRACT, STAKING_VAULTS_INFO } from '../Checker';

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
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = (e) => {
    e.stopPropagation();
    if (!address) return;
    if (props.copyAddress) {
      props.copyAddress(address);
    } else {
      navigator.clipboard?.writeText(address);
    }
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

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
      desc: 'HOLD 5M+ $VIBE',
      image: '/achievements/holder.jfif',
      unlocked: isHolderUnlocked
    },
    {
      id: 'nft-holder',
      name: 'VIBE CLUB MEMBER',
      desc: 'HOLD VIBE CLUB NFT',
      image: '/achievements/nft-holder.jfif',
      unlocked: isNftHolderUnlocked
    },
    {
      id: 'staker',
      name: 'STAKING EXPERT',
      desc: 'STAKE IN O1 VAULTS',
      image: '/achievements/staker.jfif',
      unlocked: isStakerUnlocked
    },
    {
      id: 'claimer',
      name: 'RICH DOG',
      desc: 'CLAIM PORTAL REWARDS',
      image: '/achievements/claimer.jfif',
      unlocked: isClaimerUnlocked
    },
    {
      id: 'active',
      name: 'ACTIVE DOG',
      desc: 'ECOSYSTEM ACTIVE',
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

      {/* ── 2. USER PROFILE CARD (STYLISH BASE DOG ID CARD) ── */}
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
            <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="profile-connect-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", marginBottom: '8px', fontWeight: 900 }}>
            CONNECT YOUR WALLET
          </div>
          <p className="profile-connect-desc" style={{ fontSize: '7px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 0 18px 0' }}>
            Connect to view your identity, achievements and reward dashboard.
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
        <div
          className="profile-user-card profile-connected-card"
          style={{
            background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
            border: '1.5px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '18px',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 245, 255, 0.2)',
            display: 'flex',
            alignItems: 'stretch',
            minHeight: '110px'
          }}
        >
          {/* Left Column: Full-Height Avatar Image with Cyberpunk Frame */}
          <div
            className="profile-avatar-col"
            style={{
              width: '38%',
              minWidth: '110px',
              maxWidth: '150px',
              background: '#020b1a',
              flexShrink: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1.5px solid rgba(0, 245, 255, 0.2)'
            }}
          >
            <img
              src={hasNft ? (userNft?.image || '/nft/images/5.png') : '/mascot.png'}
              alt="Profile Avatar"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div
              className="profile-avatar-tag"
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '6px',
                right: '6px',
                background: hasNft ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 245, 255, 0.85)',
                color: '#020b1a',
                fontSize: '4.5px',
                fontWeight: 900,
                fontFamily: "'Press Start 2P', monospace",
                textAlign: 'center',
                padding: '2.5px 2px',
                borderRadius: '4px',
                boxShadow: hasNft ? '0 0 8px rgba(0, 255, 136, 0.6)' : '0 0 8px rgba(0, 245, 255, 0.6)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {hasNft ? 'VIBE CLUB VIP' : 'DOG CITIZEN'}
            </div>
          </div>

          {/* Right Column: Base Dog ID, Identity Name & Stats */}
          <div
            className="profile-details-col"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Row: Base Dog ID Label + Truncated Address & Copy / Refresh */}
            <div className="profile-address-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
              <div className="profile-id-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 245, 255, 0.1)', border: '1px solid rgba(0, 245, 255, 0.3)', borderRadius: '6px', padding: '3px 6px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 6px #00f5ff' }} />
                <span style={{ fontSize: '5.5px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                  BASE ID
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="profile-copy-btn"
                  title="Copy Address"
                  style={{
                    background: copiedAddress ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 245, 255, 0.1)',
                    border: copiedAddress ? '1px solid #00ff88' : '1px solid rgba(0, 245, 255, 0.3)',
                    color: copiedAddress ? '#00ff88' : '#88aacc',
                    borderRadius: '5px',
                    padding: '3px 6px',
                    fontSize: '5.5px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copiedAddress ? <Check size={8} color="#00ff88" /> : <Copy size={8} color="#88aacc" />}
                  <span>{copiedAddress ? 'COPIED!' : `${address.slice(0, 4)}...${address.slice(-3)}`}</span>
                </button>

                <button
                  className="profile-refresh-btn"
                  onClick={() => fetchBalances(true)}
                  disabled={loading}
                  title="Refresh Balances"
                  style={{
                    background: loading ? 'rgba(0, 245, 255, 0.25)' : 'rgba(0, 245, 255, 0.12)',
                    border: '1px solid rgba(0, 245, 255, 0.4)',
                    color: '#00f5ff',
                    borderRadius: '5px',
                    padding: '3px 6px',
                    fontSize: '5.5px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 0 6px rgba(0, 245, 255, 0.2)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RefreshCw size={7} className={loading ? 'spin' : ''} />
                  <span>{loading ? '...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Middle: Identity Name */}
            <div
              className="profile-nft-title"
              style={{
                fontSize: getNftFontSize(nftDisplayName),
                color: '#ffffff',
                fontFamily: "'Press Start 2P', monospace",
                fontWeight: 900,
                margin: '1px 0',
                lineHeight: 1.3,
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
              title={nftDisplayName}
            >
              {nftDisplayName}
            </div>

            {/* Bottom Row: Sleek Mini Stats Bar */}
            <div className="profile-stats-pill-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
              <div className="profile-stat-mini-pill" style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '6px', padding: '3.5px 7px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>BAL:</span>
                <span style={{ fontSize: '5.5px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>{formatCompactBalance(balance)}</span>
              </div>
              <div className="profile-stat-mini-pill" style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '6px', padding: '3.5px 7px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>NFT:</span>
                <span style={{ fontSize: '5.5px', color: hasNft ? '#00ff88' : '#cbd5e1', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>{nftCount || 0}</span>
              </div>
              <div className="profile-stat-mini-pill" style={{ background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '6px', padding: '3.5px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', flexShrink: 0 }} />
                <span style={{ fontSize: '5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>BASE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. ACHIEVEMENTS SECTION (RESPONSIVE 3 COL MOB / 4 COL DESKTOP) ── */}
      <div className="profile-achievements-zone" style={{ marginBottom: '24px' }}>
        <div className="profile-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="profile-section-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', flexShrink: 0, display: 'inline-block' }} />
            <h3 className="profile-section-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900, lineHeight: 1 }}>
              ACHIEVEMENTS
            </h3>
          </div>
          <div className="profile-achievements-tracker" style={{ background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.4)', borderRadius: '99px', padding: '4px 10px', fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                      <Lock size={7} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span>LOCKED</span>
                    </>
                  )}
                </div>
              </div>
              <div className="profile-achievement-name" title={ach.name}>
                {ach.name}
              </div>
              <div className="profile-achievement-desc">
                {ach.desc}
              </div>
            </div>
          ))}

          {/* 6th Slot: More Achievements Coming Soon */}
          <div className="profile-achievement-card profile-achievement-placeholder">
            <div className="profile-placeholder-icon-box">
              <Sparkles size={18} color="#00f5ff" />
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
              <CheckCircle2 size={11} color="#00ff88" />
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
              <Coins size={11} color="#c084fc" />
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
              <Gift size={11} color="#00f5ff" />
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
              <Clock size={11} color={totalExpiredCount > 0 ? '#ff4466' : '#88aacc'} />
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

      {/* ── 4. QUICK LINKS / REDIRECTS ── */}
      <div className="profile-quicklinks-zone" style={{ marginBottom: '16px' }}>
        <div className="profile-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="profile-section-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', flexShrink: 0, display: 'inline-block' }} />
          <h3 className="profile-section-title" style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900, lineHeight: 1 }}>
            TRACK. JOIN. EARN
          </h3>
        </div>

        <div className="profile-quicklinks-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Link
            to={getLinkPath('/hub')}
            className="profile-quicklink-card"
            style={{
              padding: '12px 10px',
              background: 'rgba(4, 20, 48, 0.9)',
              border: '1px solid rgba(0, 245, 255, 0.35)',
              borderRadius: '14px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span className="profile-quicklink-title" style={{ fontSize: '7px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, lineHeight: 1.3 }}>
                REWARDS HUB
              </span>
              <ArrowRight size={13} color="#00f5ff" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            </div>
            <span className="profile-quicklink-sub" style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
              TRACK ACTIVE REWARDS
            </span>
          </Link>

          <Link
            to={getLinkPath('/claim')}
            className="profile-quicklink-card"
            style={{
              padding: '12px 10px',
              background: 'rgba(4, 20, 48, 0.9)',
              border: '1px solid rgba(0, 255, 136, 0.35)',
              borderRadius: '14px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span className="profile-quicklink-title" style={{ fontSize: '7px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, lineHeight: 1.3 }}>
                CLAIM PORTAL
              </span>
              <ArrowRight size={13} color="#00ff88" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            </div>
            <span className="profile-quicklink-sub" style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
              CLAIM ACTIVE REWARDS
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

