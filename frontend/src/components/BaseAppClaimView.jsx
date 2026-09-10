import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRoyaltyBannerUrl } from '../Checker';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowRight,
  Share2,
  X,
  Download,
  Check,
  Clock,
  Gift,
  Loader2
} from 'lucide-react';

const CA = '0xb200000000000000000000df24ecb8bf51100a01';

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

function BaseAppClaimCountdownButton({ targetDate, onClaim }) {
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
      <button
        onClick={onClaim}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(0, 255, 136, 0.18)',
          border: '2px solid #00ff88',
          color: '#00ff88',
          borderRadius: '10px',
          fontFamily: "'Press Start 2P', monospace",
          fontWeight: 900,
          cursor: 'pointer',
          boxSizing: 'border-box',
          textShadow: 'none',
          boxShadow: '0 0 16px rgba(0, 255, 136, 0.35)'
        }}
      >
        <span style={{ color: '#00ff88' }}>CLAIM REWARD NOW</span> <ArrowUpRight size={14} color="#00ff88" strokeWidth={2.5} />
      </button>
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
    const ep = shareModalItem?.roundId || (shareModalItem?.id?.includes('2') ? 2 : (activeRoyaltyEpochId || 2));
    const imageUrl = getRoyaltyBannerUrl(ep);
    const fileName = `vibe-club-royalties-${ep}-claimed.jpg`;
    try {
      const isMobileDevice = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && window.innerWidth <= 768)
      );

      if (isMobileDevice && navigator.canShare) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Vibe Rewards Royalty ${ep} Claimed`,
              text: `Vibe Rewards Royalty ${ep} Claimed 🐶💰`
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
      link.download = fileName;
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

  const handleShareOnX = () => {
    const tweetText = `JUST CLAIMED MY NFT ROYALTIES 🐶💰\n\nHolding Vibe Club NFT unlocks passive $VIBE payouts every 10 days to all Club Members\n\nJoin Club → vibeverse.dog/vibeclub?ref=x`;

    const isMobile = typeof navigator !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window && window.innerWidth <= 768)
    );

    const appUrl = `twitter://post?message=${encodeURIComponent(tweetText)}`;
    const webUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    if (isMobile) {
      window.location.href = appUrl;
      const timer = setTimeout(() => {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }, 1500);

      const handleBlur = () => {
        clearTimeout(timer);
        window.removeEventListener('blur', handleBlur);
      };
      window.addEventListener('blur', handleBlur);
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '8.5px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                    HOLDER REWARDS <span style={{ color: '#88aacc' }}>·</span> <span style={{ color: '#00f5ff' }}>{(upcomingHolderRound?.name || 'UNLOCK 1').toUpperCase()}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '6px',
                      color: '#00ff88',
                      background: 'rgba(0, 255, 136, 0.15)',
                      border: '1px solid #00ff88',
                      borderRadius: '6px',
                      padding: '3.5px 7px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 0 8px rgba(0, 255, 136, 0.25)'
                    }}
                  >
                    <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', flexShrink: 0 }} />
                    CLAIM LIVE
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
                  <div style={{ fontSize: '6.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", marginBottom: '5px', fontWeight: 900 }}>
                    YOU'RE ELIGIBLE FOR CLAIM
                  </div>
                  <div style={{ fontSize: '13px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, textShadow: '0 0 10px rgba(0, 245, 255, 0.3)' }}>
                    +{(holderRewardAmount || 500000).toLocaleString('en-US')} $VIBE
                  </div>
                </div>

                <button
                  onClick={() => handleClaim('holder', 1, holderRewardAmount || 500000)}
                  disabled={claimStatus['holder-1'] === 'claiming'}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 255, 136, 0.18)',
                    border: '2px solid #00ff88',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#00ff88',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 900,
                    cursor: claimStatus['holder-1'] === 'claiming' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 16px rgba(0, 255, 136, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px'
                  }}
                >
                  {claimStatus['holder-1'] === 'claiming' ? (
                    <>
                      <Loader2 size={13} className="spin" color="#00ff88" />
                      <span style={{ color: '#00ff88' }}>CLAIMING ON BASE...</span>
                    </>
                  ) : (
                    <>
                      <Gift size={13} color="#00ff88" strokeWidth={2.5} />
                      <span style={{ color: '#00ff88' }}>
                        CLAIM +{(holderRewardAmount || 500000).toLocaleString('en-US')} $VIBE
                      </span>
                    </>
                  )}
                </button>

                {/* Claim window ends caption with countdown */}
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '6.5px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#88aacc'
                  }}
                >
                  <Clock size={11} color="#88aacc" />
                  <span>CLAIM WINDOW ENDS:</span>
                  <span
                    style={{
                      color: '#00f5ff',
                      background: 'rgba(0, 245, 255, 0.1)',
                      border: '1px solid rgba(0, 245, 255, 0.25)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {formatCountdownLive(upcomingHolderRound?.targetDate || '2026-09-25T14:00:00Z')}
                  </span>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '8.5px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                    VIBE CLUB <span style={{ color: '#88aacc' }}>·</span> <span style={{ color: '#00f5ff' }}>{(activeRoyaltyRound?.name || `ROYALTY ${activeRoyaltyEpochId || 2}`).toUpperCase()}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '6px',
                      color: '#00ff88',
                      background: 'rgba(0, 255, 136, 0.15)',
                      border: '1px solid #00ff88',
                      borderRadius: '6px',
                      padding: '3.5px 7px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 0 8px rgba(0, 255, 136, 0.25)'
                    }}
                  >
                    <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', flexShrink: 0 }} />
                    CLAIM LIVE
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
                  <div style={{ fontSize: '6.5px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", marginBottom: '5px', fontWeight: 900 }}>
                    YOU'RE ELIGIBLE FOR CLAIM
                  </div>
                  <div style={{ fontSize: '13px', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900, textShadow: '0 0 10px rgba(0, 245, 255, 0.3)' }}>
                    +{(vibeClubRewardAmount || (activeRoyaltyEpochId === 2 ? 17117 : 22935)).toLocaleString('en-US')} $VIBE
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const ep = activeRoyaltyEpochId || 2;
                    const amt = vibeClubRewardAmount || (ep === 2 ? 17117 : 22935);
                    await handleClaim('vibeclub', ep, amt);
                    setShareModalItem({
                      id: `vibeclub-${ep}`,
                      type: 'vibeclub',
                      roundId: ep,
                      title: `Vibe Club · Royalty ${ep}`,
                      amount: amt
                    });
                  }}
                  disabled={claimStatus[`vibeclub-${activeRoyaltyEpochId || 2}`] === 'claiming'}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 255, 136, 0.18)',
                    border: '2px solid #00ff88',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#00ff88',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 900,
                    cursor: claimStatus[`vibeclub-${activeRoyaltyEpochId || 2}`] === 'claiming' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 16px rgba(0, 255, 136, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px'
                  }}
                >
                  {claimStatus[`vibeclub-${activeRoyaltyEpochId || 2}`] === 'claiming' ? (
                    <>
                      <Loader2 size={13} className="spin" color="#00ff88" />
                      <span style={{ color: '#00ff88' }}>CLAIMING ON BASE...</span>
                    </>
                  ) : (
                    <>
                      <Gift size={13} color="#00ff88" strokeWidth={2.5} />
                      <span style={{ color: '#00ff88' }}>
                        CLAIM +{(vibeClubRewardAmount || (activeRoyaltyEpochId === 2 ? 17117 : 22935)).toLocaleString('en-US')} $VIBE
                      </span>
                    </>
                  )}
                </button>

                {/* Claim window ends caption with countdown */}
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '6.5px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#88aacc'
                  }}
                >
                  <Clock size={11} color="#88aacc" />
                  <span>CLAIM WINDOW ENDS:</span>
                  <span
                    style={{
                      color: '#00f5ff',
                      background: 'rgba(0, 245, 255, 0.1)',
                      border: '1px solid rgba(0, 245, 255, 0.25)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {formatCountdownLive(upcomingVibeClubRound?.targetDate || activeRoyaltyRound?.nextSnapshotDate || '2026-09-17T14:00:00Z')}
                  </span>
                </div>
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
          {/* Card 1: Holder Unlock */}
          {(() => {
            const isHolderSnapshotDone = Boolean(upcomingHolderRound?.snapshotIso && (currentTime instanceof Date ? currentTime.getTime() : new Date().getTime()) >= new Date(upcomingHolderRound.snapshotIso).getTime());
            return (
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
                    HOLDER REWARDS <span style={{ color: '#88aacc' }}>·</span> <span style={{ color: '#00f5ff' }}>{(upcomingHolderRound?.name || 'UNLOCK 2').toUpperCase()}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '6px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontWeight: 800,
                      color: isHolderSnapshotDone ? '#00ff88' : (isHolderEligibleLive ? '#00ff88' : '#ff4466'),
                      background: isHolderSnapshotDone ? 'rgba(0, 255, 136, 0.15)' : (isHolderEligibleLive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 102, 0.15)'),
                      border: isHolderSnapshotDone ? '1px solid #00ff88' : (isHolderEligibleLive ? '1px solid #00ff88' : '1px solid #ff4466'),
                      borderRadius: '6px',
                      padding: '3.5px 7px',
                      letterSpacing: '0.3px',
                      boxShadow: (isHolderSnapshotDone || isHolderEligibleLive) ? '0 0 8px rgba(0, 255, 136, 0.25)' : '0 0 8px rgba(255, 68, 102, 0.2)'
                    }}
                  >
                    {isHolderSnapshotDone ? 'ACTIVE' : (isHolderEligibleLive ? 'ELIGIBLE' : 'NOT ELIGIBLE YET')}
                  </span>
                </div>

                {/* 2-Column Info Grid: Countdown & Requirement */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {/* Box 1: Snapshot Countdown / Completed */}
                  <div style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.18)', borderRadius: '10px', padding: '9px 10px' }}>
                    <div style={{ fontSize: '5.5px', color: isHolderSnapshotDone ? '#00ff88' : '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {isHolderSnapshotDone ? (
                        <>
                          <Check size={8} color="#00ff88" strokeWidth={3} />
                          <span>SNAPSHOT COMPLETED</span>
                        </>
                      ) : (
                        <span>SNAPSHOT COUNTDOWN</span>
                      )}
                    </div>
                    <div style={{ fontSize: isHolderSnapshotDone ? '6.5px' : '7.5px', color: isHolderSnapshotDone ? '#00ff88' : '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                      {isHolderSnapshotDone ? (upcomingHolderRound?.snapshotDate || 'Aug 26, 00:00 UTC') : formatCountdownLive(upcomingHolderRound?.snapshotIso)}
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
                {isHolderSnapshotDone ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <BaseAppClaimCountdownButton
                      targetDate={upcomingHolderRound?.targetDate}
                      onClaim={() => {
                        const el = document.getElementById('available-claims-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
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
                        <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                          YOU ARE ELIGIBLE! YOU HOLD 5M+ $VIBE
                        </span>
                      </div>
                    ) : (
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
                        <span style={{ fontSize: '5.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                          NOT ELIGIBLE! YOU DIDN'T HOLD 5M+ $VIBE AT SNAPSHOT
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  isHolderEligibleLive ? (
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
                      <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                        YOU ARE ELIGIBLE! YOU HOLD 5M+ $VIBE
                      </span>
                    </div>
                  ) : (
                    <Link
                      to={typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app/buy' : '/buy'}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 68, 102, 0.1)',
                        border: '1px solid rgba(255, 68, 102, 0.4)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        textDecoration: 'none',
                        boxShadow: '0 0 12px rgba(255, 68, 102, 0.15)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <XCircle size={13} color="#ff4466" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '6px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        BUY $VIBE BEFORE SNAPSHOT TO BECOME ELIGIBLE
                      </span>
                      <ArrowRight size={11} color="#ff4466" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    </Link>
                  )
                )}
              </div>
            );
          })()}

          {/* Card 2: Vibe Club Royalty */}
          {(() => {
            const isVibeClubSnapshotDone = Boolean(upcomingVibeClubRound?.snapshotIso && (currentTime instanceof Date ? currentTime.getTime() : new Date().getTime()) >= new Date(upcomingVibeClubRound.snapshotIso).getTime());
            const hasRoyaltyProof = Boolean(hasConfirmedRoyaltyClaim || (royalty2Data?.claims && address && royalty2Data.claims[address.toLowerCase()]));
            const isRoyaltyEligibleNow = hasRoyaltyProof || hasNft;
            return (
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
                      color: isVibeClubSnapshotDone ? '#00ff88' : (hasNft ? '#00ff88' : '#ff4466'),
                      background: isVibeClubSnapshotDone ? 'rgba(0, 255, 136, 0.15)' : (hasNft ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 102, 0.15)'),
                      border: isVibeClubSnapshotDone ? '1px solid #00ff88' : (hasNft ? '1px solid #00ff88' : '1px solid #ff4466'),
                      borderRadius: '6px',
                      padding: '3.5px 7px',
                      letterSpacing: '0.3px',
                      boxShadow: (isVibeClubSnapshotDone || hasNft) ? '0 0 8px rgba(0, 255, 136, 0.25)' : '0 0 8px rgba(255, 68, 102, 0.2)'
                    }}
                  >
                    {isVibeClubSnapshotDone ? 'ACTIVE' : (hasNft ? 'ELIGIBLE' : 'NOT ELIGIBLE YET')}
                  </span>
                </div>

                {/* 2-Column Info Grid: Countdown & Requirement */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {/* Box 1: Snapshot Countdown / Completed */}
                  <div style={{ background: 'rgba(2, 11, 26, 0.8)', border: '1px solid rgba(0, 245, 255, 0.18)', borderRadius: '10px', padding: '9px 10px' }}>
                    <div style={{ fontSize: '5.5px', color: isVibeClubSnapshotDone ? '#00ff88' : '#88aacc', fontFamily: "'Press Start 2P', monospace", marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {isVibeClubSnapshotDone ? (
                        <>
                          <Check size={8} color="#00ff88" strokeWidth={3} />
                          <span>SNAPSHOT COMPLETED</span>
                        </>
                      ) : (
                        <span>SNAPSHOT COUNTDOWN</span>
                      )}
                    </div>
                    <div style={{ fontSize: isVibeClubSnapshotDone ? '6.5px' : '7.5px', color: isVibeClubSnapshotDone ? '#00ff88' : '#ffd700', fontFamily: "'Press Start 2P', monospace", fontWeight: 800 }}>
                      {isVibeClubSnapshotDone ? (upcomingVibeClubRound?.snapshotDate || 'Sep 7, 00:00 UTC') : formatCountdownLive(upcomingVibeClubRound?.snapshotIso)}
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
                {isVibeClubSnapshotDone ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <BaseAppClaimCountdownButton
                      targetDate={upcomingVibeClubRound?.targetDate}
                      onClaim={() => {
                        if (activeRoyaltyEpochId && vibeClubRewardAmount) {
                          handleClaim('vibeclub', activeRoyaltyEpochId, vibeClubRewardAmount);
                        } else {
                          const el = document.getElementById('available-claims-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    />
                    {isRoyaltyEligibleNow ? (
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
                        <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                          YOU ARE ELIGIBLE! YOU ARE A VIBE CLUB MEMBER!
                        </span>
                      </div>
                    ) : (
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
                        <span style={{ fontSize: '5.5px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                          NOT ELIGIBLE! YOU DIDN'T HOLD NFT AT SNAPSHOT
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  hasNft ? (
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
                      <span style={{ fontSize: '6px', color: '#00ff88', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                        YOU ARE ELIGIBLE! YOU ARE A VIBE CLUB MEMBER!
                      </span>
                    </div>
                  ) : (
                    <Link
                      to={typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app/vibeclub' : '/vibeclub'}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 68, 102, 0.1)',
                        border: '1px solid rgba(255, 68, 102, 0.4)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        textDecoration: 'none',
                        boxShadow: '0 0 12px rgba(255, 68, 102, 0.15)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <XCircle size={13} color="#ff4466" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '6px', color: '#ff4466', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        MINT NFT BEFORE SNAPSHOT TO BECOME ELIGIBLE
                      </span>
                      <ArrowRight size={11} color="#ff4466" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    </Link>
                  )
                )}
              </div>
            );
          })()}
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
              const isStaking = item?.type === 'staking' || item?.id?.startsWith('staking-') || item?.title?.toLowerCase().includes('staking');
              const isRoyalty = item?.type === 'vibeclub' || item?.id?.includes('vibeclub') || item?.title?.toLowerCase().includes('royalty');
              const categoryLabel = isStaking ? 'STAKING' : isRoyalty ? 'VIBE CLUB' : 'HOLDER REWARDS';
              const roundLabel = isStaking ? `EPOCH ${item?.roundId || 1}` : isRoyalty ? `ROYALTY ${item?.roundId || 1}` : `UNLOCK ${item?.roundId || 1}`;

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
                    {/* Category (White) • Round (Cyan/Purple) */}
                    <div style={{ fontSize: '7.5px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
                      {categoryLabel} <span style={{ color: '#88aacc' }}>•</span> <span style={{ color: isStaking ? '#a855f7' : '#00f5ff' }}>{roundLabel}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Share Button (Only for Vibe Club Royalties) */}
                      {isRoyalty && (
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
                      )}

                      {/* BaseScan / o1 Vault Tx Link */}
                      <a
                        href={item?.link ? item.link : (item?.txHash && item.txHash.startsWith('0x') ? `https://basescan.org/tx/${item.txHash}` : (address ? `https://basescan.org/token/${CA}?a=${address}` : `https://basescan.org/token/${CA}`))}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: isStaking ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 245, 255, 0.1)',
                          border: isStaking ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(0, 245, 255, 0.35)',
                          color: isStaking ? '#c084fc' : '#00f5ff',
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
                        <span>{isStaking ? 'o1 Vault' : 'BaseScan'}</span>
                        <ArrowUpRight size={9} />
                      </a>
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
              You claimed <strong style={{ color: '#00f5ff' }}>+{Number(shareModalItem.amount || (activeRoyaltyEpochId === 2 ? 17117 : 22935)).toLocaleString('en-US')} $VIBE</strong> in {shareModalItem.title || `Vibe Club · Royalty ${activeRoyaltyEpochId || 2}`} 🐶🔥
            </p>

            {/* Banner Preview */}
            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1.5px solid rgba(0, 245, 255, 0.35)', marginBottom: '18px' }}>
              <img
                src={getRoyaltyBannerUrl(shareModalItem?.roundId || (shareModalItem?.id?.includes('2') ? 2 : (activeRoyaltyEpochId || 2)))}
                alt="Claim Banner"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => {
                  const ep = shareModalItem?.roundId || (shareModalItem?.id?.includes('2') ? 2 : (activeRoyaltyEpochId || 2));
                  if (!e.currentTarget.src.includes('.jpg')) {
                    e.currentTarget.src = `/vibe-club-royalties-${ep}.jpg`;
                  } else {
                    e.currentTarget.src = '/vibe-club-royalties-banner.jpg';
                  }
                }}
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
                <button
                  onClick={() => handleShareOnX(shareModalItem)}
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
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 14px rgba(0, 245, 255, 0.4)'
                  }}
                >
                  <Share2 size={14} />
                  <span>SHARE ON 𝕏</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
