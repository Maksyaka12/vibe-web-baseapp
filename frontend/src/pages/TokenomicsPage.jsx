import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Users, Clock, Calculator, Gamepad2, Coins, Crown, ShieldCheck, Gift, ArrowRightCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { parseAbiItem, formatUnits } from 'viem';
import { publicClient } from '../config/rpc';

const CA = '0xb200000000000000000000df24ecb8bf51100a01';
const BUYBACK_WALLET = '0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf';
const BURN_WALLET = '0x000000000000000000000000000000000000dEaD';
const CONST_TOTAL_BUYBACK = 8441747.16191129 + 585682 + 2822654 + 2070000 + 422000 + 2250000 + 1421729 + 2602000 + 2684253 + 3578868 + 2889541 + 1455000;
const CONST_DISTRIBUTED = 920000;
const REVENUE_STATS_CACHE_KEY = 'vibe_revenue_stats_cache_v2';

const UNLOCKS = [
  { d: 'Aug 26, 2026', a: '10M', iso: '2026-08-26T14:00:00Z' },
  { d: 'Sep 25, 2026', a: '10M', iso: '2026-09-25T14:00:00Z' },
  { d: 'Oct 25, 2026', a: '10M', iso: '2026-10-25T14:00:00Z' },
  { d: 'Nov 24, 2026', a: '10M', iso: '2026-11-24T14:00:00Z' },
  { d: 'Dec 24, 2026', a: '10M', iso: '2026-12-24T14:00:00Z' },
  { d: 'Jan 23, 2027', a: '10M', iso: '2027-01-23T14:00:00Z' },
  { d: 'Feb 22, 2027', a: '10M', iso: '2027-02-22T14:00:00Z' },
  { d: 'Mar 24, 2027', a: '10M', iso: '2027-03-24T14:00:00Z' },
  { d: 'Apr 23, 2027', a: '10M', iso: '2027-04-23T14:00:00Z' },
  { d: 'May 23, 2027', a: '10M', iso: '2027-05-23T14:00:00Z' },
];

const formatRevenueNumber = (numStr) => {
  const num = parseFloat(numStr);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
};

const getInitialRevenueStats = () => {
  const fallbackStats = {
    totalBurned: '28.05M',
    totalBurnedNum: 28052274,
    communityRewards: '12.25M',
    totalBuybacks: formatRevenueNumber(CONST_TOTAL_BUYBACK),
    distributedRewards: formatRevenueNumber(CONST_DISTRIBUTED),
    loading: false
  };

  if (typeof window === 'undefined') return fallbackStats;
  try {
    const cached = localStorage.getItem(REVENUE_STATS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.totalBurned && parsed.totalBuybacks && parsed.totalBurned !== '...') {
        return {
          ...fallbackStats,
          ...parsed,
          loading: false
        };
      }
    }
  } catch (e) {}
  return fallbackStats;
};

export function useRevenueStats() {
  const [stats, setStats] = useState(getInitialRevenueStats);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const abiBalance = parseAbiItem('function balanceOf(address account) view returns (uint256)');
        
        const [burnedRaw, rewardsRaw] = await Promise.all([
          publicClient.readContract({ address: CA, abi: [abiBalance], functionName: 'balanceOf', args: [BURN_WALLET] }),
          publicClient.readContract({ address: CA, abi: [abiBalance], functionName: 'balanceOf', args: [BUYBACK_WALLET] })
        ]);

        const burnedNum = parseFloat(formatUnits(burnedRaw, 18));
        const newStats = {
          totalBurned: formatRevenueNumber(burnedNum),
          totalBurnedNum: burnedNum,
          communityRewards: formatRevenueNumber(formatUnits(rewardsRaw, 18)),
          totalBuybacks: formatRevenueNumber(CONST_TOTAL_BUYBACK),
          distributedRewards: formatRevenueNumber(CONST_DISTRIBUTED),
          loading: false
        };

        if (mounted) {
          setStats(newStats);
          try {
            localStorage.setItem(REVENUE_STATS_CACHE_KEY, JSON.stringify(newStats));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Notice: Live stats fallback used', err);
        if (mounted) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    }
    fetchStats();
    return () => { mounted = false; };
  }, []);

  return stats;
}

export default function TokenomicsPage({ isBaseAppMode = false }) {
  const { totalBurned, totalBurnedNum, totalBuybacks, communityRewards, loading } = useRevenueStats();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#vesting-details') {
      const scrollToVesting = () => {
        const el = document.getElementById('vesting-details');
        if (el) {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = scrollTop + rect.top - 80;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      };
      scrollToVesting();
      const timer = setTimeout(scrollToVesting, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  const now = new Date();
  const unlockedCount = UNLOCKS.filter(u => new Date(u.d) <= now).length;
  const unlockedTokens = unlockedCount * 10_000_000;
  
  const baseCirculating = 900_000_000;
  const currentCirculating = baseCirculating + unlockedTokens - (totalBurnedNum || 0);
  const currentTotalSupply = 1_000_000_000 - (totalBurnedNum || 0);
  
  const formatSupply = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const circulatingStr = loading ? <Loader2 size={20} className="spin"/> : formatSupply(currentCirculating);
  const totalSupplyStr = loading ? <Loader2 size={20} className="spin"/> : (totalBurnedNum > 0 ? formatSupply(currentTotalSupply) : '1B');

  const hubLink = isBaseAppMode ? '/app/hub' : '/hub';
  const vibeClubLink = isBaseAppMode ? '/app/vibeclub' : 'https://vibeverse.dog/vibeclub';

  return (
    <section id="tokenomics" className="alt" style={isBaseAppMode ? { padding: '16px 12px 60px 12px', background: 'transparent' } : {}}>
      <div className="wrap" style={isBaseAppMode ? { maxWidth: '780px', margin: '0 auto', padding: 0 } : {}}>
        
        {/* BLOCK 1: TOKENOMICS INFO */}
        <div className="sec-head" style={{ marginBottom: '32px', textAlign: 'center' }}>
          {isBaseAppMode ? (
            <>
              <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', letterSpacing: '0.6px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.3 }}>
                $VIBE <span style={{ color: '#00f5ff' }}>TOKENOMICS</span>
              </h2>
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
                  boxSizing: 'border-box',
                  marginBottom: '14px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', flexShrink: 0 }} />
                <span style={{ fontSize: '6.5px', color: '#00f5ff', letterSpacing: '0.5px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
                  FAIR LAUNCH · 100% COMMUNITY DISTRIBUTION
                </span>
              </div>
              <p style={{ fontSize: '7.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 auto', maxWidth: '540px' }}>
                Fair launch via o1.exchange. Zero BS. No team allocations. No insider buys.
              </p>
            </>
          ) : (
            <>
              <h2>$VIBE <span className="bl">Tokenomics</span>.</h2>
              <p className="sec-sub">Fair launch via o1.exchange. $VIBE B20 launch time was publicly announced in advance. Zero BS. No team allocations. No insider buys.</p>
            </>
          )}
        </div>
        
        <div className="stat-tiles wide-stats" style={{ marginBottom: '50px' }}>
          <div className="stile">
            <span className="v">{totalSupplyStr}</span>
            <span className="l">Total Supply</span>
            {!loading && totalBurnedNum > 0 && (
              <div className="d" style={{ marginTop: '8px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontWeight: '800',
                  lineHeight: '1'
                }}>
                  <Flame size={14} strokeWidth={2.5} /> {totalBurned}
                </span>
              </div>
            )}
          </div>
          <div className="stile">
            <span className="v">{circulatingStr}</span>
            <span className="l">Circulating</span>
            {!loading && totalBurnedNum > 0 && (
              <div className="d" style={{ marginTop: '8px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontWeight: '800',
                  lineHeight: '1'
                }}>
                  <Flame size={14} strokeWidth={2.5} /> {totalBurned}
                </span>
              </div>
            )}
          </div>
          <div className="stile"><span className="v">100M</span><span className="l">Vesting Community Rewards</span><div className="d">10% unlocks monthly</div></div>
          <div className="stile"><span className="v">10M</span><span className="l">Monthly Unlock</span><div className="d">Straight to holders</div></div>
        </div>

        {/* BLOCK 2: REVENUE ECONOMY */}
        <div className="sec-head" style={{ marginBottom: '32px', marginTop: '40px', textAlign: 'center' }}>
          {isBaseAppMode ? (
            <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '0.6px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.3 }}>
              REVENUE <span style={{ color: '#00f5ff' }}>ECONOMY</span>
            </h2>
          ) : (
            <h2>Revenue <span className="bl">Economy</span>.</h2>
          )}
          <p className="sec-sub" style={isBaseAppMode ? { fontSize: '7.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 auto', maxWidth: '540px' } : {}}>
            Creator Revenue is going towards buybacks and actions aimed at strengthening the token economy, driving long-term value for all holders.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px', marginBottom: '50px' }}>
          
          {/* Left Side: Stat Tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              <div className="stile" style={{ margin: 0, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="v">{loading ? <Loader2 size={24} className="spin"/> : totalBuybacks}</span>
                <span className="l">Total Buyback</span>
              </div>
              <div className="stile" style={{ margin: 0, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="v" style={{ color: '#ef4444' }}>{loading ? <Loader2 size={24} className="spin"/> : totalBurned}</span>
                <span className="l">Total Burned</span>
              </div>
            </div>

            {/* Thinner Full-Width Card 1: Reserved for Community */}
            <div className="stile rev-thin-card">
              <span className="rev-thin-label">Reserved for Community:</span>
              <span className="rev-thin-val">
                {loading ? <Loader2 size={20} className="spin"/> : communityRewards}
              </span>
            </div>

            {/* Thinner Full-Width Card 2: Buyback & Burn & Rewards Address + View on Basescan */}
            <div className="stile rev-thin-card">
              <span className="rev-thin-label">
                Buyback & Burn & Rewards Address
              </span>
              <a
                href="https://basescan.org/token/0xb200000000000000000000df24ecb8bf51100a01?a=0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf#transactions"
                target="_blank"
                rel="noopener noreferrer"
                className="rev-basescan-btn"
              >
                <span>View on Basescan</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Right Side: Buyback Program */}
          <div className="tok-card" style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <h3 style={{ fontSize: isBaseAppMode ? '14px' : '1.25rem', fontWeight: 800, marginBottom: '4px', color: 'var(--ink)' }}>Buyback Program</h3>
              <p className="sub" style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>Strategic utilization of revenue generated.</p>
            </div>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '16px auto 8px', flexShrink: 0 }}>
              <svg viewBox="0 0 420 280" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="burnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff5f5f" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#0052ff" />
                  </linearGradient>

                  <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.25" />
                  </filter>
                  <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0052ff" floodOpacity="0.25" />
                  </filter>
                </defs>

                <g transform="translate(210, 140)">
                  <circle cx="0" cy="0" r="80" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#blueGradient)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="65 100" strokeDashoffset="-2.5"
                          transform="rotate(-90)" filter="url(#blueGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#burnGradient)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="25 100" strokeDashoffset="-72.5"
                          transform="rotate(-90)" filter="url(#redGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="-65" cy="-47" r="4" fill="#ef4444" />
                  <polyline points="-65,-47 -95,-70 -125,-70" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="-130" y="-64" fill="#ef4444" fontSize="13" fontWeight="800" textAnchor="end">Burn 30%</text>

                  <circle cx="47" cy="65" r="4" fill="#0052ff" />
                  <polyline points="47,65 75,90 115,90" fill="none" stroke="#0052ff" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="122" y="84" fill="#0052ff" fontSize="13" fontWeight="800" textAnchor="start">Reserved for</text>
                  <text x="122" y="99" fill="#0052ff" fontSize="13" fontWeight="800" textAnchor="start">Community 70%</text>

                  <text x="0" y="-3" fill="var(--ink)" fontSize="30" fontWeight="900" textAnchor="middle" letterSpacing="-0.5px">100%</text>
                  <text x="0" y="18" fill="var(--muted)" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="1.5px">BUYBACKS</text>
                </g>
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>
                <Flame size={14} /> Burn 30%
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 82, 255, 0.08)', border: '1px solid rgba(0, 82, 255, 0.2)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--blue)' }}>
                <Users size={14} /> Community 70%
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 3: REWARDS ECONOMY */}
        <div className="sec-head" style={{ marginBottom: '32px', marginTop: '50px', textAlign: 'center' }}>
          {isBaseAppMode ? (
            <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '0.6px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.3 }}>
              REWARDS <span style={{ color: '#00f5ff' }}>ECONOMY</span>
            </h2>
          ) : (
            <h2>Rewards <span className="bl">Economy</span>.</h2>
          )}
          <p className="sec-sub" style={isBaseAppMode ? { fontSize: '7.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 auto', maxWidth: '540px' } : {}}>
            Constitutes the 70% reserved for the community in the Buyback Program.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px', marginBottom: '50px' }}>
          
          {/* Left Side: Unified Distribution Breakdown Block */}
          <div className="tok-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: isBaseAppMode ? '14px' : '1.25rem' }}>Distribution Breakdown</h3>

              <div className="who">
                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock color="#7c3aed" size={20} />
                  </div>
                  <div className="who-t">
                    10-Day Rolling Epochs
                    <span>Reward distribution across all pools happens every 10 days</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calculator color="var(--blue)" size={20} />
                  </div>
                  <div className="who-t">
                    Epoch Allocation Size
                    <span>Equals the designated percentage of the total Community Rewards Pool</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gamepad2 color="#3b82f6" size={20} />
                  </div>
                  <div className="who-t">
                    VibeVerse App <span style={{ color: '#3b82f6', fontWeight: 900, display: 'inline', marginLeft: '4px' }}>(30%)</span>
                    <span>Rewards pool inside the upcoming Vibe Verse App</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins color="#a855f7" size={20} />
                  </div>
                  <div className="who-t">
                    $VIBE Staking <span style={{ color: '#a855f7', fontWeight: 900, display: 'inline', marginLeft: '4px' }}>(15%)</span>
                    <span>Yield for locking $VIBE in verified staking pool on o1</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Crown color="#10b981" size={20} />
                  </div>
                  <div className="who-t">
                    Vibe Club NFTs <span style={{ color: '#10b981', fontWeight: 900, display: 'inline', marginLeft: '4px' }}>(15%)</span>
                    <span>Direct royalties for holders of the 333 Vibe Club NFTs</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck color="#f59e0b" size={20} />
                  </div>
                  <div className="who-t">
                    Reserve <span style={{ color: '#f59e0b', fontWeight: 900, display: 'inline', marginLeft: '4px' }}>(40%)</span>
                    <span>Buffer for continuous reward refills and marketing</span>
                  </div>
                </div>

                <Link to={hubLink} className="who-r" style={{ textDecoration: 'none', cursor: 'pointer', background: 'var(--blue)' }}>
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gift color="#fff" size={20} />
                  </div>
                  <div className="who-t" style={{ color: '#fff' }}>
                    Explore Rewards Hub
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Track available rewards <ArrowRightCircle size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side: Donut Chart */}
          <div className="tok-card" style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <h3 style={{ fontSize: isBaseAppMode ? '14px' : '1.25rem', fontWeight: 800, marginBottom: '4px', color: 'var(--ink)' }}>Community Pool Distribution</h3>
              <p className="sub" style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>Allocation of the 70% Revenue Share (Normalized to 100%).</p>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '16px auto 8px', flexShrink: 0 }}>
              <svg viewBox="0 0 420 280" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="commBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#0052ff" />
                  </linearGradient>
                  <linearGradient id="commPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="commGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="commAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  <filter id="commBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0052ff" floodOpacity="0.25" />
                  </filter>
                  <filter id="commPurpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#7c3aed" floodOpacity="0.25" />
                  </filter>
                  <filter id="commGreenGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#10b981" floodOpacity="0.25" />
                  </filter>
                  <filter id="commAmberGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#f59e0b" floodOpacity="0.25" />
                  </filter>
                </defs>

                <g transform="translate(210, 140)">
                  <circle cx="0" cy="0" r="80" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#commBlueGrad)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="26 100" strokeDashoffset="-2"
                          transform="rotate(-90)" filter="url(#commBlueGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#commPurpleGrad)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="11 100" strokeDashoffset="-32"
                          transform="rotate(-90)" filter="url(#commPurpleGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#commGreenGrad)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="11 100" strokeDashoffset="-47"
                          transform="rotate(-90)" filter="url(#commGreenGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#commAmberGrad)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="36 100" strokeDashoffset="-62"
                          transform="rotate(-90)" filter="url(#commAmberGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="65" cy="-47" r="4" fill="#0052ff" />
                  <polyline points="65,-47 95,-70 125,-70" fill="none" stroke="#0052ff" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="130" y="-64" fill="#0052ff" fontSize="12" fontWeight="800" textAnchor="start">VibeVerse 30%</text>

                  <circle cx="57" cy="57" r="4" fill="#7c3aed" />
                  <polyline points="57,57 85,80 115,80" fill="none" stroke="#7c3aed" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="120" y="85" fill="#7c3aed" fontSize="12" fontWeight="800" textAnchor="start">Staking 15%</text>

                  <circle cx="-13" cy="79" r="4" fill="#10b981" />
                  <polyline points="-13,79 -40,95 -80,95" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="-85" y="100" fill="#10b981" fontSize="12" fontWeight="800" textAnchor="end">NFT Club 15%</text>

                  <circle cx="-76" cy="-25" r="4" fill="#f59e0b" />
                  <polyline points="-76,-25 -105,-55 -135,-55" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="-140" y="-49" fill="#f59e0b" fontSize="12" fontWeight="800" textAnchor="end">Reserve 40%</text>

                  <text x="0" y="-3" fill="var(--ink)" fontSize="28" fontWeight="900" textAnchor="middle" letterSpacing="-0.5px">100%</text>
                  <text x="0" y="16" fill="var(--muted)" fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="1px">COMMUNITY</text>
                </g>
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0, 82, 255, 0.08)', border: '1px solid rgba(0, 82, 255, 0.2)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--blue)' }}>
                <Gamepad2 size={13} /> VibeVerse 30%
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed' }}>
                <Coins size={13} /> Staking 15%
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>
                <Crown size={13} /> NFT Club 15%
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b' }}>
                <ShieldCheck size={13} /> Reserve 40%
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 4: VIBE CLUB ECONOMY */}
        <div className="sec-head" style={{ marginBottom: '32px', marginTop: '50px', textAlign: 'center' }}>
          {isBaseAppMode ? (
            <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '0.6px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.3 }}>
              VIBE CLUB <span style={{ color: '#ffd700' }}>ECONOMY</span>
            </h2>
          ) : (
            <h2>Vibe Club <span className="bl">Economy</span>.</h2>
          )}
          <p className="sec-sub" style={isBaseAppMode ? { fontSize: '7.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: '0 auto', maxWidth: '540px' } : {}}>
            Official $VIBE NFT collection fully integrated into B20 economy.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          {/* Left Side: Vibe Club Breakdown */}
          <div className="tok-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: isBaseAppMode ? '14px' : '1.25rem' }}>Vibe Club Breakdown</h3>

              <div className="who">
                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame color="#ef4444" size={20} />
                  </div>
                  <div className="who-t">
                    Deflationary Mint Burn
                    <span>Every mint triggers an instant burn, reducing total $VIBE supply</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Crown color="#10b981" size={20} />
                  </div>
                  <div className="who-t">
                    NFTs Utility
                    <span>Holders receive regular royalty payouts distributed every 10 days</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins color="#7c3aed" size={20} />
                  </div>
                  <div className="who-t">
                    Mint Process
                    <span>Minting is available with both ETH and native $VIBE tokens</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck color="#f59e0b" size={20} />
                  </div>
                  <div className="who-t">
                    Limited 333 Supply
                    <span>Strictly capped 333 NFTs with lifetime community benefits</span>
                  </div>
                </div>

                <div className="who-r">
                  <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users color="var(--blue)" size={20} />
                  </div>
                  <div className="who-t">
                    Equal Holder Rewards
                    <span>All 333 NFTs are equal, ensuring every holder receives identical royalty rewards</span>
                  </div>
                </div>

                {isBaseAppMode ? (
                  <Link to="/app/vibeclub" className="who-r" style={{ textDecoration: 'none', cursor: 'pointer', background: 'var(--blue)' }}>
                    <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown color="#fff" size={20} />
                    </div>
                    <div className="who-t" style={{ color: '#fff' }}>
                      Join Vibe Club
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Mint your NFT <ArrowUpRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      </span>
                    </div>
                  </Link>
                ) : (
                  <a href={vibeClubLink} target="_blank" rel="noreferrer" className="who-r" style={{ textDecoration: 'none', cursor: 'pointer', background: 'var(--blue)' }}>
                    <div className="who-ico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown color="#fff" size={20} />
                    </div>
                    <div className="who-t" style={{ color: '#fff' }}>
                      Join Vibe Club
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Mint your NFT <ArrowUpRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      </span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Mint Revenue Donut Chart */}
          <div className="tok-card" style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <h3 style={{ fontSize: isBaseAppMode ? '14px' : '1.25rem', fontWeight: 800, marginBottom: '4px', color: 'var(--ink)' }}>Mint Revenue Allocation</h3>
              <p className="sub" style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>Utilization of revenue collected from the Vibe Club NFT mint.</p>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '16px auto 8px', flexShrink: 0 }}>
              <svg viewBox="0 0 420 280" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="nftBurnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff5f5f" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="nftBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#0052ff" />
                  </linearGradient>

                  <filter id="nftRedGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.25" />
                  </filter>
                  <filter id="nftBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0052ff" floodOpacity="0.25" />
                  </filter>
                </defs>

                <g transform="translate(210, 140)">
                  <circle cx="0" cy="0" r="80" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#nftBlueGrad)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="15 100" strokeDashoffset="-2.5"
                          transform="rotate(-90)" filter="url(#nftBlueGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="0" cy="0" r="80" fill="none" stroke="url(#nftBurnGrad)" strokeWidth="18"
                          strokeLinecap="round" pathLength="100" strokeDasharray="75 100" strokeDashoffset="-22.5"
                          transform="rotate(-90)" filter="url(#nftRedGlow)" style={{ transition: 'all 0.5s ease' }} />

                  <circle cx="47" cy="65" r="4" fill="#0052ff" />
                  <polyline points="47,65 75,90 115,90" fill="none" stroke="#0052ff" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="122" y="84" fill="#0052ff" fontSize="13" fontWeight="800" textAnchor="start">Reserved for</text>
                  <text x="122" y="99" fill="#0052ff" fontSize="13" fontWeight="800" textAnchor="start">Community 20%</text>

                  <circle cx="-65" cy="-47" r="4" fill="#ef4444" />
                  <polyline points="-65,-47 -95,-70 -125,-70" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="-130" y="-64" fill="#ef4444" fontSize="13" fontWeight="800" textAnchor="end">Burn 80%</text>

                  <text x="0" y="-3" fill="var(--ink)" fontSize="30" fontWeight="900" textAnchor="middle" letterSpacing="-0.5px">100%</text>
                  <text x="0" y="18" fill="var(--muted)" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="1.5px">MINT REVENUE</text>
                </g>
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>
                <Flame size={14} /> Burn 80%
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 82, 255, 0.08)', border: '1px solid rgba(0, 82, 255, 0.2)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--blue)' }}>
                <Users size={14} /> Community 20%
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
