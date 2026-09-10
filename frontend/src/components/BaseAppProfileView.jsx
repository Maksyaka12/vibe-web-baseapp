import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, Gift, Clock, Coins, ArrowRight } from 'lucide-react';
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

  const getLinkPath = (path) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
      return `/app${path}`;
    }
    return path;
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. MODERN PROFILE HERO HEADER ── */}
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
            textAlign: 'center',
            width: '100%',
            lineHeight: 1.3
          }}
        >
          USER <span style={{ color: '#00f5ff' }}>PROFILE</span>
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
            BASE DOG IDENTITY &amp; STATISTICS
          </span>
        </div>
      </div>

      {/* ── 2. USER PROFILE CARD (FULL HEIGHT NFT IMAGE + CLEAN RIGHT INFO) ── */}
      {!address ? (
        <div
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
          <div style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", marginBottom: '8px', fontWeight: 900 }}>
            CONNECT YOUR WALLET
          </div>
          <p style={{ fontSize: '7px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 0 18px 0' }}>
            Connect to view your identity, holding balances and Vibe Club status.
          </p>
          <button
            onClick={login}
            style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #0050ff 100%)',
              border: '2px solid #ffffff',
              color: '#ffffff',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '8.5px',
              fontWeight: 900,
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(0, 245, 255, 0.5)',
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
          style={{
            background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
            border: '1.5px solid rgba(0, 245, 255, 0.25)',
            borderRadius: '18px',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'stretch',
            minHeight: '110px'
          }}
        >
          {/* Left Column: Full-Height NFT Image (occupies ~38-42% width) */}
          <div
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
              borderRight: '1px solid rgba(0, 245, 255, 0.15)'
            }}
          >
            <img
              src={hasNft ? (userNft?.image || '/nft/images/5.png') : '/new-logo-vibe.png'}
              alt="Profile Avatar"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                filter: hasNft ? 'none' : 'grayscale(1) brightness(0.6)'
              }}
            />
          </div>

          {/* Right Column: Address/Refresh top, Name middle, Dual Badges bottom */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Row: Address & Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
              <span style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button
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

            {/* Middle: NFT Name (Always Single Line with smart auto-scaling font) */}
            <div
              style={{
                fontSize: getNftFontSize(nftDisplayName),
                color: '#ffffff',
                fontFamily: "'Press Start 2P', monospace",
                fontWeight: 900,
                margin: '2px 0',
                lineHeight: 1.25,
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

            {/* Bottom Badges: Vibe Club Status + 5M+ Holder Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
              {/* Badge 1: Vibe Club Status */}
              {hasNft ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4.5px',
                    background: 'rgba(0, 255, 136, 0.15)',
                    border: '1px solid #00ff88',
                    borderRadius: '6px',
                    padding: '3.5px 7px',
                    width: 'fit-content'
                  }}
                >
                  <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', flexShrink: 0 }} />
                  <span style={{ fontSize: '5.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                    Vibe Club Member
                  </span>
                </div>
              ) : (
                <Link
                  to={getLinkPath('/vibeclub')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4.5px',
                    background: 'rgba(255, 68, 102, 0.15)',
                    border: '1px solid #ff4466',
                    borderRadius: '6px',
                    padding: '3.5px 7px',
                    width: 'fit-content',
                    textDecoration: 'none',
                    boxShadow: '0 0 8px rgba(255, 68, 102, 0.2)'
                  }}
                >
                  <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#ff4466', boxShadow: '0 0 5px #ff4466', flexShrink: 0 }} />
                  <span style={{ fontSize: '5.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                    JOIN VIBE CLUB · MINT NFT ↗
                  </span>
                </Link>
              )}

              {/* Badge 2: 5M+ Holder Status */}
              {isHolderEligibleLive ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4.5px',
                    background: 'rgba(0, 255, 136, 0.15)',
                    border: '1px solid #00ff88',
                    borderRadius: '6px',
                    padding: '3.5px 7px',
                    width: 'fit-content'
                  }}
                >
                  <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', flexShrink: 0 }} />
                  <span style={{ fontSize: '5.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                    5M+ $VIBE HOLDER
                  </span>
                </div>
              ) : (
                <Link
                  to={getLinkPath('/buy')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4.5px',
                    background: 'rgba(255, 68, 102, 0.15)',
                    border: '1px solid #ff4466',
                    borderRadius: '6px',
                    padding: '3.5px 7px',
                    width: 'fit-content',
                    textDecoration: 'none',
                    boxShadow: '0 0 8px rgba(255, 68, 102, 0.2)'
                  }}
                >
                  <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#ff4466', boxShadow: '0 0 5px #ff4466', flexShrink: 0 }} />
                  <span style={{ fontSize: '5.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                    BUY 5M+ $VIBE ↗
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. REWARD STATISTICS ZONE ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
          <h3 style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
            REWARD STATISTICS
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Tile 1: Total Claimed */}
          <div
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
              <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                TOTAL CLAIMED
              </span>
              <CheckCircle2 size={11} color="#00ff88" />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px', textShadow: '0 0 8px rgba(0, 255, 136, 0.3)' }}>
                +{totalClaimedTokens > 0 ? totalClaimedTokens.toLocaleString('en-US') : '0'} $VIBE
              </div>
              <div style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalClaimedCount} {totalClaimedCount === 1 ? 'CLAIM' : 'CLAIMS'} COMPLETED
              </div>
            </div>
          </div>

          {/* Tile 2: Available to Claim */}
          <div
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
              <span style={{ fontSize: '6px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                AVAILABLE NOW
              </span>
              <Gift size={11} color="#00f5ff" />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: totalAvailableCount > 0 ? '#00f5ff' : '#88aacc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px', textShadow: totalAvailableCount > 0 ? '0 0 8px rgba(0, 245, 255, 0.35)' : 'none' }}>
                +{totalAvailableTokens > 0 ? totalAvailableTokens.toLocaleString('en-US') : '0'} $VIBE
              </div>
              <div style={{ fontSize: '5.5px', color: totalAvailableCount > 0 ? '#00ff88' : '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalAvailableCount} {totalAvailableCount === 1 ? 'REWARD' : 'REWARDS'} READY
              </div>
            </div>
          </div>

          {/* Tile 3: Expired Claims */}
          <div
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
              <span style={{ fontSize: '6px', color: totalExpiredCount > 0 ? '#ff4466' : '#88aacc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                EXPIRED CLAIMS
              </span>
              <Clock size={11} color={totalExpiredCount > 0 ? '#ff4466' : '#88aacc'} />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: totalExpiredCount > 0 ? '#ff4466' : '#88aacc', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px' }}>
                {totalExpiredTokens > 0 ? `${totalExpiredTokens.toLocaleString('en-US')}` : '0'} $VIBE
              </div>
              <div style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalExpiredCount} {totalExpiredCount === 1 ? 'REWARD' : 'REWARDS'} MISSED
              </div>
            </div>
          </div>

          {/* Tile 4: Staking Rewards */}
          <div
            style={{
              background: 'rgba(4, 20, 48, 0.9)',
              border: totalStakingEarned > 0 ? '1.5px solid #00ff88' : '1px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '14px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              boxShadow: totalStakingEarned > 0 ? '0 0 16px rgba(0, 255, 136, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                STAKING REWARDS
              </span>
              <Coins size={11} color="#00ff88" />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '3px', textShadow: '0 0 8px rgba(0, 255, 136, 0.3)' }}>
                +{totalStakingEarned > 0 ? totalStakingEarned.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0'} $VIBE
              </div>
              <div style={{ fontSize: '5.5px', color: totalStakingEpochs > 0 ? '#00f5ff' : '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                {totalStakingEpochs} {totalStakingEpochs === 1 ? 'EPOCH' : 'EPOCHS'} PARTICIPATED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. QUICK LINKS / REDIRECTS ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
          <h3 style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
            TRACK. JOIN. EARN
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Link
            to={getLinkPath('/hub')}
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
              <span style={{ fontSize: '7px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, lineHeight: 1.3 }}>
                REWARDS HUB
              </span>
              <ArrowRight size={13} color="#00f5ff" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            </div>
            <span style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
              TRACK ACTIVE REWARDS
            </span>
          </Link>

          <Link
            to={getLinkPath('/claim')}
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
              <span style={{ fontSize: '7px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, lineHeight: 1.3 }}>
                CLAIM PORTAL
              </span>
              <ArrowRight size={13} color="#00ff88" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            </div>
            <span style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
              CLAIM ACTIVE REWARDS
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

