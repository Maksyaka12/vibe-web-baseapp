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
  ArrowUpRight,
  Home,
  ShieldCheck
} from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useDisconnect } from 'wagmi';

const ADMIN_WALLET = '0x4c91d3bed372c11795b9ce9a9017dfe447bf050a';

const shortAddress = (a) => (a ? a.slice(0, 6) + '...' + a.slice(-4) : '');

const DEX_ITEMS = [
  {
    name: 'O1 Exchange',
    shortName: 'O1',
    url: 'https://launch.o1.exchange/token/0xb200000000000000000000df24ecb8bf51100a01?chain=8453',
    logo: '/o1-logo.png'
  },
  {
    name: 'Dexscreener',
    shortName: 'DEX',
    url: 'https://dexscreener.com/base/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5',
    logo: '/dexscreener-logo.jpg'
  },
  {
    name: 'GeckoTerminal',
    shortName: 'GECKO',
    url: 'https://www.geckoterminal.com/uk/base/pools/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5',
    logo: '/geckoterminal-logo.jpg'
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

// Sidebar Toggle Icon matching Happy Hour design (Panel toggle)
const SidebarToggleIcon = ({ isCollapsed }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const SOCIAL_ITEMS = [
  {
    name: 'Telegram Channel',
    shortName: 'TG Channel',
    url: 'https://t.me/vibe_b20',
    icon: <TelegramIcon />
  },
  {
    name: 'Telegram Chat',
    shortName: 'TG Chat',
    url: 'https://t.me/vibe_b20_chat',
    icon: <TelegramIcon />
  },
  {
    name: 'Follow on X',
    shortName: 'X',
    url: 'https://x.com/vibeb20',
    icon: <XIcon />
  }
];

export function BaseAppSidebar({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
  isDesktop = false
}) {
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
  const isAdmin = hasWallet && !!activeAddress && activeAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const handleCopy = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect?.();
    logout?.();
    if (!isDesktop) onClose();
  };

  // If mobile and not open, don't render
  if (!isDesktop && !isOpen) return null;

  const appMenuItems = [
    {
      id: 'profile',
      name: 'Profile',
      icon: <User size={isDesktop ? 15 : 13} strokeWidth={2.5} />
    },
    {
      id: 'buy',
      name: 'Swap',
      icon: <ArrowLeftRight size={isDesktop ? 15 : 13} strokeWidth={2.5} />
    },
    {
      id: 'vibeclub',
      name: 'Vibe Club NFT',
      icon: <Crown size={isDesktop ? 15 : 13} strokeWidth={2.5} />,
      isGold: true
    },
    {
      id: 'hub',
      name: 'Rewards Hub',
      icon: <Gift size={isDesktop ? 15 : 13} strokeWidth={2.5} />
    },
    {
      id: 'claim',
      name: 'Claim Portal',
      icon: <Coins size={isDesktop ? 15 : 13} strokeWidth={2.5} />
    }
  ];

  const docsItems = [
    {
      id: 'tokenomics',
      name: 'Tokenomics',
      icon: <TrendingUp size={isDesktop ? 15 : 13} strokeWidth={2.5} />
    },
    {
      id: 'contracts',
      name: 'Official Addresses',
      icon: <FileCode2 size={isDesktop ? 15 : 13} strokeWidth={2.5} />
    }
  ];

  const sidebarWidth = isDesktop ? (isCollapsed ? '72px' : '290px') : '280px';

  return (
    <>
      {/* Mobile Backdrop */}
      {!isDesktop && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            
            
            zIndex: 999998,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`base-app-sidebar ${isDesktop ? (isCollapsed ? 'collapsed' : 'expanded') : 'mobile-drawer'}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarWidth,
          maxWidth: isDesktop ? 'none' : '85vw',
          height: '100vh',
          background: 'var(--bg)',
          borderRight: '1.5px solid color-mix(in srgb, var(--accent) 22%, transparent)',
          zIndex: isDesktop ? 60 : 999999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isCollapsed
            ? '16px 8px calc(20px + env(safe-area-inset-bottom, 0px)) 8px'
            : isDesktop
              ? '18px 14px calc(20px + env(safe-area-inset-bottom, 0px)) 14px'
              : '16px 14px calc(20px + env(safe-area-inset-bottom, 0px)) 14px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans)',
          
          animation: isDesktop ? 'none' : 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: isDesktop ? 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease' : 'none',
          
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? '18px' : '16px' }}>
          
          {/* Header with Logo + $VIBE + Toggle / Close button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              paddingBottom: isDesktop ? '16px' : '14px',
              borderBottom: '1.5px solid color-mix(in srgb, var(--accent) 18%, transparent)',
              minHeight: '40px'
            }}
          >
            {isCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img
                  src="/new-logo-vibe.png"
                  alt="VIBE"
                  title="$VIBE"
                  onClick={() => onSelectTab('hub')}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1.5px solid var(--accent)',
                    
                    cursor: 'pointer'
                  }}
                />
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    title="Expand Sidebar"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                      borderRadius: '6px',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <SidebarToggleIcon isCollapsed={true} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  onClick={() => {
                    onSelectTab('hub');
                    if (!isDesktop) onClose();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                >
                  <img
                    src="/new-logo-vibe.png"
                    alt="VIBE"
                    style={{
                      width: isDesktop ? '32px' : '28px',
                      height: isDesktop ? '32px' : '28px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1.5px solid var(--accent)',
                      }}
                  />
                  <span
                    style={{
                      fontSize: isDesktop ? '13px' : '11px',
                      fontWeight: 900,
                      color: 'var(--accent)',
                      letterSpacing: '0.6px'
                    }}
                  >
                    $VIBE HUB
                  </span>
                </div>

                {/* Right button in Header: Collapse button on desktop OR Close button on mobile */}
                {isDesktop ? (
                  <button
                    onClick={onToggleCollapse}
                    title="Collapse Sidebar"
                    aria-label="Toggle Sidebar"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                      borderRadius: '8px',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <SidebarToggleIcon isCollapsed={false} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    aria-label="Close Menu"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                      borderRadius: '8px',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    <X size={15} color="var(--accent)" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Navigation Accordion Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '10px' : (isDesktop ? '16px' : '14px') }}>
            
            {/* ── SECTION 1: APP MENU ── */}
            <div>
              {!isCollapsed && (
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
                      fontSize: isDesktop ? '8.5px' : '7.5px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      letterSpacing: '0.6px'
                    }}
                  >
                    APP MENU
                  </span>
                  <ChevronDown
                    size={isDesktop ? 13 : 12}
                    color="var(--accent)"
                    style={{
                      transform: isAppMenuOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>
              )}

              {(isCollapsed || isAppMenuOpen) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? '6px' : '5px', marginTop: isCollapsed ? '0' : '4px' }}>
                  {appMenuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isGold = item.isGold;
                    return (
                      <button
                        key={item.id}
                        title={item.name}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (!isDesktop) onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isCollapsed ? 'center' : 'flex-start',
                          gap: isDesktop ? '10px' : '8px',
                          width: '100%',
                          padding: isCollapsed ? '8px 0' : (isDesktop ? '9px 11px' : '7px 9px'),
                          borderRadius: '10px',
                          border: isActive
                            ? (isGold ? '1.5px solid var(--amber)' : '1.5px solid var(--accent)')
                            : '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
                          background: isActive
                            ? (isGold ? 'color-mix(in srgb, var(--amber) 15%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)')
                            : 'color-mix(in srgb, var(--surface) 60%, transparent)',
                          color: isActive
                            ? (isGold ? 'var(--amber)' : 'var(--accent)')
                            : (isGold ? 'var(--amber)' : 'var(--text-2)'),
                          fontSize: isDesktop ? '8.5px' : '7px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          
                          fontFamily: 'var(--font-sans)',
                          }}
                      >
                        <div
                          style={{
                            width: isDesktop ? '26px' : '22px',
                            height: isDesktop ? '26px' : '22px',
                            borderRadius: '6px',
                            background: isActive
                              ? (isGold ? 'color-mix(in srgb, var(--amber) 25%, transparent)' : 'var(--accent)')
                              : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive
                              ? (isGold ? 'var(--amber)' : 'var(--text)')
                              : (isGold ? 'var(--amber)' : 'var(--accent)'),
                            flexShrink: 0
                          }}
                        >
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 2: $VIBE DOCS ── */}
            <div>
              {!isCollapsed && (
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
                      fontSize: isDesktop ? '8.5px' : '7.5px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      letterSpacing: '0.6px'
                    }}
                  >
                    $VIBE DOCS
                  </span>
                  <ChevronDown
                    size={isDesktop ? 13 : 12}
                    color="var(--accent)"
                    style={{
                      transform: isDocsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>
              )}

              {(isCollapsed || isDocsOpen) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? '6px' : '5px', marginTop: isCollapsed ? '0' : '4px' }}>
                  {docsItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        title={item.name}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (!isDesktop) onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isCollapsed ? 'center' : 'flex-start',
                          gap: isDesktop ? '10px' : '8px',
                          width: '100%',
                          padding: isCollapsed ? '8px 0' : (isDesktop ? '9px 11px' : '7px 9px'),
                          borderRadius: '10px',
                          border: isActive ? '1.5px solid var(--accent)' : '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
                          background: isActive ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'color-mix(in srgb, var(--surface) 60%, transparent)',
                          color: isActive ? 'var(--accent)' : 'var(--text-2)',
                          fontSize: isDesktop ? '8.5px' : '7px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          
                          fontFamily: 'var(--font-sans)',
                          }}
                      >
                        <div
                          style={{
                            width: isDesktop ? '26px' : '22px',
                            height: isDesktop ? '26px' : '22px',
                            borderRadius: '6px',
                            background: isActive ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? 'var(--text)' : 'var(--accent)',
                            flexShrink: 0
                          }}
                        >
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 3: DEX ── */}
            <div>
              {!isCollapsed && (
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
                      fontSize: isDesktop ? '8.5px' : '7.5px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      letterSpacing: '0.6px'
                    }}
                  >
                    DEX
                  </span>
                  <ChevronDown
                    size={isDesktop ? 13 : 12}
                    color="var(--accent)"
                    style={{
                      transform: isDexOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>
              )}

              {(isCollapsed || isDexOpen) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? '6px' : '5px', marginTop: isCollapsed ? '0' : '4px' }}>
                  {DEX_ITEMS.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'space-between',
                        gap: '8px',
                        width: '100%',
                        padding: isCollapsed ? '8px 0' : (isDesktop ? '9px 11px' : '7px 9px'),
                        borderRadius: '10px',
                        border: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
                        background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
                        color: 'var(--text-2)',
                        fontSize: isDesktop ? '8px' : '7px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                        fontFamily: 'var(--font-sans)',
                        }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? '9px' : '7px', overflow: 'hidden' }}>
                        <img
                          src={item.logo}
                          alt={item.name}
                          style={{
                            width: isDesktop ? '16px' : '14px',
                            height: isDesktop ? '16px' : '14px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                        {!isCollapsed && (
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ArrowUpRight size={12} color="var(--text-3)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── SECTION 4: SOCIALS ── */}
            <div>
              {!isCollapsed && (
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
                      fontSize: isDesktop ? '8.5px' : '7.5px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      letterSpacing: '0.6px'
                    }}
                  >
                    SOCIALS
                  </span>
                  <ChevronDown
                    size={isDesktop ? 13 : 12}
                    color="var(--accent)"
                    style={{
                      transform: isSocialsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>
              )}

              {(isCollapsed || isSocialsOpen) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? '6px' : '5px', marginTop: isCollapsed ? '0' : '4px' }}>
                  {SOCIAL_ITEMS.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'space-between',
                        gap: '8px',
                        width: '100%',
                        padding: isCollapsed ? '8px 0' : (isDesktop ? '9px 11px' : '7px 9px'),
                        borderRadius: '10px',
                        border: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
                        background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
                        color: 'var(--text-2)',
                        fontSize: isDesktop ? '8px' : '7px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                        fontFamily: 'var(--font-sans)',
                        }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? '9px' : '7px', overflow: 'hidden' }}>
                        <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ArrowUpRight size={12} color="var(--text-3)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer: Wallet status & Admin Panel */}
        <div style={{ paddingTop: '16px', borderTop: '1.5px solid color-mix(in srgb, var(--accent) 18%, transparent)', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Admin Panel (Only visible to Admin Wallet) */}
          {isAdmin && (
            isCollapsed ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    onSelectTab('admin');
                    if (!isDesktop) onClose();
                  }}
                  title="Admin Panel"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: activeTab === 'admin' ? 'color-mix(in srgb, var(--red) 25%, transparent)' : 'color-mix(in srgb, var(--surface) 60%, transparent)',
                    border: activeTab === 'admin' ? '1.5px solid var(--red)' : '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
                    color: 'var(--red)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldCheck size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onSelectTab('admin');
                  if (!isDesktop) onClose();
                }}
                title="Admin Panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isDesktop ? '10px' : '8px',
                  width: '100%',
                  padding: isCollapsed ? '8px 0' : (isDesktop ? '9px 11px' : '7px 9px'),
                  borderRadius: '10px',
                  border: activeTab === 'admin' ? '1.5px solid var(--red)' : '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
                  background: activeTab === 'admin' ? 'color-mix(in srgb, var(--red) 20%, transparent)' : 'color-mix(in srgb, var(--surface) 60%, transparent)',
                  color: activeTab === 'admin' ? 'var(--red)' : 'var(--text-2)',
                  fontSize: isDesktop ? '8.5px' : '7px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  
                  fontFamily: 'var(--font-sans)',
                  }}
              >
                <div
                  style={{
                    width: isDesktop ? '26px' : '22px',
                    height: isDesktop ? '26px' : '22px',
                    borderRadius: '6px',
                    background: activeTab === 'admin' ? 'var(--red)' : 'color-mix(in srgb, var(--red) 15%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeTab === 'admin' ? 'var(--text)' : 'var(--red)',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={isDesktop ? 15 : 13} strokeWidth={2.5} />
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ADMIN PANEL
                </span>
              </button>
            )
          )}
          {hasWallet ? (
            isCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={handleCopy}
                  title={`Active Wallet: ${activeAddress} (Click to Copy)`}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                    border: '1.5px solid color-mix(in srgb, var(--green) 40%, transparent)',
                    color: copied ? 'var(--green)' : 'var(--accent)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    }}
                >
                  {copied ? <Check size={15} color="var(--green)" /> : <Wallet size={15} color="var(--green)" />}
                </button>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect Wallet"
                  style={{
                    width: '38px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'color-mix(in srgb, var(--red) 15%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--red) 40%, transparent)',
                    color: 'var(--red)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                    border: '1.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                    borderRadius: '10px',
                    padding: isDesktop ? '10px 12px' : '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src="/new-logo-vibe.png"
                      alt="avatar"
                      style={{ width: isDesktop ? '20px' : '18px', height: isDesktop ? '20px' : '18px', borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: isDesktop ? '8.5px' : '7px', fontWeight: 900, color: 'var(--green)' }}>
                      {shortAddress(activeAddress)}
                    </span>
                  </div>

                  <button
                    onClick={handleCopy}
                    title="Copy address"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copied ? 'var(--green)' : 'var(--accent)',
                      cursor: 'pointer',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={handleDisconnect}
                  style={{
                    width: '100%',
                    background: 'color-mix(in srgb, var(--red) 12%, transparent)',
                    border: '1.5px solid color-mix(in srgb, var(--red) 35%, transparent)',
                    color: 'var(--red)',
                    borderRadius: '10px',
                    padding: isDesktop ? '11px 12px' : '9px 10px',
                    fontSize: isDesktop ? '8px' : '7px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-sans)',
                    }}
                >
                  <LogOut size={12} />
                  <span>DISCONNECT</span>
                </button>
              </div>
            )
          ) : isCollapsed ? (
            <button
              onClick={() => {
                login();
                if (!isDesktop) onClose();
              }}
              title="Connect Wallet"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: '1.5px solid var(--accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                
                margin: '0 auto'
              }}
            >
              <Wallet size={15} color="var(--bg)" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={() => {
                login();
                if (!isDesktop) onClose();
              }}
              style={{
                width: '100%',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: '1.5px solid var(--accent)',
                borderRadius: '10px',
                padding: isDesktop ? '12px 14px' : '10px 12px',
                fontSize: isDesktop ? '8.5px' : '7.5px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                
                fontFamily: 'var(--font-sans)',
                }}
            >
              <Wallet size={14} color="var(--bg)" strokeWidth={2.5} />
              <span>CONNECT WALLET</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}


