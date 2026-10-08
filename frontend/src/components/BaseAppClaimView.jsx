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
        className="claim-action-btn"
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'color-mix(in srgb, var(--green) 18%, transparent)',
          border: '2px solid var(--green)',
          color: 'var(--green)',
          borderRadius: '10px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 900,
          cursor: 'pointer',
          boxSizing: 'border-box',
          
          }}
      >
        <span style={{ color: 'var(--green)' }}>CLAIM REWARD NOW</span> <ArrowUpRight size={14} color="var(--green)" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <button
      disabled
      className="claim-action-btn"
      style={{
        width: '100%',
        padding: '12px',
        fontSize: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'color-mix(in srgb, var(--green) 12%, transparent)',
        border: '1.5px solid var(--green)',
        color: 'var(--green)',
        borderRadius: '10px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 900,
        boxSizing: 'border-box',
        
        cursor: 'default',
        }}
    >
      <Clock size={13} color="var(--green)" strokeWidth={2.5} />
      <span style={{ color: 'var(--green)' }}>CLAIM IN {timeLeft}</span>
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
    activeHolderEpochId,
    activeHolderRound,
    activeHolderAvailable,
    activeHolderClaimed,
    round1Data,
    round2Data,
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
    royalty3Data,
    royalty4Data,
    royalty5Data,
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
    const ep = shareModalItem?.roundId || (shareModalItem?.id?.includes('5') ? 5 : (shareModalItem?.id?.includes('4') ? 4 : (shareModalItem?.id?.includes('3') ? 3 : (shareModalItem?.id?.includes('2') ? 2 : (activeRoyaltyEpochId || 5)))));
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
    <div className="claim-view-container" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. MODERN HERO HEADER ── */}
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
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)',
            
            textAlign: 'center',
            width: '100%',
            lineHeight: 1.3
          }}
        >
          CLAIM <span style={{ color: 'var(--accent)' }}>PORTAL</span>
        </h2>

        {/* Subtitle Status Pill */}
        <div
          className="rewards-hero-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
            border: '1.5px solid color-mix(in srgb, var(--accent) 35%, transparent)',
            borderRadius: '99px',
            padding: '7px 16px',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)',  flexShrink: 0 }} />
          <span className="rewards-hero-pill-text" style={{ fontSize: '6.5px', color: 'var(--accent)', letterSpacing: '0.5px', fontFamily: 'var(--font-sans)', fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
            PERSONAL REWARDS &amp; CLAIM STATION
          </span>
        </div>
      </div>

      {/* ── 2. SECTION 1: AVAILABLE TO CLAIM ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: totalAvailableCount > 0 ? 'var(--green)' : 'var(--text-3)', }} />
          <h3 className="claim-section-title" style={{ fontSize: '10px', color: 'var(--text)', fontFamily: 'var(--font-sans)', margin: 0, fontWeight: 900 }}>
            AVAILABLE TO CLAIM ({totalAvailableCount})
          </h3>
        </div>

        {totalAvailableCount === 0 ? (
          <div
            className="claim-empty-box"
            style={{
              background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
              border: '1.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              borderRadius: '16px',
              overflow: 'hidden',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              }}
          >
            <img
              src="/claim-banner.jfif"
              alt="No Rewards To Claim"
              className="claim-empty-banner-img"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '14px',
                objectFit: 'cover'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Holder Rewards Active Claim Card */}
            {(activeHolderAvailable !== undefined ? activeHolderAvailable : isHolderRound1Available) && hasConfirmedHolderClaim && (
              <div
                className="claim-card"
                style={{
                  background: 'color-mix(in srgb, var(--surface-2) 95%, transparent)',
                  border: '1.5px solid var(--green)',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  }}
              >
                <div
                  className="claim-allocation-banner-wrap"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '14px',
                    border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    
                    background: 'var(--bg)',
                    containerType: 'inline-size'
                  }}
                >
                  <img
                    src="/allocation-banner.png"
                    alt="Your Allocation"
                    className="claim-allocation-banner-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />

                  {/* Top header overlay inside banner */}
                  <div
                    className="claim-banner-top-header"
                    style={{
                      position: 'absolute',
                      top: '3%',
                      left: '3%',
                      right: '3%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}
                  >
                    <div
                      className="claim-banner-top-title"
                      style={{
                        fontSize: '6px',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 900,
                        letterSpacing: '0.2px',
                        
                        background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                        
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      HOLDER REWARDS <span style={{ color: 'var(--text-3)' }}>·</span> <span style={{ color: 'var(--accent)' }}>{(activeHolderRound?.name || 'UNLOCK 2').toUpperCase()}</span>
                    </div>

                    <span
                      className="claim-banner-top-status"
                      style={{
                        fontSize: '5.5px',
                        color: 'var(--green)',
                        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
                        border: '1px solid var(--green)',
                        borderRadius: '6px',
                        padding: '3px 6px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 800,
                        letterSpacing: '0.2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        
                        
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span className="claim-banner-top-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)',  flexShrink: 0 }} />
                      CLAIM LIVE
                    </span>
                  </div>

                  {/* Amount overlay inside box */}
                  <div
                    className="claim-allocation-banner-overlay"
                    style={{
                      position: 'absolute',
                      left: '4.2%',
                      width: '59.6%',
                      top: '48%',
                      height: '38%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      padding: '0 6px',
                      zIndex: 2
                    }}
                  >
                    <div
                      className="claim-allocation-banner-amount-inter"
                      style={{
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: 900,
                        color: 'var(--green)',
                        
                        fontSize: 'clamp(17px, 7.6cqi, 48px)',
                        letterSpacing: '-0.025em',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                        gap: 'clamp(3px, 1.2cqi, 9px)'
                      }}
                    >
                      <span>+{(holderRewardAmount || 500000).toLocaleString('en-US')}</span>
                      <span
                        className="claim-allocation-currency"
                        style={{
                          fontSize: '0.65em',
                          fontWeight: 900,
                          color: 'var(--accent)',
                          
                          letterSpacing: '0.02em'
                        }}
                      >
                        $VIBE
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="claim-action-btn"
                  onClick={() => handleClaim('holder', activeHolderEpochId || 1, holderRewardAmount || 500000)}
                  disabled={claimStatus[`holder-${activeHolderEpochId || 1}`] === 'claiming'}
                  style={{
                    width: '100%',
                    background: 'color-mix(in srgb, var(--green) 18%, transparent)',
                    border: '2px solid var(--green)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'var(--green)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '8px',
                    fontWeight: 900,
                    cursor: claimStatus[`holder-${activeHolderEpochId || 1}`] === 'claiming' ? 'not-allowed' : 'pointer',
                    
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px'
                  }}
                >
                  {claimStatus[`holder-${activeHolderEpochId || 1}`] === 'claiming' ? (
                    <>
                      <Loader2 size={13} className="spin" color="var(--green)" />
                      <span style={{ color: 'var(--green)' }}>CLAIMING ON BASE...</span>
                    </>
                  ) : (
                    <>
                      <Gift size={13} color="var(--green)" strokeWidth={2.5} />
                      <span style={{ color: 'var(--green)' }}>
                        CLAIM +{(holderRewardAmount || 500000).toLocaleString('en-US')} $VIBE
                      </span>
                    </>
                  )}
                </button>

                {/* Claim window ends caption with countdown */}
                <div
                  className="claim-deadline-wrap"
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '6.5px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-3)'
                  }}
                >
                  <Clock size={11} color="var(--text-3)" />
                  <span>CLAIM WINDOW ENDS:</span>
                  <span>{formatCountdownLive(upcomingHolderRound?.targetDate || '2026-09-25T14:00:00Z')}</span>
                </div>
              </div>
            )}

            {/* Vibe Club Royalty Active Claim Card */}
            {((activeRoyaltyAvailable !== undefined ? activeRoyaltyAvailable : isVibeClubRoyalty1Available) && isVibeClubEligible) && (
              <div
                className="claim-card"
                style={{
                  background: 'color-mix(in srgb, var(--surface-2) 95%, transparent)',
                  border: '1.5px solid var(--green)',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  }}
              >
                <div
                  className="claim-allocation-banner-wrap"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '14px',
                    border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    
                    background: 'var(--bg)',
                    containerType: 'inline-size'
                  }}
                >
                  <img
                    src="/allocation-banner.png"
                    alt="Your Allocation"
                    className="claim-allocation-banner-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />

                  {/* Top header overlay inside banner */}
                  <div
                    className="claim-banner-top-header"
                    style={{
                      position: 'absolute',
                      top: '3%',
                      left: '3%',
                      right: '3%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}
                  >
                    <div
                      className="claim-banner-top-title"
                      style={{
                        fontSize: '6px',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 900,
                        letterSpacing: '0.2px',
                        
                        background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                        
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      VIBE CLUB <span style={{ color: 'var(--text-3)' }}>·</span> <span style={{ color: 'var(--accent)' }}>{(activeRoyaltyRound?.name || `ROYALTY ${activeRoyaltyEpochId || 2}`).toUpperCase()}</span>
                    </div>

                    <span
                      className="claim-banner-top-status"
                      style={{
                        fontSize: '5.5px',
                        color: 'var(--green)',
                        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
                        border: '1px solid var(--green)',
                        borderRadius: '6px',
                        padding: '3px 6px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 800,
                        letterSpacing: '0.2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        
                        
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span className="claim-banner-top-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)',  flexShrink: 0 }} />
                      CLAIM LIVE
                    </span>
                  </div>

                  {/* Amount overlay inside box */}
                  <div
                    className="claim-allocation-banner-overlay"
                    style={{
                      position: 'absolute',
                      left: '4.2%',
                      width: '59.6%',
                      top: '48%',
                      height: '38%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      padding: '0 6px',
                      zIndex: 2
                    }}
                  >
                    <div
                      className="claim-allocation-banner-amount-inter"
                      style={{
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: 900,
                        color: 'var(--green)',
                        
                        fontSize: 'clamp(17px, 7.6cqi, 48px)',
                        letterSpacing: '-0.025em',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                        gap: 'clamp(3px, 1.2cqi, 9px)'
                      }}
                    >
                      <span>+{(vibeClubRewardAmount || (activeRoyaltyEpochId === 4 ? 9909 : (activeRoyaltyEpochId === 3 ? 18018 : (activeRoyaltyEpochId === 2 ? 17117 : 22935)))).toLocaleString('en-US')}</span>
                      <span
                        className="claim-allocation-currency"
                        style={{
                          fontSize: '0.65em',
                          fontWeight: 900,
                          color: 'var(--accent)',
                          
                          letterSpacing: '0.02em'
                        }}
                      >
                        $VIBE
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="claim-action-btn"
                  onClick={async () => {
                    const ep = activeRoyaltyEpochId || 4;
                    const amt = vibeClubRewardAmount || (ep === 4 ? 9909 : (ep === 3 ? 18018 : (ep === 2 ? 17117 : 22935)));
                    await handleClaim('vibeclub', ep, amt);
                    setShareModalItem({
                      id: `vibeclub-${ep}`,
                      type: 'vibeclub',
                      roundId: ep,
                      title: `Vibe Club · Royalty ${ep}`,
                      amount: amt
                    });
                  }}
                  disabled={claimStatus[`vibeclub-${activeRoyaltyEpochId || 4}`] === 'claiming'}
                  style={{
                    width: '100%',
                    background: 'color-mix(in srgb, var(--green) 18%, transparent)',
                    border: '2px solid var(--green)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'var(--green)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '8px',
                    fontWeight: 900,
                    cursor: claimStatus[`vibeclub-${activeRoyaltyEpochId || 4}`] === 'claiming' ? 'not-allowed' : 'pointer',
                    
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px'
                  }}
                >
                  {claimStatus[`vibeclub-${activeRoyaltyEpochId || 4}`] === 'claiming' ? (
                    <>
                      <Loader2 size={13} className="spin" color="var(--green)" />
                      <span style={{ color: 'var(--green)' }}>CLAIMING ON BASE...</span>
                    </>
                  ) : (
                    <>
                      <Gift size={13} color="var(--green)" strokeWidth={2.5} />
                      <span style={{ color: 'var(--green)' }}>
                        CLAIM +{(vibeClubRewardAmount || (activeRoyaltyEpochId === 4 ? 9909 : (activeRoyaltyEpochId === 3 ? 18018 : (activeRoyaltyEpochId === 2 ? 17117 : 22935)))).toLocaleString('en-US')} $VIBE
                      </span>
                    </>
                  )}
                </button>

                {/* Claim window ends caption with countdown */}
                <div
                  className="claim-deadline-wrap"
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '6.5px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-3)'
                  }}
                >
                  <Clock size={11} color="var(--text-3)" />
                  <span>CLAIM WINDOW ENDS:</span>
                  <span>{formatCountdownLive(upcomingVibeClubRound?.targetDate || activeRoyaltyRound?.nextSnapshotDate || '2026-09-17T14:00:00Z')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. SECTION 2: UPCOMING REWARDS (STRUCTURED 2-COLUMN INFO GRID & MODERN CARDS) ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)', }} />
          <h3 className="claim-section-title" style={{ fontSize: '10px', color: 'var(--text)', fontFamily: 'var(--font-sans)', margin: 0, fontWeight: 900 }}>
            UPCOMING REWARDS (2)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Card 1: Holder Unlock */}
          {(() => {
            const isHolderSnapshotDone = Boolean(upcomingHolderRound?.snapshotIso && (currentTime instanceof Date ? currentTime.getTime() : new Date().getTime()) >= new Date(upcomingHolderRound.snapshotIso).getTime());
            return (
              <div
                className="claim-upcoming-card"
                style={{
                  background: 'color-mix(in srgb, var(--surface-2) 95%, transparent)',
                  border: '1.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  }}
              >
                {/* Header: Title + Round + Status Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="claim-upcoming-title" style={{ fontSize: '8px', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontWeight: 900 }}>
                    HOLDER REWARDS <span style={{ color: 'var(--text-3)' }}>·</span> <span style={{ color: 'var(--accent)' }}>{(upcomingHolderRound?.name || 'UNLOCK 2').toUpperCase()}</span>
                  </div>
                  <span
                    className="claim-upcoming-status"
                    style={{
                      fontSize: '6px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 800,
                      color: isHolderSnapshotDone ? 'var(--green)' : (isHolderEligibleLive ? 'var(--green)' : 'var(--red)'),
                      background: isHolderSnapshotDone ? 'color-mix(in srgb, var(--green) 15%, transparent)' : (isHolderEligibleLive ? 'color-mix(in srgb, var(--green) 15%, transparent)' : 'color-mix(in srgb, var(--red) 15%, transparent)'),
                      border: isHolderSnapshotDone ? '1px solid var(--green)' : (isHolderEligibleLive ? '1px solid var(--green)' : '1px solid var(--red)'),
                      borderRadius: '6px',
                      padding: '3.5px 7px',
                      letterSpacing: '0.3px',
                      }}
                  >
                    {isHolderSnapshotDone ? 'ACTIVE' : (isHolderEligibleLive ? 'ELIGIBLE' : 'NOT ELIGIBLE YET')}
                  </span>
                </div>

                {/* Rewards Pool highlight */}
                <div
                  className="rewards-pool-box"
                  style={{
                    background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}
                >
                  <div className="rewards-pool-label" style={{ fontSize: '6.5px', color: 'var(--text-3)', marginBottom: '4px', fontFamily: 'var(--font-sans)', }}>
                    REWARDS POOL
                  </div>
                  <div className="rewards-pool-value" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 900, fontFamily: 'var(--font-sans)', }}>
                    10,000,000 <span className="rewards-pool-unit" style={{ fontSize: '8px', color: 'var(--accent)' }}>$VIBE</span>
                  </div>
                </div>

                {/* 2-Column Info Grid: Countdown & Requirement */}
                <div className="claim-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {/* Box 1: Snapshot Countdown / Completed */}
                  <div className="claim-info-box" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)', borderRadius: '10px', padding: '9px 10px' }}>
                    <div className="claim-info-label" style={{ fontSize: '5.5px', color: isHolderSnapshotDone ? 'var(--green)' : 'var(--text-3)', fontFamily: 'var(--font-sans)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {isHolderSnapshotDone ? (
                        <>
                          <Check size={8} color="var(--green)" strokeWidth={3} className="rewards-snapshot-check-icon" style={{ flexShrink: 0 }} />
                          <span>SNAPSHOT COMPLETED</span>
                        </>
                      ) : (
                        <span>SNAPSHOT COUNTDOWN</span>
                      )}
                    </div>
                    <div className="claim-info-val" style={{ fontSize: isHolderSnapshotDone ? '6.5px' : '7.5px', color: isHolderSnapshotDone ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>
                      {isHolderSnapshotDone ? (upcomingHolderRound?.snapshotDate || 'Aug 26, 00:00 UTC') : formatCountdownLive(upcomingHolderRound?.snapshotIso)}
                    </div>
                  </div>

                  {/* Box 2: Requirement */}
                  <div className="claim-info-box" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)', borderRadius: '10px', padding: '9px 10px' }}>
                    <div className="claim-info-label" style={{ fontSize: '5.5px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
                      REQUIREMENT
                    </div>
                    <div className="claim-info-val" style={{ fontSize: '7px', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>
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
                        className="claim-eligibility-banner"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'color-mix(in srgb, var(--green) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--green) 35%, transparent)',
                          borderRadius: '10px',
                          padding: '8px 10px'
                        }}
                      >
                        <CheckCircle2 size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '6px', color: 'var(--green)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                          YOU ARE ELIGIBLE! YOU HOLD 5M+ $VIBE
                        </span>
                      </div>
                    ) : (
                      <div
                        className="claim-eligibility-banner"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'color-mix(in srgb, var(--red) 8%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <X size={12} color="var(--red)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '5.5px', color: 'var(--red)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          Not eligible for this unlock. Complete requirement for the next unlock.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  isHolderEligibleLive ? (
                    <div
                      className="claim-eligibility-banner"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'color-mix(in srgb, var(--green) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--green) 35%, transparent)',
                        borderRadius: '10px',
                        padding: '8px 10px'
                      }}
                    >
                      <CheckCircle2 size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '6px', color: 'var(--green)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                        YOU ARE ELIGIBLE! YOU HOLD 5M+ $VIBE
                      </span>
                    </div>
                  ) : (
                    <Link
                      to={typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app/buy' : '/buy'}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="claim-upcoming-cta"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'color-mix(in srgb, var(--amber) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--amber) 50%, transparent)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        textDecoration: 'none',
                        
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <AlertCircle size={13} color="var(--amber)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '6px', color: 'var(--amber)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        BUY $VIBE BEFORE SNAPSHOT TO BECOME ELIGIBLE
                      </span>
                      <ArrowRight size={11} color="var(--amber)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    </Link>
                  )
                )}
              </div>
            );
          })()}

          {/* Card 2: Vibe Club Royalty */}
          {(() => {
            const isVibeClubSnapshotDone = Boolean(upcomingVibeClubRound?.snapshotIso && (currentTime instanceof Date ? currentTime.getTime() : new Date().getTime()) >= new Date(upcomingVibeClubRound.snapshotIso).getTime());
            const hasRoyaltyProof = Boolean(hasConfirmedRoyaltyClaim || (royalty5Data?.claims && address && royalty5Data.claims[address.toLowerCase()]) || (royalty4Data?.claims && address && royalty4Data.claims[address.toLowerCase()]) || (royalty3Data?.claims && address && royalty3Data.claims[address.toLowerCase()]) || (royalty2Data?.claims && address && royalty2Data.claims[address.toLowerCase()]));
            const isRoyaltyEligibleNow = hasRoyaltyProof || hasNft;
            const vibeClubPoolAmount = upcomingVibeClubRound?.pool
              ? (upcomingVibeClubRound.pool.includes('$VIBE') || upcomingVibeClubRound.pool === 'TBA'
                  ? upcomingVibeClubRound.pool
                  : `${upcomingVibeClubRound.pool} $VIBE`)
              : 'TBA';
            return (
              <div
                className="claim-upcoming-card"
                style={{
                  background: 'color-mix(in srgb, var(--surface-2) 95%, transparent)',
                  border: '1.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  }}
              >
                {/* Header: Title + Round + Status Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="claim-upcoming-title" style={{ fontSize: '8px', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontWeight: 900 }}>
                    VIBE CLUB <span style={{ color: 'var(--text-3)' }}>·</span> <span style={{ color: 'var(--accent)' }}>{(upcomingVibeClubRound?.name || 'ROYALTY 2').toUpperCase()}</span>
                  </div>
                  <span
                    className="claim-upcoming-status"
                    style={{
                      fontSize: '6px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 800,
                      color: isVibeClubSnapshotDone ? 'var(--green)' : (hasNft ? '#00ff88' : 'var(--red)'),
                      background: isVibeClubSnapshotDone ? 'color-mix(in srgb, var(--green) 15%, transparent)' : (hasNft ? 'color-mix(in srgb, var(--green) 15%, transparent)' : 'color-mix(in srgb, var(--red) 15%, transparent)'),
                      border: isVibeClubSnapshotDone ? '1px solid var(--green)' : (hasNft ? '1px solid var(--green)' : '1px solid var(--red)'),
                      borderRadius: '6px',
                      padding: '3.5px 7px',
                      letterSpacing: '0.3px',
                      }}
                  >
                    {isVibeClubSnapshotDone ? 'ACTIVE' : (hasNft ? 'ELIGIBLE' : 'NOT ELIGIBLE YET')}
                  </span>
                </div>

                {/* Royalty Pool highlight */}
                <div
                  className="rewards-pool-box"
                  style={{
                    background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}
                >
                  <div className="rewards-pool-label" style={{ fontSize: '6.5px', color: 'var(--text-3)', marginBottom: '4px', fontFamily: 'var(--font-sans)', }}>
                    ROYALTY POOL
                  </div>
                  <div className="rewards-pool-value" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 900, fontFamily: 'var(--font-sans)', }}>
                    {vibeClubPoolAmount}
                  </div>
                </div>

                {/* 2-Column Info Grid: Countdown & Requirement */}
                <div className="claim-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {/* Box 1: Snapshot Countdown / Completed */}
                  <div className="claim-info-box" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)', borderRadius: '10px', padding: '9px 10px' }}>
                    <div className="claim-info-label" style={{ fontSize: '5.5px', color: isVibeClubSnapshotDone ? 'var(--green)' : 'var(--text-3)', fontFamily: 'var(--font-sans)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {isVibeClubSnapshotDone ? (
                        <>
                          <Check size={8} color="var(--green)" strokeWidth={3} className="rewards-snapshot-check-icon" style={{ flexShrink: 0 }} />
                          <span>SNAPSHOT COMPLETED</span>
                        </>
                      ) : (
                        <span>SNAPSHOT COUNTDOWN</span>
                      )}
                    </div>
                    <div className="claim-info-val" style={{ fontSize: isVibeClubSnapshotDone ? '6.5px' : '7.5px', color: isVibeClubSnapshotDone ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>
                      {isVibeClubSnapshotDone ? (upcomingVibeClubRound?.snapshotDate || 'Sep 7, 00:00 UTC') : formatCountdownLive(upcomingVibeClubRound?.snapshotIso)}
                    </div>
                  </div>

                  {/* Box 2: Requirement */}
                  <div className="claim-info-box" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)', borderRadius: '10px', padding: '9px 10px' }}>
                    <div className="claim-info-label" style={{ fontSize: '5.5px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
                      REQUIREMENT
                    </div>
                    <div className="claim-info-val" style={{ fontSize: '7px', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>
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
                        className="claim-eligibility-banner"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'color-mix(in srgb, var(--green) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--green) 35%, transparent)',
                          borderRadius: '10px',
                          padding: '8px 10px'
                        }}
                      >
                        <CheckCircle2 size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '6px', color: 'var(--green)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                          YOU ARE ELIGIBLE! YOU ARE A VIBE CLUB MEMBER!
                        </span>
                      </div>
                    ) : (
                      <div
                        className="claim-eligibility-banner"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'color-mix(in srgb, var(--red) 8%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <X size={12} color="var(--red)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '5.5px', color: 'var(--red)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          Not eligible for this payout. Complete requirement for the next payout.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  hasNft ? (
                    <div
                      className="claim-eligibility-banner"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'color-mix(in srgb, var(--green) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--green) 35%, transparent)',
                        borderRadius: '10px',
                        padding: '8px 10px'
                      }}
                    >
                      <CheckCircle2 size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '6px', color: 'var(--green)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                        YOU ARE ELIGIBLE! YOU ARE A VIBE CLUB MEMBER!
                      </span>
                    </div>
                  ) : (
                    <Link
                      to={typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app/vibeclub' : '/vibeclub'}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="claim-upcoming-cta"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'color-mix(in srgb, var(--amber) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--amber) 50%, transparent)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        textDecoration: 'none',
                        
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <AlertCircle size={13} color="var(--amber)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '6px', color: 'var(--amber)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        MINT NFT BEFORE SNAPSHOT TO BECOME ELIGIBLE
                      </span>
                      <ArrowRight size={11} color="var(--amber)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
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
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', }} />
          <h3 className="claim-section-title" style={{ fontSize: '10px', color: 'var(--text)', fontFamily: 'var(--font-sans)', margin: 0, fontWeight: 900 }}>
            CLAIM HISTORY ({claimedHistory?.length || 0})
          </h3>
        </div>

        {(!claimedHistory || claimedHistory.length === 0) ? (
          <div
            className="claim-history-empty"
            style={{
              background: 'color-mix(in srgb, var(--surface) 75%, transparent)',
              border: '1.5px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '6.5px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', margin: 0 }}>
              No past claims made on this wallet yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {claimedHistory.map((item, idx) => {
              const isStaking = item?.type === 'staking' || item?.id?.startsWith('staking-') || item?.title?.toLowerCase().includes('staking');
              const isRoyalty = item?.type === 'vibeclub' || item?.id?.includes('vibeclub') || item?.title?.toLowerCase().includes('royalty');
              const categoryLabel = isStaking ? 'STAKING' : isRoyalty ? 'VIBE CLUB' : 'HOLDER REWARDS';
              const itemRoundId = item?.roundId || (item?.id ? parseInt(item.id.replace(/\D/g, '')) : null) || 1;
              const roundLabel = isStaking ? `EPOCH ${itemRoundId}` : isRoyalty ? `ROYALTY ${itemRoundId}` : `UNLOCK ${itemRoundId}`;

              return (
                <div
                  key={item.id || idx}
                  className="claim-history-row"
                  style={{
                    background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
                    border: '1.5px solid color-mix(in srgb, var(--green) 35%, transparent)',
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
                    <div className="claim-history-title" style={{ fontSize: '7.5px', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontWeight: 900 }}>
                      {categoryLabel} <span style={{ color: 'var(--text-3)' }}>•</span> <span style={{ color: isStaking ? 'var(--text-2)' : 'var(--accent)' }}>{roundLabel}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Share Button (Only for Vibe Club Royalties) */}
                      {isRoyalty && (
                        <button
                          onClick={() => setShareModalItem(item)}
                          className="claim-history-btn"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                            color: 'var(--text)',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '6.5px',
                            fontFamily: 'var(--font-sans)',
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

                      {/* o1 Vault Link (For Staking Claims) */}
                      {isStaking && item?.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="claim-history-btn"
                          style={{
                            background: 'color-mix(in srgb, var(--text-2) 15%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--text-2) 40%, transparent)',
                            color: 'var(--text-2)',
                            borderRadius: '8px',
                            padding: '5px 8px',
                            fontSize: '6px',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>o1 Vault</span>
                          <ArrowUpRight size={9} />
                        </a>
                      )}

                      {/* BaseScan Tx Link */}
                      <a
                        href={item?.txHash && item.txHash.startsWith('0x') ? `https://basescan.org/tx/${item.txHash}` : (address ? `https://basescan.org/token/${CA}?a=${address}` : `https://basescan.org/token/${CA}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="claim-history-btn"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                          color: 'var(--accent)',
                          borderRadius: '8px',
                          padding: '5px 8px',
                          fontSize: '6px',
                          fontFamily: 'var(--font-sans)',
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
                    </div>
                  </div>

                  {/* RIGHT SIDE: Claimed Amount + Date below */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                    {/* Claimed Amount (Green) */}
                    <div className="claim-history-amount" style={{ fontSize: '9px', color: 'var(--green)', fontFamily: 'var(--font-sans)', fontWeight: 900, marginBottom: '4px' }}>
                      +{Math.round(Number(item.amount || 0)).toLocaleString('en-US')} $VIBE
                    </div>

                    {/* Claim Date */}
                    <div className="claim-history-date" style={{ fontSize: '6px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
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
      {/* ── 4. CELEBRATION / SHARE MODAL ── */}
      {shareModalItem && (
        <div
          onClick={() => setShareModalItem(null)}
          className="claim-share-modal-overlay"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="claim-share-modal-card"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShareModalItem(null)}
              className="claim-share-modal-close"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Checkmark Icon */}
            <div className="claim-share-modal-badge">
              <Check size={28} color="var(--green)" strokeWidth={3.2} />
            </div>

            {/* Modal Title */}
            <h3 className="claim-share-modal-title">
              CLAIM SUCCESSFUL!
            </h3>

            <p className="claim-share-modal-sub">
              You claimed <strong style={{ color: 'var(--accent)' }}>+{Number(shareModalItem.amount || (activeRoyaltyEpochId === 5 ? 7207 : (activeRoyaltyEpochId === 4 ? 9909 : (activeRoyaltyEpochId === 3 ? 18018 : (activeRoyaltyEpochId === 2 ? 17117 : 22935))))).toLocaleString('en-US')} $VIBE</strong> in {shareModalItem.title || `Vibe Club · Royalty ${activeRoyaltyEpochId || 5}`} 🐶🔥
            </p>

            {/* Banner Preview */}
            <div className="claim-share-modal-banner-wrap">
              <img
                src={getRoyaltyBannerUrl(shareModalItem?.roundId || (shareModalItem?.id?.includes('5') ? 5 : (shareModalItem?.id?.includes('4') ? 4 : (shareModalItem?.id?.includes('3') ? 3 : (shareModalItem?.id?.includes('2') ? 2 : (activeRoyaltyEpochId || 5))))))}
                alt="Claim Banner"
                className="claim-share-modal-banner-img"
                onError={(e) => {
                  const ep = shareModalItem?.roundId || (shareModalItem?.id?.includes('5') ? 5 : (shareModalItem?.id?.includes('4') ? 4 : (shareModalItem?.id?.includes('3') ? 3 : (shareModalItem?.id?.includes('2') ? 2 : (activeRoyaltyEpochId || 5)))));
                  if (!e.currentTarget.src.includes('.jpg')) {
                    e.currentTarget.src = `/vibe-club-royalties-${ep}.jpg`;
                  } else {
                    e.currentTarget.src = '/vibe-club-royalties-banner.jpg';
                  }
                }}
              />
            </div>

            {/* 2 Action Steps: Save Image & Share on X */}
            <div className="claim-share-modal-steps-grid">
              {/* Step 1: Save Image */}
              <div className="claim-share-modal-step-col">
                <div className="claim-share-modal-step-label">
                  STEP 1
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBanner}
                  disabled={downloadingBanner}
                  className="claim-share-modal-btn save-btn"
                >
                  <Download size={16} />
                  <span>SAVE IMAGE</span>
                </button>
              </div>

              {/* Step 2: Share on X */}
              <div className="claim-share-modal-step-col">
                <div className="claim-share-modal-step-label cyan">
                  STEP 2
                </div>
                <button
                  type="button"
                  onClick={() => handleShareOnX(shareModalItem)}
                  className="claim-share-modal-btn share-btn"
                >
                  <Share2 size={16} />
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
