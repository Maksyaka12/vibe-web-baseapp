import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BaseAppHeader } from './BaseAppHeader';
import { BaseAppSidebar } from './BaseAppSidebar';
import { BaseAppBottomNav } from './BaseAppBottomNav';
import Checker from '../Checker';
import NftClubPage from '../pages/NftClubPage';
import DeFiVibePanel from './DeFiVibePanel';
import TokenomicsPage from '../pages/TokenomicsPage';
import ContractsPage from '../pages/ContractsPage';
import './BaseAppTheme.css';

class BaseAppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('BaseAppView Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#00f5ff', fontFamily: "'Press Start 2P', monospace" }}>
          <h2 style={{ fontSize: '14px', marginBottom: '16px', color: '#ff4466' }}>UNEXPECTED ERROR</h2>
          <p style={{ fontSize: '9px', lineHeight: 1.6, color: '#cbd5e1', marginBottom: '20px' }}>
            {this.state.error?.message || 'Failed to load Base App view.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              background: '#00f5ff',
              color: '#020b1a',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 900,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '8px',
              cursor: 'pointer'
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function BaseAppView({ RewardsComponent }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getInitialTab = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('buy') || path.includes('swap') || path.includes('exchange') || path.includes('trade')) return 'buy';
    if (path.includes('claim') || path.includes('checker')) return 'claim';
    if (path.includes('vibeclub') || path.includes('vibe-club') || path.includes('mint') || path.includes('nft')) return 'vibeclub';
    if (path.includes('profile')) return 'profile';
    if (path.includes('tokenomics')) return 'tokenomics';
    if (path.includes('contracts')) return 'contracts';
    return 'hub';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const current = getInitialTab();
    if (current !== activeTab) {
      setActiveTab(current);
    }
  }, [location.pathname]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    const prefix = location.pathname.startsWith('/app') ? '/app' : '';
    if (tabId === 'buy') {
      navigate(prefix ? '/app/buy' : '/buy', { replace: false });
    } else if (tabId === 'claim') {
      navigate(prefix ? '/app/claim' : '/claim', { replace: false });
    } else if (tabId === 'vibeclub') {
      navigate(prefix ? '/app/vibeclub' : '/vibeclub', { replace: false });
    } else if (tabId === 'profile') {
      navigate(prefix ? '/app/profile' : '/profile', { replace: false });
    } else if (tabId === 'tokenomics') {
      navigate(prefix ? '/app/tokenomics' : '/tokenomics', { replace: false });
    } else if (tabId === 'contracts') {
      navigate(prefix ? '/app/contracts' : '/contracts', { replace: false });
    } else {
      navigate(prefix ? '/app/hub' : '/hub', { replace: false });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <BaseAppErrorBoundary>
      <div className="base-app-pixel-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Base App Pixel Header */}
        <BaseAppHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          activeTab={activeTab}
        />

        {/* Base App Pixel Sidebar Drawer */}
        <BaseAppSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />

        {/* View Content: Buy/Swap, Rewards Hub, Claim Portal, or Join Vibe Club (NFT Mint) */}
        <main style={{ flex: 1, paddingBottom: '90px' }}>
          {activeTab === 'buy' ? (
            <div style={{ padding: '20px 12px 60px 12px', maxWidth: '560px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
              {/* Swap Hero Header */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  marginBottom: '20px',
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
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: 1.3
                  }}
                >
                  SWAP <span style={{ color: '#00f5ff' }}>$VIBE</span>
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
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', flexShrink: 0 }} />
                  <span style={{ fontSize: '6.5px', color: '#00f5ff', letterSpacing: '0.5px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
                    INSTANT ON-CHAIN SWAP · BASE MAINNET
                  </span>
                </div>
              </div>

              {/* Embedded DeFi Swap Widget Card */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
                  border: '1.5px solid rgba(0, 245, 255, 0.35)',
                  borderRadius: '18px',
                  padding: '16px 14px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 245, 255, 0.15)'
                }}
              >
                <DeFiVibePanel />
              </div>
            </div>
          ) : (activeTab === 'claim' || activeTab === 'profile') ? (
            <Checker isBaseAppMode={true} isProfileMode={activeTab === 'profile'} />
          ) : activeTab === 'vibeclub' ? (
            <NftClubPage isEmbeddedInBaseApp={true} />
          ) : activeTab === 'tokenomics' ? (
            <TokenomicsPage isBaseAppMode={true} />
          ) : activeTab === 'contracts' ? (
            <ContractsPage isBaseAppMode={true} />
          ) : (
            RewardsComponent ? <RewardsComponent isBaseAppMode={true} /> : null
          )}
        </main>

        {/* Fixed Bottom Pixel Navigation Bar */}
        <BaseAppBottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      </div>
    </BaseAppErrorBoundary>
  );
}
