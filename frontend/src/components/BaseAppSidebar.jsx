import React, { useState } from 'react';
import {
  X,
  Gift,
  Coins,
  Crown,
  LogOut,
  Wallet,
  Check,
  Copy,
  User,
  ArrowLeftRight,
  TrendingUp,
  FileCode2,
  ChevronDown,
  ArrowUpRight
} from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useDisconnect } from 'wagmi';

const shortAddress = (a) => (a ? a.slice(0, 6) + '...' + a.slice(-4) : '');

const DEX_ITEMS = [
  {
    name: 'O1 Exchange',
    url: 'https://launch.o1.exchange/token/0xb200000000000000000000df24ecb8bf51100a01?chain=8453'
  },
  {
    name: 'Dexscreener',
    url: 'https://dexscreener.com/base/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5'
  },
  {
    name: 'GeckoTerminal',
    url: 'https://www.geckoterminal.com/uk/base/pools/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5'
  }
];

const TelegramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SOCIAL_ITEMS = [
  {
    name: 'Telegram Channel',
    url: 'https://t.me/vibe_b20',
    icon: <TelegramIcon />
  },
  {
    name: 'Telegram Chat',
    url: 'https://t.me/vibe_b20_chat',
    icon: <TelegramIcon />
  },
  {
    name: 'Follow on X',
    url: 'https://x.com/vibeb20',
    icon: <XIcon />
  },
  {
    name: 'Founder / Developer',
    url: 'https://x.com/mksvibe',
    icon: <XIcon />
  }
];

export function BaseAppSidebar({ isOpen, onClose, activeTab, onSelectTab }) {
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  // Accordion Section States
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(true);
  const [isDocsOpen, setIsDocsOpen] = useState(true);
  const [isDexOpen, setIsDexOpen] = useState(true);
  const [isSocialsOpen, setIsSocialsOpen] = useState(true);

  const activeAddress = user?.wallet?.address || wallets?.[0]?.address || wagmiAddress;
  const hasWallet = (authenticated && !!activeAddress) || (isWagmiConnected && !!wagmiAddress);

  const handleCopy = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect?.();
    logout?.();
    onClose();
  };

  if (!isOpen) return null;

  const appMenuItems = [
    {
      id: 'profile',
      name: 'Profile',
      icon: <User size={13} strokeWidth={2.5} />
    },
    {
      id: 'buy',
      name: 'Swap',
      icon: <ArrowLeftRight size={13} strokeWidth={2.5} />
    },
    {
      id: 'vibeclub',
      name: 'Vibe Club NFT',
      icon: <Crown size={13} strokeWidth={2.5} />,
      isGold: true
    },
    {
      id: 'hub',
      name: 'Rewards Hub',
      icon: <Gift size={13} strokeWidth={2.5} />
    },
    {
      id: 'claim',
      name: 'Claim Portal',
      icon: <Coins size={13} strokeWidth={2.5} />
    }
  ];

  const docsItems = [
    {
      id: 'tokenomics',
      name: 'Tokenomics',
      icon: <TrendingUp size={13} strokeWidth={2.5} />
    },
    {
      id: 'contracts',
      name: 'Contract & Addresses',
      icon: <FileCode2 size={13} strokeWidth={2.5} />
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Sidebar Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '85vw',
          height: '100vh',
          background: '#020b1a',
          borderRight: '1.5px solid rgba(0, 245, 255, 0.25)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 14px calc(20px + env(safe-area-inset-bottom, 0px)) 14px',
          boxSizing: 'border-box',
          fontFamily: "'Press Start 2P', monospace",
          boxShadow: '10px 0 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 245, 255, 0.1)',
          animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          textTransform: 'uppercase',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header with Logo + $VIBE + Close button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(0, 245, 255, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <img
                src="/new-logo-vibe.png"
                alt="VIBE"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1.5px solid #00f5ff',
                  boxShadow: '0 0 10px rgba(0, 245, 255, 0.4)'
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#00f5ff',
                  letterSpacing: '0.5px'
                }}
              >
                $VIBE
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Menu"
              style={{
                background: 'rgba(0, 245, 255, 0.08)',
                border: '1px solid rgba(0, 245, 255, 0.25)',
                borderRadius: '8px',
                color: '#00f5ff',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none'
              }}
            >
              <X size={15} color="#00f5ff" />
            </button>
          </div>

          {/* Navigation Accordion Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* ── SECTION 1: APP MENU ── */}
            <div>
              <div
                onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 6px 6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 800,
                    color: '#88aacc',
                    letterSpacing: '0.5px'
                  }}
                >
                  APP MENU
                </span>
                <ChevronDown
                  size={12}
                  color="#88aacc"
                  style={{
                    transform: isAppMenuOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>

              {isAppMenuOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  {appMenuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isGold = item.isGold;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '7px 9px',
                          borderRadius: '8px',
                          border: isActive
                            ? (isGold ? '1.5px solid #ffd700' : '1.5px solid #00f5ff')
                            : '1px solid rgba(0, 245, 255, 0.08)',
                          background: isActive
                            ? (isGold ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 245, 255, 0.12)')
                            : 'rgba(4, 14, 36, 0.6)',
                          color: isActive
                            ? (isGold ? '#ffd700' : '#00f5ff')
                            : (isGold ? '#e2c542' : '#cbd5e1'),
                          fontSize: '7px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive
                            ? (isGold ? '0 0 10px rgba(255, 215, 0, 0.25)' : '0 0 10px rgba(0, 245, 255, 0.2)')
                            : 'none',
                          fontFamily: "'Press Start 2P', monospace",
                          textTransform: 'uppercase'
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: isActive
                              ? (isGold ? 'rgba(255, 215, 0, 0.25)' : '#0052ff')
                              : 'rgba(0, 245, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive
                              ? (isGold ? '#ffd700' : '#FFFFFF')
                              : (isGold ? '#ffd700' : '#00f5ff'),
                            flexShrink: 0
                          }}
                        >
                          {item.icon}
                        </div>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 2: $VIBE DOCS ── */}
            <div>
              <div
                onClick={() => setIsDocsOpen(!isDocsOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 6px 6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 800,
                    color: '#88aacc',
                    letterSpacing: '0.5px'
                  }}
                >
                  $VIBE DOCS
                </span>
                <ChevronDown
                  size={12}
                  color="#88aacc"
                  style={{
                    transform: isDocsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>

              {isDocsOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  {docsItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '7px 9px',
                          borderRadius: '8px',
                          border: isActive ? '1.5px solid #00f5ff' : '1px solid rgba(0, 245, 255, 0.08)',
                          background: isActive ? 'rgba(0, 245, 255, 0.12)' : 'rgba(4, 14, 36, 0.6)',
                          color: isActive ? '#00f5ff' : '#cbd5e1',
                          fontSize: '7px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 0 10px rgba(0, 245, 255, 0.2)' : 'none',
                          fontFamily: "'Press Start 2P', monospace",
                          textTransform: 'uppercase'
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: isActive ? '#0052ff' : 'rgba(0, 245, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? '#FFFFFF' : '#00f5ff',
                            flexShrink: 0
                          }}
                        >
                          {item.icon}
                        </div>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 3: DEX ── */}
            <div>
              <div
                onClick={() => setIsDexOpen(!isDexOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 6px 6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 800,
                    color: '#88aacc',
                    letterSpacing: '0.5px'
                  }}
                >
                  DEX
                </span>
                <ChevronDown
                  size={12}
                  color="#88aacc"
                  style={{
                    transform: isDexOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>

              {isDexOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  {DEX_ITEMS.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        width: '100%',
                        padding: '7px 9px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 245, 255, 0.08)',
                        background: 'rgba(4, 14, 36, 0.6)',
                        color: '#cbd5e1',
                        fontSize: '7px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Press Start 2P', monospace",
                        textTransform: 'uppercase'
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </span>
                      <ArrowUpRight size={11} color="#88aacc" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── SECTION 4: SOCIALS ── */}
            <div>
              <div
                onClick={() => setIsSocialsOpen(!isSocialsOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 6px 6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 800,
                    color: '#88aacc',
                    letterSpacing: '0.5px'
                  }}
                >
                  SOCIALS
                </span>
                <ChevronDown
                  size={12}
                  color="#88aacc"
                  style={{
                    transform: isSocialsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>

              {isSocialsOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  {SOCIAL_ITEMS.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        width: '100%',
                        padding: '7px 9px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 245, 255, 0.08)',
                        background: 'rgba(4, 14, 36, 0.6)',
                        color: '#cbd5e1',
                        fontSize: '7px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Press Start 2P', monospace",
                        textTransform: 'uppercase'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                        <div style={{ color: '#00f5ff', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                      </div>
                      <ArrowUpRight size={11} color="#88aacc" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer: Wallet status */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(0, 245, 255, 0.15)', marginTop: '16px' }}>
          {hasWallet ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  background: 'rgba(4, 14, 36, 0.9)',
                  border: '1.5px solid rgba(0, 245, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src="/new-logo-vibe.png"
                    alt="avatar"
                    style={{ width: '18px', height: '18px', borderRadius: '4px' }}
                  />
                  <span style={{ fontSize: '7px', fontWeight: 900, color: '#00ff88' }}>
                    {shortAddress(activeAddress)}
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  title="Copy address"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#00ff88' : '#00f5ff',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>

              <button
                onClick={handleDisconnect}
                style={{
                  width: '100%',
                  background: 'rgba(255, 68, 102, 0.12)',
                  border: '1.5px solid rgba(255, 68, 102, 0.35)',
                  color: '#ff4466',
                  borderRadius: '8px',
                  padding: '9px 10px',
                  fontSize: '7px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Press Start 2P', monospace",
                  textTransform: 'uppercase'
                }}
              >
                <LogOut size={11} />
                <span>DISCONNECT</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                login();
                onClose();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #00f5ff, #0050ff)',
                color: '#FFFFFF',
                border: '1.5px solid #ffffff',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '7.5px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow: '0 0 14px rgba(0, 245, 255, 0.4)',
                fontFamily: "'Press Start 2P', monospace",
                textTransform: 'uppercase'
              }}
            >
              <Wallet size={13} strokeWidth={2.5} />
              <span>CONNECT WALLET</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
