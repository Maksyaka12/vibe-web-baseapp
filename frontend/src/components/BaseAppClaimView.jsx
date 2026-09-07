import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Share2,
  X,
  Download,
  Check
} from 'lucide-react';

const O1 = 'https://launch.o1.exchange/token/0xb200000000000000000000df24ecb8bf51100a01?chain=8453';

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

function formatCountdownLive(targetIso) {
  if (!targetIso) return '';
  try {
    const now = new Date().getTime();
    const target = new Date(targetIso).getTime();
    const diff = target - now;

    if (diff <= 0) return '00H 00M 00S';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) {
      return `${days}D ${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
    }
    return `${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
  } catch {
    return '';
  }
}

export function BaseAppClaimView(props) {
  const {
    address,
    ready,
    authenticated,
    login,
    balance,
    nftCount,
    userNft,
    loading,
    fetchBalances,
    currentTime,
    claimStatus,
    claimedHistory,
    handleClaim,
    isHolderEligibleLive,
    holderRewardAmount,
    hasConfirmedHolderClaim,
    isHolderRound1Available,
    isHolderRound1Claimed,
    isVibeClubEligible,
    vibeClubRewardAmount,
    hasConfirmedRoyaltyClaim,
    isVibeClubRoyalty1Available,
    isVibeClubRoyalty1Claimed,
    activeRoyaltyEpochId,
    activeRoyaltyRound,
    activeRoyaltyAvailable,
    activeRoyaltyClaimed,
    royalty2Data,
    totalAvailableCount,
    upcomingHolderRound,
    upcomingVibeClubRound
  } = props;

  // Share Celebration Modal state
  const [shareModalItem, setShareModalItem] = useState(null);
  const [downloadingBanner, setDownloadingBanner] = useState(false);

  // Download / Save Banner
  const handleDownloadBanner = async () => {
    setDownloadingBanner(true);
    const imageUrl = '/vibe-club-royalties-banner.jpg';
    try {
      const isMobileDevice = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && window.innerWidth <= 768)
      );

      if (isMobileDevice && navigator.canShare) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'vibe-reward-claimed.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Vibe Rewards Claimed',
              text: 'Vibe Rewards Claimed 🐶💰'
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

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'vibe-reward-claimed.jpg';
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

  const getShareTwitterUrl = (item) => {
    const isRoyalty = item?.type === 'vibeclub' || item?.id?.includes('vibeclub') || item?.title?.toLowerCase().includes('royalty');
    const amt = item?.amount ? Number(item.amount).toLocaleString() : '22,935';
    const text = isRoyalty
      ? `I just claimed ${amt} $VIBE royalties from Vibe Club on @VIBEDOG_BASE! 👑🐶 Holding my NFT and sharing 20% royalties every 10 days.`
      : `I just claimed ${amt} $VIBE Holder Rewards on @VIBEDOG_BASE! 💎🐶 100M tokens distributed to 5M+ holders. Check eligibility:`;
    const url = 'https://vibehome.dog/claim';
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  };

  // Calculate user total claimed & expired
  const totalClaimedTokens = (claimedHistory || []).reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  const totalExpiredTokens = 0; // 0 $VIBE expired

  const hasNft = Boolean(nftCount && nftCount > 0);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. MODERN HERO HEADER ── */}
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
          CLAIM <span style={{ color: '#00f5ff' }}>PORTAL</span>
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
            PERSONAL REWARDS &amp; CLAIM STATION
          </span>
        </div>
      </div>

      {/* ── 2. SECTION 1: AVAILABLE TO CLAIM ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: totalAvailableCount > 0 ? '#00ff88' : '#64748b', boxShadow: totalAvailableCount > 0 ? '0 0 8px #00ff88' : 'none' }} />
          <h3 style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
            AVAILABLE TO CLAIM ({totalAvailableCount})
          </h3>
        </div>

        {totalAvailableCount === 0 ? (
          <div
            style={{
              background: 'rgba(4, 20, 48, 0.85)',
              border: '1.5px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '16px',
              padding: '20px 16px',
              textAlign: 'center'
            }}
          >
            {/* Green Checkmark in Circle + Green NO REWARDS TO CLAIM */}
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#00ff88" strokeWidth={2.5} />
              <span style={{ fontSize: '8.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                NO REWARDS TO CLAIM
              </span>
            </div>
            <p style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: 0 }}>
              Make sure you are eligible &amp; complete requirements before the snapshot for upcoming rewards below.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Holder Unlock 1 Claim Card */}
            {isHolderRound1Available && (hasConfirmedHolderClaim || isHolderEligibleLive) && (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
                  border: '1.5px solid #00ff88',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>💎</span>
                    <span style={{ fontSize: '8.5px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                      HOLDER REWARDS · UNLOCK 1
                    </span>
                  </div>
                  <span style={{ fontSize: '6px', color: '#00ff88', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', borderRadius: '6px', padding: '3px 6px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                    READY
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(2, 11, 26, 0.8)',
                    border: '1px solid rgba(0, 245, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ fontSize: '6px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px' }}>
                    YOUR REWARD ALLOCATION:
                  </div>
                  <div style={{ fontSize: '13px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                    +{holderRewardAmount.toLocaleString()} $VIBE
                  </div>
                </div>

                <button
                  onClick={() => handleClaim('holder', 1, holderRewardAmount)}
                  disabled={claimStatus['holder-1'] === 'claiming'}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 255, 136, 0.18)',
                    border: '2px solid #00ff88',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#00ff88',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8.5px',
                    fontWeight: 900,
                    cursor: claimStatus['holder-1'] === 'claiming' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 16px rgba(0, 255, 136, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ color: '#00ff88' }}>
                    {claimStatus['holder-1'] === 'claiming' ? 'CLAIMING ON BASE...' : 'CLAIM REWARD NOW'}
                  </span>
                  <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Vibe Club Royalty Active Claim Card */}
            {((activeRoyaltyAvailable !== undefined ? activeRoyaltyAvailable : isVibeClubRoyalty1Available) && isVibeClubEligible) && (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
                  border: '1.5px solid #00ff88',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>👑</span>
                    <span style={{ fontSize: '8.5px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                      VIBE CLUB · {(activeRoyaltyRound?.name || `ROYALTY ${activeRoyaltyEpochId || 1}`).toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '6px', color: '#00ff88', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', borderRadius: '6px', padding: '3px 6px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                    READY
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(2, 11, 26, 0.8)',
                    border: '1px solid rgba(0, 245, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ fontSize: '6px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px' }}>
                    YOUR REWARD ALLOCATION:
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                    +{vibeClubRewardAmount.toLocaleString()} $VIBE
                  </div>
                </div>

                <button
                  onClick={() => handleClaim('vibeclub', activeRoyaltyEpochId || 1, vibeClubRewardAmount)}
                  disabled={claimStatus[`vibeclub-${activeRoyaltyEpochId || 1}`] === 'claiming'}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 255, 136, 0.18)',
                    border: '2px solid #00ff88',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#00ff88',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8.5px',
                    fontWeight: 900,
                    cursor: claimStatus[`vibeclub-${activeRoyaltyEpochId || 1}`] === 'claiming' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 16px rgba(0, 255, 136, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ color: '#00ff88' }}>
                    {claimStatus[`vibeclub-${activeRoyaltyEpochId || 1}`] === 'claiming' ? 'CLAIMING ON BASE...' : 'CLAIM ROYALTIES NOW'}
                  </span>
                  <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. SECTION 2: UPCOMING REWARDS (STRUCTURED 2-COLUMN INFO GRID & MODERN CARDS) ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
          <h3 style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
            UPCOMING REWARDS (2)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Card 1: Holder Unlock 2 */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
              border: '1.5px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '16px',
              padding: '16px 14px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header: Title + Round + Status Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '8px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                HOLDER REWARDS <span style={{ color: '#88aacc' }}>·</span> <span style={{ color: '#00f5ff' }}>UNLOCK 2</span>
              </div>
              <span
                style={{
                  fontSize: '6px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: 800,
                  color: isHolderEligibleLive ? '#00ff88' : '#ff4466',
                  background: isHolderEligibleLive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 102, 0.15)',
                  border: isHolderEligibleLive ? '1px solid #00ff88' : '1px solid #ff4466',
                  borderRadius: '6px',
                  padding: '3.5px 7px',
                  letterSpacing: '0.3px',
                  boxShadow: isHolderEligibleLive ? '0 0 8px rgba(0, 255, 136, 0.25)' : '0 0 8px rgba(255, 68, 102, 0.2)'
                }}
              >
                {isHolderEligibleLive ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </span>
            </div>

            {/* 2-Column Info Grid: Countdown & Requirement */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {/* Box 1: Snapshot Countdown */}
              <div style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.18)', borderRadius: '10px', padding: '9px 10px' }}>
                <div style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px' }}>
                  SNAPSHOT COUNTDOWN
                </div>
                <div style={{ fontSize: '7.5px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                  {formatCountdownLive(upcomingHolderRound?.snapshotIso)}
                </div>
              </div>

              {/* Box 2: Requirement */}
              <div style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.18)', borderRadius: '10px', padding: '9px 10px' }}>
                <div style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px' }}>
                  REQUIREMENT
                </div>
                <div style={{ fontSize: '7px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                  Hold 5M+ $VIBE
                </div>
              </div>
            </div>

            {/* Bottom Eligibility Banner / Action */}
            {isHolderEligibleLive ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid rgba(0, 255, 136, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 10px'
                }}
              >
                <CheckCircle2 size={13} color="#00ff88" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
                  YOU ARE ELIGIBLE! YOU HOLD 5M+ $VIBE
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 68, 102, 0.08)',
                    border: '1px solid rgba(255, 68, 102, 0.3)',
                    borderRadius: '10px',
                    padding: '8px 10px'
                  }}
                >
                  <X size={12} color="#ff4466" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '5.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.5 }}>
                    NOT ELIGIBLE YET! YOU NEED TO HOLD 5M+ $VIBE BEFORE SNAPSHOT TO BECOME ELIGIBLE
                  </span>
                </div>
                <a
                  href={O1}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 68, 102, 0.15)',
                    border: '1.5px solid #ff4466',
                    color: '#ff4466',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '7.5px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(255, 68, 102, 0.2)'
                  }}
                >
                  <span>BUY $VIBE</span> <ArrowUpRight size={12} color="#ff4466" strokeWidth={2.5} />
                </a>
              </div>
            )}
          </div>

          {/* Card 2: Vibe Club Royalty 2 */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
              border: '1.5px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '16px',
              padding: '16px 14px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header: Title + Round + Status Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '8px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                VIBE CLUB <span style={{ color: '#88aacc' }}>·</span> <span style={{ color: '#00f5ff' }}>{(upcomingVibeClubRound?.name || 'ROYALTY 2').toUpperCase()}</span>
              </div>
              <span
                style={{
                  fontSize: '6px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: 800,
                  color: hasNft ? '#00ff88' : '#ff4466',
                  background: hasNft ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 102, 0.15)',
                  border: hasNft ? '1px solid #00ff88' : '1px solid #ff4466',
                  borderRadius: '6px',
                  padding: '3.5px 7px',
                  letterSpacing: '0.3px',
                  boxShadow: hasNft ? '0 0 8px rgba(0, 255, 136, 0.25)' : '0 0 8px rgba(255, 68, 102, 0.2)'
                }}
              >
                {hasNft ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </span>
            </div>

            {/* 2-Column Info Grid: Countdown & Requirement */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {/* Box 1: Snapshot Countdown */}
              <div style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.18)', borderRadius: '10px', padding: '9px 10px' }}>
                <div style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px' }}>
                  SNAPSHOT COUNTDOWN
                </div>
                <div style={{ fontSize: '7.5px', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                  {formatCountdownLive(upcomingVibeClubRound?.snapshotIso)}
                </div>
              </div>

              {/* Box 2: Requirement */}
              <div style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.18)', borderRadius: '10px', padding: '9px 10px' }}>
                <div style={{ fontSize: '5.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px' }}>
                  REQUIREMENT
                </div>
                <div style={{ fontSize: '7px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                  Hold Vibe Club NFT
                </div>
              </div>
            </div>

            {/* Bottom Eligibility Banner / Action */}
            {hasNft ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid rgba(0, 255, 136, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 10px'
                }}
              >
                <CheckCircle2 size={13} color="#00ff88" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
                  YOU ARE ELIGIBLE! YOU ARE A VIBE CLUB MEMBER!
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 68, 102, 0.08)',
                    border: '1px solid rgba(255, 68, 102, 0.3)',
                    borderRadius: '10px',
                    padding: '8px 10px'
                  }}
                >
                  <X size={12} color="#ff4466" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '5.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
                    NOT ELIGIBLE YET! JOIN VIBE CLUB TO BECOME ELIGIBLE
                  </span>
                </div>
                <Link
                  to="/vibeclub"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 68, 102, 0.15)',
                    border: '1.5px solid #ff4466',
                    color: '#ff4466',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '7.5px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 900,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(255, 68, 102, 0.2)'
                  }}
                >
                  <span>MINT NFT</span> <ArrowUpRight size={12} color="#ff4466" strokeWidth={2.5} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. SECTION 3: CLAIM HISTORY & CELEBRATION MODAL ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
          <h3 style={{ fontSize: '10px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: 0, fontWeight: 900 }}>
            CLAIM HISTORY ({claimedHistory?.length || 0})
          </h3>
        </div>

        {(!claimedHistory || claimedHistory.length === 0) ? (
          <div
            style={{
              background: 'rgba(4, 20, 48, 0.75)',
              border: '1.5px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '6.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", margin: 0 }}>
              No past claims made on this wallet yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {claimedHistory.map((item, idx) => {
              const isRoyalty = item?.type === 'vibeclub' || item?.id?.includes('vibeclub') || item?.title?.toLowerCase().includes('royalty');
              const categoryLabel = isRoyalty ? 'VIBE CLUB' : 'HOLDER REWARDS';
              const roundLabel = isRoyalty ? `ROYALTY ${item?.roundId || 1}` : `UNLOCK ${item?.roundId || 1}`;

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: 'rgba(4, 20, 48, 0.88)',
                    border: '1.5px solid rgba(0, 255, 136, 0.35)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  {/* LEFT SIDE: Title + Share & BaseScan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Category (White) • Round (Cyan) */}
                    <div style={{ fontSize: '7.5px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                      {categoryLabel} <span style={{ color: '#88aacc' }}>•</span> <span style={{ color: '#00f5ff' }}>{roundLabel}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Share Button (No arrow, clean pixel button) */}
                      <button
                        onClick={() => setShareModalItem(item)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.35)',
                          color: '#ffffff',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '6.5px',
                          fontFamily: "'Press Start 2P', monospace",
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Share2 size={10} />
                        <span>Share</span>
                      </button>

                      {/* BaseScan Tx Link */}
                      {item.txHash && (
                        <a
                          href={`https://basescan.org/tx/${item.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: 'rgba(0, 245, 255, 0.1)',
                            border: '1px solid rgba(0, 245, 255, 0.35)',
                            color: '#00f5ff',
                            borderRadius: '8px',
                            padding: '5px 8px',
                            fontSize: '6px',
                            fontFamily: "'Press Start 2P', monospace",
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>BaseScan</span>
                          <ArrowUpRight size={9} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: Claimed Amount + Date below */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                    {/* Claimed Amount (Green) */}
                    <div style={{ fontSize: '9px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, marginBottom: '4px' }}>
                      +{Number(item.amount || 0).toLocaleString()} $VIBE
                    </div>

                    {/* Claim Date */}
                    <div style={{ fontSize: '6px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace" }}>
                      {new Date(item.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. CELEBRATION / SHARE MODAL ── */}
      {shareModalItem && (
        <div
          onClick={() => setShareModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #061a3c 0%, #020b1a 100%)',
              border: '2px solid #00f5ff',
              borderRadius: '20px',
              padding: '24px 18px',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(0, 245, 255, 0.35)',
              position: 'relative'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShareModalItem(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>

            {/* Checkmark Icon */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 136, 0.15)',
                border: '2px solid #00ff88',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              <Check size={24} color="#00ff88" strokeWidth={3} />
            </div>

            {/* Modal Title */}
            <h3 style={{ fontSize: '11px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", margin: '0 0 6px 0', fontWeight: 900 }}>
              CLAIM SUCCESSFUL!
            </h3>

            <p style={{ fontSize: '7px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.5, margin: '0 0 16px 0' }}>
              You claimed <strong style={{ color: '#00f5ff' }}>+{Number(shareModalItem.amount || 22935).toLocaleString()} $VIBE</strong> in {shareModalItem.title} 🐶🔥
            </p>

            {/* Banner Preview */}
            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1.5px solid rgba(0, 245, 255, 0.35)', marginBottom: '18px' }}>
              <img
                src="/vibe-club-royalties-banner.jpg"
                alt="Claim Banner"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* 2 Action Steps: Save Image & Share on X */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Step 1: Save Image */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '6px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '5px', fontWeight: 900 }}>
                  STEP 1
                </div>
                <button
                  onClick={handleDownloadBanner}
                  disabled={downloadingBanner}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#ffffff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '6.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Download size={14} />
                  <span>SAVE IMAGE</span>
                </button>
              </div>

              {/* Step 2: Share on X */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '6px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", marginBottom: '5px', fontWeight: 900 }}>
                  STEP 2
                </div>
                <a
                  href={getShareTwitterUrl(shareModalItem)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #00f5ff 0%, #0050ff 100%)',
                    border: '1.5px solid #ffffff',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#ffffff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '6.5px',
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 14px rgba(0, 245, 255, 0.4)'
                  }}
                >
                  <Share2 size={14} />
                  <span>SHARE ON 𝕏</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
