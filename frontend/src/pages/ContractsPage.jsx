import React, { useState } from 'react';
import { Copy, Check, ArrowUpRight } from 'lucide-react';

const CONTRACTS = [
  {
    id: 'token',
    title: '$VIBE Token Contract',
    address: '0xb200000000000000000000df24ecb8bf51100a01',
    basescanUrl: 'https://basescan.org/token/0xb200000000000000000000df24ecb8bf51100a01'
  },
  {
    id: 'buyback',
    title: 'Buyback & Burn & Community Pool Address',
    address: '0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf',
    basescanUrl: 'https://basescan.org/address/0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf#transactions'
  },
  {
    id: 'nft',
    title: 'Vibe Club NFT Contract',
    address: '0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886',
    basescanUrl: 'https://basescan.org/address/0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886'
  },
  {
    id: 'holder-distributor',
    title: 'Holder Rewards Distributor Contract',
    address: '0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089',
    basescanUrl: 'https://basescan.org/address/0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089'
  },
  {
    id: 'royalty-distributor',
    title: 'NFT Royalty Distributor Contract',
    address: '0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1',
    basescanUrl: 'https://basescan.org/address/0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1'
  }
];

function DocContractCard({ item, isBaseAppMode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!item.address) return;
    navigator.clipboard.writeText(item.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const url = item.basescanUrl || `https://basescan.org/address/${item.address}`;

  if (isBaseAppMode) {
    return (
      <div
        className="contracts-card"
        style={{
          background: 'linear-gradient(180deg, rgba(6, 26, 60, 0.95) 0%, rgba(2, 11, 26, 0.98) 100%)',
          border: '1.5px solid rgba(0, 245, 255, 0.25)',
          borderRadius: '16px',
          padding: '16px 14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div className="contracts-card-title" style={{ fontSize: '8px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontWeight: 900 }}>
          {item.title}
        </div>

        <div
          className="contracts-card-addr-box"
          style={{
            background: 'rgba(2, 11, 26, 0.85)',
            border: '1px solid rgba(0, 245, 255, 0.18)',
            borderRadius: '10px',
            padding: '10px 10px',
            wordBreak: 'break-all',
            fontSize: '7px',
            color: '#00ff88',
            fontFamily: "'Press Start 2P', monospace",
            lineHeight: 1.5
          }}
        >
          {item.address}
        </div>

        <div className="contracts-btn-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="contracts-copy-btn"
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 10px',
              borderRadius: '8px',
              background: copied ? 'rgba(0, 255, 136, 0.18)' : 'rgba(0, 245, 255, 0.1)',
              border: copied ? '1.5px solid #00ff88' : '1.5px solid #00f5ff',
              color: copied ? '#00ff88' : '#00f5ff',
              fontSize: '6.5px',
              fontWeight: 900,
              fontFamily: "'Press Start 2P', monospace",
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="contracts-scan-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 10px',
              borderRadius: '8px',
              background: 'rgba(0, 82, 255, 0.2)',
              border: '1.5px solid #0052ff',
              color: '#ffffff',
              fontSize: '6.5px',
              fontWeight: 900,
              fontFamily: "'Press Start 2P', monospace",
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>BASESCAN</span>
            <ArrowUpRight size={12} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-card">
      <div className="doc-card-header">
        <h3 className="doc-card-title">{item.title}</h3>
      </div>

      <div className="doc-addr-row">
        <code className="doc-addr-code">{item.address}</code>

        <div className="doc-addr-actions">
          <button
            type="button"
            onClick={handleCopy}
            className={`doc-copy-btn ${copied ? 'copied' : ''}`}
            title="Copy Address"
          >
            {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-scan-btn"
            title="View on BaseScan"
          >
            <span>BaseScan</span>
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ContractsPage({ isBaseAppMode = false }) {
  if (isBaseAppMode) {
    return (
      <div className="contracts-view-container" style={{ padding: '16px 12px 60px 12px', maxWidth: '560px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Contracts Hero Header */}
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
              color: '#ffffff',
              fontFamily: "'Press Start 2P', monospace",
              textAlign: 'center',
              width: '100%',
              lineHeight: 1.3
            }}
          >
            CONTRACTS <span style={{ color: '#00f5ff' }}>&amp; ADDRESSES</span>
          </h2>

          <div
            className="rewards-hero-pill"
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
              marginBottom: '12px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', flexShrink: 0 }} />
            <span className="rewards-hero-pill-text" style={{ fontSize: '6.5px', color: '#00f5ff', letterSpacing: '0.5px', fontFamily: "'Press Start 2P', monospace", fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
              VERIFIED CONTRACTS · TRANSPARENCY ZONE
            </span>
          </div>

          <p className="contracts-hero-subtext" style={{ fontSize: '7.5px', color: '#88aacc', fontFamily: "'Press Start 2P', monospace", lineHeight: 1.6, margin: 0 }}>
            Official smart contracts &amp; addresses for $VIBE ecosystem.
          </p>
        </div>

        {/* Contract Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {CONTRACTS.map((item) => (
            <DocContractCard key={item.id} item={item} isBaseAppMode={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="contracts-page-section alt">
      <div className="wrap contracts-wrap">
        
        {/* Section Header styled consistently with other sections */}
        <div className="sec-head" style={{ marginBottom: '36px' }}>
          <h2>Contracts & <span className="bl">Adresses</span>.</h2>
          <p className="sec-sub">
            Transparency Zone. All verified contracts and addresses related to the $VIBE Economy.
          </p>
        </div>

        {/* Clean full-width list */}
        <div className="docs-cards-list">
          {CONTRACTS.map((item) => (
            <DocContractCard key={item.id} item={item} isBaseAppMode={false} />
          ))}
        </div>

      </div>
    </section>
  );
}
