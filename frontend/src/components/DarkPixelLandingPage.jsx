import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  ArrowRight,
  ArrowUpRight,
  Gift,
  Coins,
  Crown,
  ArrowLeftRight,
  TrendingUp,
  FileCode2,
  Menu,
  X
} from 'lucide-react';

const CA = '0xb200000000000000000000df24ecb8bf51100a01';
const O1 = 'https://launch.o1.exchange/token/0xb200000000000000000000df24ecb8bf51100a01?chain=8453';
const DEX = 'https://dexscreener.com/base/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5';

function useCopy(text) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return { copied, copy };
}

export default function DarkPixelLandingPage() {
  const { copied, copy } = useCopy(CA);
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinks = [
    { label: 'TOKENOMICS', path: '/tokenomics' },
    { label: 'REWARDS HUB', path: '/hub', isHighlight: true },
    { label: 'CLAIM PORTAL', path: '/claim', isCyan: true },
    { label: 'VIBE CLUB NFT', path: '/vibeclub', isGold: true },
    { label: 'CONTRACTS', path: '/contracts' }
  ];

  return (
    <div className="base-app-pixel-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP STANDALONE LANDING NAVBAR ── */}
      <header
        style={{
          height: '70px',
          background: 'rgba(2, 11, 26, 0.95)',
          borderBottom: '1.5px solid rgba(0, 245, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxSizing: 'border-box'
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: '#00f5ff'
          }}
        >
          <img
            src="/new-logo-vibe.png"
            alt="VIBE"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1.5px solid #00f5ff',
              boxShadow: '0 0 12px rgba(0, 245, 255, 0.45)'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.6px' }}>
            $VIBE
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}
          className="landing-desktop-nav"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: 'none',
                fontSize: '8.5px',
                fontWeight: 800,
                color: link.isGold ? '#ffd700' : link.isHighlight ? '#ff9900' : link.isCyan ? '#00f5ff' : '#cbd5e1',
                padding: '6px 10px',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/hub')}
            style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #0050ff 100%)',
              color: '#ffffff',
              border: '1.5px solid #ffffff',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '8.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(0, 245, 255, 0.4)',
              fontFamily: "'Press Start 2P', monospace",
              textTransform: 'uppercase'
            }}
          >
            <span>ENTER APP</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="landing-mobile-ham-btn"
            style={{
              background: 'rgba(0, 245, 255, 0.08)',
              border: '1.5px solid rgba(0, 245, 255, 0.3)',
              borderRadius: '8px',
              color: '#00f5ff',
              padding: '6px',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer if open */}
      {mobileNavOpen && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(2, 11, 26, 0.98)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            gap: '16px',
            borderBottom: '1.5px solid rgba(0, 245, 255, 0.3)'
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileNavOpen(false)}
              style={{
                textDecoration: 'none',
                fontSize: '10px',
                fontWeight: 900,
                color: link.isGold ? '#ffd700' : link.isHighlight ? '#ff9900' : link.isCyan ? '#00f5ff' : '#ffffff',
                padding: '12px 14px',
                background: 'rgba(4, 20, 48, 0.8)',
                border: '1px solid rgba(0, 245, 255, 0.15)',
                borderRadius: '10px'
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMobileNavOpen(false);
              navigate('/hub');
            }}
            style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #0050ff 100%)',
              color: '#ffffff',
              border: '1.5px solid #ffffff',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '10px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            <span>GO TO VIBE PORTAL</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ── MAIN LANDING CONTENT CONTAINER ── */}
      <main style={{ flex: 1, width: '100%', maxWidth: '1160px', margin: '0 auto', padding: '36px 20px 80px 20px', boxSizing: 'border-box' }}>
        
        {/* ── 1. HERO SECTION ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
            alignItems: 'center',
            marginBottom: '50px',
            padding: '10px 0'
          }}
        >
          {/* Left Column: Text & CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Live Badge */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  background: 'rgba(0, 245, 255, 0.08)',
                  border: '1.5px solid rgba(0, 245, 255, 0.4)',
                  borderRadius: '99px',
                  padding: '7px 16px',
                  boxShadow: '0 0 14px rgba(0, 245, 255, 0.2)'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 10px #00ff88'
                  }}
                />
                <span
                  style={{
                    fontSize: '8px',
                    color: '#00f5ff',
                    letterSpacing: '0.6px',
                    fontWeight: 900
                  }}
                >
                  LIVE ON BASE B20
                </span>
              </div>
            </div>

            {/* Main Title */}
            <h1
              style={{
                fontSize: 'clamp(22px, 4vw, 36px)',
                lineHeight: 1.35,
                margin: 0,
                color: '#ffffff',
                letterSpacing: '0.6px'
              }}
            >
              I AM THE <span style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0, 245, 255, 0.55)' }}>VIBE.</span><br />
              THE <span style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0, 245, 255, 0.55)' }}>BASE</span> DOG.
            </h1>

            {/* Cyberpunk Quote Box */}
            <div
              style={{
                background: 'rgba(4, 20, 48, 0.95)',
                border: '1.5px solid rgba(0, 245, 255, 0.35)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 6px 24px rgba(0, 0, 0, 0.65)'
              }}
            >
              <div style={{ fontSize: '8.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                Dog Vibe belongs to only one owner <strong style={{ color: '#ff4466' }}>offchain</strong>.
              </div>
              <div style={{ fontSize: '8.5px', color: '#00f5ff', lineHeight: 1.6, fontWeight: 900 }}>
                Base Dog $VIBE belongs to everyone <strong style={{ color: '#00ff88' }}>onchain</strong>.
              </div>
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: '9px',
                lineHeight: 1.8,
                color: '#88aacc',
                margin: 0,
                letterSpacing: '0.3px'
              }}
            >
              Not just a meme. The real maltipoo dog and the ultimate mood maker on Base B20. Good vibes and positive energy only. Every great journey starts with a single paw print 🐾
            </p>

            {/* Action CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
              <button
                onClick={() => navigate('/hub')}
                style={{
                  background: 'linear-gradient(135deg, #00f5ff 0%, #0050ff 100%)',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  borderRadius: '12px',
                  padding: '14px 22px',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  boxShadow: '0 0 20px rgba(0, 245, 255, 0.5)',
                  fontFamily: "'Press Start 2P', monospace",
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>GO TO VIBE PORTAL</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <button
                onClick={() => navigate('/buy')}
                style={{
                  background: 'rgba(0, 245, 255, 0.12)',
                  border: '1.5px solid #00f5ff',
                  color: '#00f5ff',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '9px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontFamily: "'Press Start 2P', monospace",
                  textTransform: 'uppercase',
                  boxShadow: '0 0 12px rgba(0, 245, 255, 0.25)'
                }}
              >
                <span>SWAP $VIBE</span>
                <ArrowLeftRight size={14} strokeWidth={2.5} />
              </button>

              <a
                href={DEX}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(4, 14, 36, 0.85)',
                  border: '1.5px solid rgba(0, 245, 255, 0.3)',
                  color: '#cbd5e1',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  textDecoration: 'none',
                  fontFamily: "'Press Start 2P', monospace",
                  textTransform: 'uppercase'
                }}
              >
                <span>CHART</span>
                <ArrowUpRight size={13} strokeWidth={2.5} color="#00f5ff" />
              </a>
            </div>

            {/* Contract Address Box */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '7.5px', color: '#88aacc', marginBottom: '8px', letterSpacing: '0.5px' }}>
                $VIBE CONTRACT ADDRESS (BASE)
              </div>
              <div
                style={{
                  background: 'rgba(2, 11, 26, 0.95)',
                  border: '1.5px solid rgba(0, 245, 255, 0.35)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 0 14px rgba(0, 245, 255, 0.12)'
                }}
              >
                <span
                  style={{
                    fontSize: '8px',
                    color: '#00f5ff',
                    wordBreak: 'break-all',
                    letterSpacing: '0.3px',
                    fontFamily: "'Press Start 2P', monospace"
                  }}
                >
                  {CA}
                </span>
                <button
                  onClick={copy}
                  title="Copy Address"
                  style={{
                    background: copied ? 'rgba(0, 255, 136, 0.25)' : 'rgba(0, 245, 255, 0.15)',
                    border: copied ? '1.5px solid #00ff88' : '1.5px solid rgba(0, 245, 255, 0.35)',
                    borderRadius: '8px',
                    color: copied ? '#00ff88' : '#00f5ff',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                    fontSize: '7.5px',
                    fontFamily: "'Press Start 2P', monospace"
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Dog Mascot Artwork Card */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                position: 'relative',
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 80, 255, 0.25) 0%, rgba(2, 11, 26, 0.95) 80%)',
                border: '2px solid rgba(0, 245, 255, 0.45)',
                borderRadius: '26px',
                padding: '24px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 36px rgba(0, 245, 255, 0.3)',
                maxWidth: '420px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box'
              }}
            >
              {/* Mascot Image Frame */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2.5px solid #00f5ff',
                  boxShadow: '0 0 24px rgba(0, 245, 255, 0.4)',
                  background: '#041430',
                  position: 'relative'
                }}
              >
                <img
                  src="/new-logo-vibe.png"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/mascot.png'; }}
                  alt="$VIBE The Base Dog"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(2, 11, 26, 0.88)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid rgba(0, 245, 255, 0.4)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 900 }}>MALTIPOO DOG</span>
                  <span style={{ fontSize: '7.5px', color: '#00ff88', fontWeight: 900 }}>BASE B20</span>
                </div>
              </div>

              {/* Quick Stat Bar Below Dog */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  width: '100%',
                  marginTop: '18px'
                }}
              >
                <div
                  style={{
                    background: 'rgba(4, 14, 36, 0.9)',
                    border: '1.5px solid rgba(0, 245, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '6px' }}>TOTAL SUPPLY</div>
                  <div style={{ fontSize: '9px', color: '#ffffff', fontWeight: 900 }}>1,000,000,000</div>
                </div>

                <div
                  style={{
                    background: 'rgba(4, 14, 36, 0.9)',
                    border: '1.5px solid rgba(0, 255, 136, 0.25)',
                    borderRadius: '12px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '6px' }}>COMMUNITY</div>
                  <div style={{ fontSize: '9px', color: '#00ff88', fontWeight: 900 }}>100% ONCHAIN</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. ECOSYSTEM FEATURES GRID ── */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '15px', color: '#00f5ff', margin: '0 0 10px 0', letterSpacing: '0.6px' }}>
              $VIBE ECOSYSTEM
            </h2>
            <p style={{ fontSize: '8.5px', color: '#88aacc', margin: 0, letterSpacing: '0.4px' }}>
              EVERYTHING YOU NEED IN ONE DECENTRALIZED HUB
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Card 1: Rewards Hub */}
            <div
              onClick={() => navigate('/hub')}
              style={{
                background: 'rgba(4, 20, 48, 0.9)',
                border: '1.5px solid rgba(0, 245, 255, 0.3)',
                borderRadius: '18px',
                padding: '20px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(0, 245, 255, 0.15)',
                    border: '1.5px solid rgba(0, 245, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f5ff',
                    marginBottom: '14px'
                  }}
                >
                  <Gift size={22} />
                </div>
                <h3 style={{ fontSize: '11px', color: '#ffffff', margin: '0 0 10px 0' }}>REWARDS HUB</h3>
                <p style={{ fontSize: '7.5px', color: '#88aacc', lineHeight: 1.7, margin: 0 }}>
                  Explore 10-month holder unlocks, on-chain staking vault yields, and monthly Vibe Club royalties.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5ff', fontSize: '8px', fontWeight: 900 }}>
                <span>OPEN HUB</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </div>

            {/* Card 2: Claim Portal */}
            <div
              onClick={() => navigate('/claim')}
              style={{
                background: 'rgba(4, 20, 48, 0.9)',
                border: '1.5px solid rgba(0, 245, 255, 0.3)',
                borderRadius: '18px',
                padding: '20px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(0, 255, 136, 0.15)',
                    border: '1.5px solid rgba(0, 255, 136, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00ff88',
                    marginBottom: '14px'
                  }}
                >
                  <Coins size={22} />
                </div>
                <h3 style={{ fontSize: '11px', color: '#ffffff', margin: '0 0 10px 0' }}>CLAIM PORTAL</h3>
                <p style={{ fontSize: '7.5px', color: '#88aacc', lineHeight: 1.7, margin: 0 }}>
                  Check snapshot eligibility and claim your unlocked $VIBE rewards with instant on-chain verification.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff88', fontSize: '8px', fontWeight: 900 }}>
                <span>CHECK & CLAIM</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </div>

            {/* Card 3: Vibe Club NFT */}
            <div
              onClick={() => navigate('/vibeclub')}
              style={{
                background: 'rgba(4, 20, 48, 0.9)',
                border: '1.5px solid rgba(255, 215, 0, 0.35)',
                borderRadius: '18px',
                padding: '20px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 215, 0, 0.18)',
                    border: '1.5px solid rgba(255, 215, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffd700',
                    marginBottom: '14px'
                  }}
                >
                  <Crown size={22} />
                </div>
                <h3 style={{ fontSize: '11px', color: '#ffd700', margin: '0 0 10px 0' }}>VIBE CLUB NFT</h3>
                <p style={{ fontSize: '7.5px', color: '#88aacc', lineHeight: 1.7, margin: 0 }}>
                  Exclusive 1,000 PFP Maltipoo collection on Base. Earn 10,000 $VIBE/month per NFT from the 10M royalty pool.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffd700', fontSize: '8px', fontWeight: 900 }}>
                <span>EXPLORE NFT</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </div>

            {/* Card 4: DeFi Swap */}
            <div
              onClick={() => navigate('/buy')}
              style={{
                background: 'rgba(4, 20, 48, 0.9)',
                border: '1.5px solid rgba(0, 245, 255, 0.3)',
                borderRadius: '18px',
                padding: '20px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(0, 245, 255, 0.15)',
                    border: '1.5px solid rgba(0, 245, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f5ff',
                    marginBottom: '14px'
                  }}
                >
                  <ArrowLeftRight size={22} />
                </div>
                <h3 style={{ fontSize: '11px', color: '#ffffff', margin: '0 0 10px 0' }}>DEFI SWAP</h3>
                <p style={{ fontSize: '7.5px', color: '#88aacc', lineHeight: 1.7, margin: 0 }}>
                  Instant on-chain decentralized swap on Base Mainnet with automatic best-rate routing.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5ff', fontSize: '8px', fontWeight: 900 }}>
                <span>TRADE NOW</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. ABOUT / TRAITS SECTION ── */}
        <section
          style={{
            background: 'rgba(4, 20, 48, 0.9)',
            border: '1.5px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '20px',
            padding: '28px 24px',
            marginBottom: '40px',
            boxShadow: '0 10px 36px rgba(0, 0, 0, 0.75)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '13px', color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
              MORE THAN A MEME. THE REAL <span style={{ color: '#00f5ff' }}>BASE DOG</span>.
            </h2>
            <p style={{ fontSize: '8px', color: '#88aacc', margin: 0 }}>
              THE FLUFFIEST, MOST LOYAL DOG ONCHAIN & OFFCHAIN
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}
          >
            <div
              style={{
                background: 'rgba(2, 11, 26, 0.8)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
                borderRadius: '14px',
                padding: '16px 14px'
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>🐶</div>
              <div style={{ fontSize: '8.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '6px' }}>
                REAL DOG ENERGY
              </div>
              <div style={{ fontSize: '7.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                Inspired by a real Maltipoo — the cutest, most vibing dog alive.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(2, 11, 26, 0.8)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
                borderRadius: '14px',
                padding: '16px 14px'
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>⚡</div>
              <div style={{ fontSize: '8.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '6px' }}>
                B20 ON BASE
              </div>
              <div style={{ fontSize: '7.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                Community-driven standard, fully transparent tokenomics.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(2, 11, 26, 0.8)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
                borderRadius: '14px',
                padding: '16px 14px'
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>🤝</div>
              <div style={{ fontSize: '8.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '6px' }}>
                100% TO HOLDERS
              </div>
              <div style={{ fontSize: '7.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                Every vested token distributed to the community — zero team bags.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(2, 11, 26, 0.8)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
                borderRadius: '14px',
                padding: '16px 14px'
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>🐾</div>
              <div style={{ fontSize: '8.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '6px' }}>
                GOOD VIBES ONLY
              </div>
              <div style={{ fontSize: '7.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                Every paw print forward is a step toward the moon.
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: '1.5px solid rgba(0, 245, 255, 0.2)',
          background: 'rgba(2, 11, 26, 0.95)',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '7.5px',
          color: '#88aacc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/new-logo-vibe.png" alt="VIBE" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
          <span>$VIBE · THE BASE DOG</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <a href="https://t.me/vibe_b20" target="_blank" rel="noreferrer" style={{ color: '#00f5ff', textDecoration: 'none' }}>TELEGRAM</a>
          <a href="https://x.com/vibeb20" target="_blank" rel="noreferrer" style={{ color: '#00f5ff', textDecoration: 'none' }}>X (TWITTER)</a>
          <a href={DEX} target="_blank" rel="noreferrer" style={{ color: '#00f5ff', textDecoration: 'none' }}>DEXSCREENER</a>
          <a href={O1} target="_blank" rel="noreferrer" style={{ color: '#00f5ff', textDecoration: 'none' }}>O1 EXCHANGE</a>
        </div>
      </footer>
    </div>
  );
}

