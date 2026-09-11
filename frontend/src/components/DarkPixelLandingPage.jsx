import React, { useState, useCallback } from 'react';
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
  Flame,
  ShieldCheck,
  Users,
  Sparkles
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

export default function DarkPixelLandingPage({ onSelectTab }) {
  const { copied, copy } = useCopy(CA);

  return (
    <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto', padding: '24px 16px 80px 16px', boxSizing: 'border-box' }}>
      
      {/* ── 1. HERO SECTION ── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          marginBottom: '40px',
          padding: '24px 0'
        }}
      >
        {/* Left Column: Text & CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Live Badge */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 245, 255, 0.08)',
                border: '1.5px solid rgba(0, 245, 255, 0.35)',
                borderRadius: '99px',
                padding: '6px 14px',
                boxShadow: '0 0 12px rgba(0, 245, 255, 0.15)'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#00ff88',
                  boxShadow: '0 0 8px #00ff88'
                }}
              />
              <span
                style={{
                  fontSize: '7px',
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
              fontSize: 'clamp(20px, 3.5vw, 32px)',
              lineHeight: 1.35,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '0.5px'
            }}
          >
            I AM THE <span style={{ color: '#00f5ff', textShadow: '0 0 16px rgba(0, 245, 255, 0.5)' }}>VIBE.</span><br />
            THE <span style={{ color: '#00f5ff', textShadow: '0 0 16px rgba(0, 245, 255, 0.5)' }}>BASE</span> DOG.
          </h1>

          {/* Cyberpunk Quote Box */}
          <div
            style={{
              background: 'rgba(4, 20, 48, 0.92)',
              border: '1.5px solid rgba(0, 245, 255, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ fontSize: '7.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Dog Vibe belongs to only one owner <strong style={{ color: '#ff4466' }}>offchain</strong>.
            </div>
            <div style={{ fontSize: '7.5px', color: '#00f5ff', lineHeight: 1.5, fontWeight: 900 }}>
              Base Dog $VIBE belongs to everyone <strong style={{ color: '#00ff88' }}>onchain</strong>.
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '8px',
              lineHeight: 1.7,
              color: '#88aacc',
              margin: 0,
              letterSpacing: '0.3px'
            }}
          >
            Not just a meme. The real maltipoo dog and the ultimate mood maker on Base B20. Good vibes and positive energy only. Every great journey starts with a single paw print 🐾
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <button
              onClick={() => onSelectTab && onSelectTab('hub')}
              style={{
                background: 'linear-gradient(135deg, #00f5ff 0%, #0050ff 100%)',
                color: '#ffffff',
                border: '1.5px solid #ffffff',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '8px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 16px rgba(0, 245, 255, 0.45)',
                fontFamily: "'Press Start 2P', monospace",
                textTransform: 'uppercase'
              }}
            >
              <span>EXPLORE REWARDS</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('buy')}
              style={{
                background: 'rgba(0, 245, 255, 0.1)',
                border: '1.5px solid #00f5ff',
                color: '#00f5ff',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '8px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Press Start 2P', monospace",
                textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(0, 245, 255, 0.2)'
              }}
            >
              <span>SWAP $VIBE</span>
              <ArrowLeftRight size={13} strokeWidth={2.5} />
            </button>

            <a
              href={DEX}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'rgba(4, 14, 36, 0.8)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
                color: '#cbd5e1',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '7.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                fontFamily: "'Press Start 2P', monospace",
                textTransform: 'uppercase'
              }}
            >
              <span>CHART</span>
              <ArrowUpRight size={12} strokeWidth={2.5} color="#00f5ff" />
            </a>
          </div>

          {/* Contract Address Box */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '6.5px', color: '#88aacc', marginBottom: '6px', letterSpacing: '0.4px' }}>
              $VIBE CONTRACT ADDRESS (BASE)
            </div>
            <div
              style={{
                background: 'rgba(2, 11, 26, 0.95)',
                border: '1.5px solid rgba(0, 245, 255, 0.3)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                boxShadow: '0 0 10px rgba(0, 245, 255, 0.1)'
              }}
            >
              <span
                style={{
                  fontSize: '7px',
                  color: '#00f5ff',
                  wordBreak: 'break-all',
                  letterSpacing: '0.2px',
                  fontFamily: "'Press Start 2P', monospace"
                }}
              >
                {CA}
              </span>
              <button
                onClick={copy}
                title="Copy Address"
                style={{
                  background: copied ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 245, 255, 0.12)',
                  border: copied ? '1px solid #00ff88' : '1px solid rgba(0, 245, 255, 0.3)',
                  borderRadius: '6px',
                  color: copied ? '#00ff88' : '#00f5ff',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  fontSize: '6.5px',
                  fontFamily: "'Press Start 2P', monospace"
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
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
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 80, 255, 0.2) 0%, rgba(2, 11, 26, 0.9) 80%)',
              border: '2px solid rgba(0, 245, 255, 0.4)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 245, 255, 0.25)',
              maxWidth: '380px',
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
                borderRadius: '18px',
                overflow: 'hidden',
                border: '2px solid #00f5ff',
                boxShadow: '0 0 20px rgba(0, 245, 255, 0.35)',
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
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  background: 'rgba(2, 11, 26, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 245, 255, 0.35)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '6.5px', color: '#00f5ff', fontWeight: 900 }}>MALTIPOO DOG</span>
                <span style={{ fontSize: '6.5px', color: '#00ff88', fontWeight: 900 }}>BASE B20</span>
              </div>
            </div>

            {/* Quick Stat Bar Below Dog */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                width: '100%',
                marginTop: '16px'
              }}
            >
              <div
                style={{
                  background: 'rgba(4, 14, 36, 0.8)',
                  border: '1px solid rgba(0, 245, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '5.5px', color: '#88aacc', marginBottom: '4px' }}>TOTAL SUPPLY</div>
                <div style={{ fontSize: '8px', color: '#ffffff', fontWeight: 900 }}>1,000,000,000</div>
              </div>

              <div
                style={{
                  background: 'rgba(4, 14, 36, 0.8)',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                  borderRadius: '10px',
                  padding: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '5.5px', color: '#88aacc', marginBottom: '4px' }}>COMMUNITY</div>
                <div style={{ fontSize: '8px', color: '#00ff88', fontWeight: 900 }}>100% ONCHAIN</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ECOSYSTEM FEATURES GRID ── */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '13px', color: '#00f5ff', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
            $VIBE ECOSYSTEM
          </h2>
          <p style={{ fontSize: '7.5px', color: '#88aacc', margin: 0, letterSpacing: '0.3px' }}>
            EVERYTHING YOU NEED IN ONE DECENTRALIZED HUB
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Card 1: Rewards Hub */}
          <div
            onClick={() => onSelectTab && onSelectTab('hub')}
            style={{
              background: 'rgba(4, 20, 48, 0.88)',
              border: '1.5px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '16px',
              padding: '18px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 245, 255, 0.12)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f5ff',
                  marginBottom: '12px'
                }}
              >
                <Gift size={20} />
              </div>
              <h3 style={{ fontSize: '9px', color: '#ffffff', margin: '0 0 8px 0' }}>REWARDS HUB</h3>
              <p style={{ fontSize: '6.5px', color: '#88aacc', lineHeight: 1.6, margin: 0 }}>
                Explore 10-month holder unlocks, on-chain staking vault yields, and monthly Vibe Club royalties.
              </p>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5ff', fontSize: '7px', fontWeight: 900 }}>
              <span>OPEN HUB</span>
              <ArrowRight size={11} strokeWidth={2.5} />
            </div>
          </div>

          {/* Card 2: Claim Portal */}
          <div
            onClick={() => onSelectTab && onSelectTab('claim')}
            style={{
              background: 'rgba(4, 20, 48, 0.88)',
              border: '1.5px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '16px',
              padding: '18px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 255, 136, 0.12)',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00ff88',
                  marginBottom: '12px'
                }}
              >
                <Coins size={20} />
              </div>
              <h3 style={{ fontSize: '9px', color: '#ffffff', margin: '0 0 8px 0' }}>CLAIM PORTAL</h3>
              <p style={{ fontSize: '6.5px', color: '#88aacc', lineHeight: 1.6, margin: 0 }}>
                Check snapshot eligibility and claim your unlocked $VIBE rewards with instant on-chain verification.
              </p>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#00ff88', fontSize: '7px', fontWeight: 900 }}>
              <span>CHECK & CLAIM</span>
              <ArrowRight size={11} strokeWidth={2.5} />
            </div>
          </div>

          {/* Card 3: Vibe Club NFT */}
          <div
            onClick={() => onSelectTab && onSelectTab('vibeclub')}
            style={{
              background: 'rgba(4, 20, 48, 0.88)',
              border: '1.5px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '18px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 215, 0, 0.15)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffd700',
                  marginBottom: '12px'
                }}
              >
                <Crown size={20} />
              </div>
              <h3 style={{ fontSize: '9px', color: '#ffd700', margin: '0 0 8px 0' }}>VIBE CLUB NFT</h3>
              <p style={{ fontSize: '6.5px', color: '#88aacc', lineHeight: 1.6, margin: 0 }}>
                Exclusive 1,000 PFP Maltipoo collection on Base. Earn 10,000 $VIBE/month per NFT from the 10M royalty pool.
              </p>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffd700', fontSize: '7px', fontWeight: 900 }}>
              <span>EXPLORE NFT</span>
              <ArrowRight size={11} strokeWidth={2.5} />
            </div>
          </div>

          {/* Card 4: DeFi Swap */}
          <div
            onClick={() => onSelectTab && onSelectTab('buy')}
            style={{
              background: 'rgba(4, 20, 48, 0.88)',
              border: '1.5px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '16px',
              padding: '18px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 245, 255, 0.12)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f5ff',
                  marginBottom: '12px'
                }}
              >
                <ArrowLeftRight size={20} />
              </div>
              <h3 style={{ fontSize: '9px', color: '#ffffff', margin: '0 0 8px 0' }}>DEFI SWAP</h3>
              <p style={{ fontSize: '6.5px', color: '#88aacc', lineHeight: 1.6, margin: 0 }}>
                Instant on-chain decentralized swap on Base Mainnet with automatic best-rate routing.
              </p>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5ff', fontSize: '7px', fontWeight: 900 }}>
              <span>TRADE NOW</span>
              <ArrowRight size={11} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. ABOUT / TRAITS SECTION ── */}
      <section
        style={{
          background: 'rgba(4, 20, 48, 0.88)',
          border: '1.5px solid rgba(0, 245, 255, 0.25)',
          borderRadius: '18px',
          padding: '24px 20px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '11px', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '0.4px' }}>
            MORE THAN A MEME. THE REAL <span style={{ color: '#00f5ff' }}>BASE DOG</span>.
          </h2>
          <p style={{ fontSize: '7px', color: '#88aacc', margin: 0 }}>
            THE FLUFFIEST, MOST LOYAL DOG ONCHAIN & OFFCHAIN
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}
        >
          <div
            style={{
              background: 'rgba(2, 11, 26, 0.75)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>🐶</div>
            <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '4px' }}>
              REAL DOG ENERGY
            </div>
            <div style={{ fontSize: '6.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Inspired by a real Maltipoo — the cutest, most vibing dog alive.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(2, 11, 26, 0.75)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '4px' }}>
              B20 ON BASE
            </div>
            <div style={{ fontSize: '6.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Community-driven standard, fully transparent tokenomics.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(2, 11, 26, 0.75)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>🤝</div>
            <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '4px' }}>
              100% TO HOLDERS
            </div>
            <div style={{ fontSize: '6.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Every vested token distributed to the community — zero team bags.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(2, 11, 26, 0.75)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>🐾</div>
            <div style={{ fontSize: '7.5px', color: '#00f5ff', fontWeight: 900, marginBottom: '4px' }}>
              GOOD VIBES ONLY
            </div>
            <div style={{ fontSize: '6.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Every paw print forward is a step toward the moon.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
