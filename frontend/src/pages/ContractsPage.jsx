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
    title: 'Buyback & Burn & Community Pool Adress',
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

function DocContractCard({ item }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!item.address) return;
    navigator.clipboard.writeText(item.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const url = item.basescanUrl || `https://basescan.org/address/${item.address}`;

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

export default function ContractsPage() {
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
            <DocContractCard key={item.id} item={item} />
          ))}
        </div>

      </div>
    </section>
  );
}
