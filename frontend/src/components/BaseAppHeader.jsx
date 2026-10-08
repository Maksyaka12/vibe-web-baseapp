import React from 'react';
import { Menu, Wallet, Flame } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useVibeBalances } from '../hooks/useVibeBalances';
import { useVibeCheckIn } from '../hooks/useVibeCheckIn';

const TAB_TITLES = {
  home: 'HOME · OVERVIEW',
  hub: 'REWARDS HUB',
  buy: 'SWAP $VIBE',
  vibeclub: 'VIBE CLUB NFT',
  claim: 'CLAIM PORTAL',
  profile: 'USER PROFILE',
  tokenomics: 'TOKENOMICS',
  contracts: 'OFFICIAL ADDRESSES'
};

export function BaseAppHeader({ onOpenSidebar, activeTab, isDesktop = false }) {
  const { login, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();

  const activeAddress = user?.wallet?.address || wallets?.[0]?.address || wagmiAddress;
  const hasWallet = (authenticated && !!activeAddress) || (isWagmiConnected && !!wagmiAddress);

  const { balance, nftCount, formattedBalance } = useVibeBalances(activeAddress);
  const { streak } = useVibeCheckIn(activeAddress);

  const pageTitle = TAB_TITLES[activeTab] || '$VIBE';

  return (
    <header
      className="base-app-header"
      style={{
        height: '66px',
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        borderBottom: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
        
        
        
        boxSizing: 'border-box',
        flexWrap: 'nowrap'
      }}
    >
      {/* Left side: Hamburger + Logo on Mobile, OR Page Title on Desktop */}
      <div className="base-app-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: 0 }}>
        {/* Mobile Hamburger Menu Button (Hidden on Desktop via CSS / isDesktop) */}
        <button
          onClick={onOpenSidebar}
          aria-label="Open Navigation Menu"
          className="mobile-hamburger-btn"
          style={{
            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
            border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            borderRadius: '8px',
            color: 'var(--accent)',
            cursor: 'pointer',
            padding: '6px',
            display: isDesktop ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Menu size={17} color="var(--accent)" strokeWidth={2.5} />
        </button>

        {/* Mobile Logo + $VIBE HUB */}
        <div
          className="mobile-brand-pill"
          style={{
            display: isDesktop ? 'none' : 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          <img
            src="/new-logo-vibe.png"
            alt="VIBE"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              objectFit: 'cover',
              border: '1.5px solid var(--accent)',
              
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontSize: '9px',
              fontWeight: 900,
              color: 'var(--accent)',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap'
            }}
          >
            $VIBE HUB
          </span>
        </div>

        {/* Desktop Active View Title / Breadcrumb */}
        <div
          className="desktop-header-title"
          style={{
            display: isDesktop ? 'flex' : 'none',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: '0.6px',
              whiteSpace: 'nowrap'
            }}
          >
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right side: Balances or Connect Wallet */}
      <div className="base-app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {hasWallet ? (
          <div className="header-balances-wrap" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {/* Daily Streak Pill */}
            <div
              className="header-balance-pill header-streak-pill"
              title={`Daily Check-In Streak: ${streak} ${streak === 1 ? 'Day' : 'Days'}`}
              style={{
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--amber) 45%, transparent)',
                
                borderRadius: '8px',
                padding: '5px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
              <span
                className="header-balance-text"
                style={{
                  fontSize: '7.5px',
                  fontWeight: 900,
                  color: 'var(--amber)',
                  letterSpacing: '0.2px',
                  fontVariantNumeric: 'tabular-nums',
                  
                  whiteSpace: 'nowrap'
                }}
              >
                {streak}
              </span>
              <Flame size={13} color="var(--amber)" strokeWidth={2.5} style={{  flexShrink: 0 }} />
            </div>

            {/* NFT Balance Pill */}
            <div
              className="header-balance-pill header-nft-pill"
              title="Vibe Club NFT Balance"
              style={{
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                
                borderRadius: '8px',
                padding: '5px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
              <span
                className="header-balance-text"
                style={{
                  fontSize: '7px',
                  fontWeight: 900,
                  color: 'var(--accent)',
                  letterSpacing: '0.2px',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap'
                }}
              >
                {nftCount} NFT
              </span>
              <img
                src="/new-logo-vibe.png"
                alt="NFT"
                className="header-balance-icon"
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            </div>

            {/* $VIBE Token Balance Pill */}
            <div
              className="header-balance-pill header-token-pill"
              title="$VIBE Token Balance"
              style={{
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--green) 35%, transparent)',
                
                borderRadius: '8px',
                padding: '5px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
              <span
                className="header-balance-text"
                style={{
                  fontSize: '7px',
                  fontWeight: 900,
                  color: 'var(--green)',
                  letterSpacing: '0.2px',
                  fontVariantNumeric: 'tabular-nums',
                  
                  whiteSpace: 'nowrap'
                }}
              >
                {formattedBalance}
              </span>
              <img
                src="/new-logo-vibe.png"
                alt="$VIBE"
                className="header-balance-icon"
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={login}
            className="header-connect-btn"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: '1.5px solid var(--accent)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '7px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              
              transition: 'all 0.2s ease',
              outline: 'none',
              
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Wallet size={11} color="var(--bg)" strokeWidth={2.5} />
            <span>CONNECT</span>
          </button>
        )}
      </div>
    </header>
  );
}

