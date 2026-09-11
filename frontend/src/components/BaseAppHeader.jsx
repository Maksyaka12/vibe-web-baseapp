import React from 'react';
import { Menu, Wallet } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useVibeBalances } from '../hooks/useVibeBalances';

const TAB_TITLES = {
  home: 'HOME · OVERVIEW',
  hub: 'REWARDS HUB',
  buy: 'SWAP $VIBE',
  vibeclub: 'VIBE CLUB NFT',
  claim: 'CLAIM PORTAL',
  profile: 'DASHBOARD',
  tokenomics: 'TOKENOMICS',
  contracts: 'CONTRACTS & ADDRESSES'
};

export function BaseAppHeader({ onOpenSidebar, activeTab, isDesktop = false }) {
  const { login, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();

  const activeAddress = user?.wallet?.address || wallets?.[0]?.address || wagmiAddress;
  const hasWallet = (authenticated && !!activeAddress) || (isWagmiConnected && !!wagmiAddress);

  const { balance, nftCount, formattedBalance } = useVibeBalances(activeAddress);

  const pageTitle = TAB_TITLES[activeTab] || '$VIBE';

  return (
    <header
      className="base-app-header"
      style={{
        height: '66px',
        background: 'rgba(2, 11, 26, 0.92)',
        borderBottom: '1px solid rgba(0, 245, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        color: '#FFFFFF',
        fontFamily: "'Press Start 2P', monospace",
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        textTransform: 'uppercase',
        boxSizing: 'border-box'
      }}
    >
      {/* Left side: Hamburger + Logo on Mobile, OR Page Title on Desktop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Mobile Hamburger Menu Button (Hidden on Desktop via CSS / isDesktop) */}
        <button
          onClick={onOpenSidebar}
          aria-label="Open Navigation Menu"
          className="mobile-hamburger-btn"
          style={{
            background: 'rgba(0, 245, 255, 0.08)',
            border: '1.5px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '10px',
            color: '#00f5ff',
            cursor: 'pointer',
            padding: '7px',
            display: isDesktop ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Menu size={18} color="#00f5ff" strokeWidth={2.5} />
        </button>

        {/* Mobile Logo + $VIBE */}
        <div
          className="mobile-brand-pill"
          style={{
            display: isDesktop ? 'none' : 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none'
          }}
        >
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
              color: '#ffffff',
              letterSpacing: '0.6px'
            }}
          >
            {pageTitle}
          </span>
          <span
            style={{
              fontSize: '6.5px',
              color: '#00f5ff',
              background: 'rgba(0, 245, 255, 0.1)',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              padding: '3px 8px',
              borderRadius: '99px',
              letterSpacing: '0.4px'
            }}
          >
            BASE MAINNET
          </span>
        </div>
      </div>

      {/* Right side: Balances or Connect Wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {hasWallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* NFT Balance Pill */}
            <div
              title="Vibe Club NFT Balance"
              style={{
                background: 'rgba(4, 14, 36, 0.9)',
                border: '1.5px solid rgba(0, 245, 255, 0.3)',
                boxShadow: '0 0 8px rgba(0, 245, 255, 0.15)',
                borderRadius: '10px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                userSelect: 'none'
              }}
            >
              <span
                style={{
                  fontSize: '7.5px',
                  fontWeight: 900,
                  color: '#00f5ff',
                  letterSpacing: '0.3px',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {nftCount} NFT
              </span>
              <img
                src="/new-logo-vibe.png"
                alt="NFT"
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '4px',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* $VIBE Token Balance Pill */}
            <div
              title="$VIBE Token Balance"
              style={{
                background: 'rgba(4, 14, 36, 0.9)',
                border: '1.5px solid rgba(0, 255, 136, 0.35)',
                boxShadow: '0 0 8px rgba(0, 255, 136, 0.15)',
                borderRadius: '10px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                userSelect: 'none'
              }}
            >
              <span
                style={{
                  fontSize: '7.5px',
                  fontWeight: 900,
                  color: '#00ff88',
                  letterSpacing: '0.3px',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 0 8px rgba(0, 255, 136, 0.4)'
                }}
              >
                {formattedBalance}
              </span>
              <img
                src="/new-logo-vibe.png"
                alt="$VIBE"
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '4px',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={login}
            style={{
              background: 'linear-gradient(135deg, #00f5ff, #0050ff)',
              color: '#FFFFFF',
              border: '1.5px solid #ffffff',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '7.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(0, 245, 255, 0.4)',
              transition: 'all 0.2s ease',
              outline: 'none',
              textTransform: 'uppercase'
            }}
          >
            <Wallet size={12} strokeWidth={2.5} />
            <span>CONNECT</span>
          </button>
        )}
      </div>
    </header>
  );
}

