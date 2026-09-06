import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ArrowUpRight, ArrowLeft, ShieldCheck, FileCode, Flame, Coins, Crown, ExternalLink, Database } from 'lucide-react';

const CONTRACT_GROUPS = [
  {
    groupTitle: 'OFFICIAL $VIBE CA',
    items: [
      {
        id: 'token',
        title: '$VIBE Token Contract',
        description: 'Native $VIBE token on Base (ERC-20 / B20 Standard). Fair launched with 1 Billion fixed supply and 0% tax.',
        address: '0xb200000000000000000000df24ecb8bf51100a01',
        basescanUrl: 'https://basescan.org/token/0xb200000000000000000000df24ecb8bf51100a01'
      }
    ]
  },
  {
    groupTitle: 'TREASURY & REVENUE',
    items: [
      {
        id: 'buyback',
        title: 'Buyback & Burn & Community Pool Adress',
        description: 'Receives all creator revenue from trading fees to execute market buybacks, permanent burns, and community reward refills.',
        address: '0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf',
        basescanUrl: 'https://basescan.org/address/0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf#transactions'
      }
    ]
  },
  {
    groupTitle: 'NFT CONTRACTS',
    items: [
      {
        id: 'nft-mint',
        title: 'Vibe Club NFT Mint Contract',
        description: 'Official 333 Vibe Club NFT collection supporting dual-currency mint (ETH & $VIBE) with automated 80% burn.',
        address: '0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886',
        basescanUrl: 'https://basescan.org/address/0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886'
      }
    ]
  },
  {
    groupTitle: 'REWARDS & MERKLE DISTRIBUTORS',
    items: [
      {
        id: 'holder-distributor',
        title: 'Holder Rewards Distributor Contract',
        description: 'Merkle Distributor smart contract governing monthly 10,000,000 $VIBE unlock distributions to verified holders.',
        address: '0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089',
        basescanUrl: 'https://basescan.org/address/0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089'
      },
      {
        id: 'royalty-distributor',
        title: 'NFT Royalty Distributor Contract',
        description: 'Merkle Distributor contract responsible for monthly equal distribution of 15% royalties to all 333 NFT holders.',
        address: '0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1',
        basescanUrl: 'https://basescan.org/address/0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1'
      }
    ]
  },
  {
    groupTitle: 'LIQUIDITY POOL',
    items: [
      {
        id: 'lp-pool',
        title: '$VIBE DEX Liquidity Pool',
        description: 'Primary onchain decentralized liquidity pool pair for $VIBE on Base network.',
        address: '0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5',
        basescanUrl: 'https://basescan.org/address/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5'
      }
    ]
  }
];

function DocContractCard({ item }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        <p className="doc-card-desc">{item.description}</p>
      </div>

      <div className="doc-addr-row">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-addr-text"
          title="Open in BaseScan"
        >
          <span>{item.address}</span>
          <ArrowUpRight size={14} className="doc-addr-arrow" />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className={`doc-copy-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <div className="docs-page-container">
      <div className="docs-layout wrap">
        
        {/* Left Docs Sidebar */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-section">
            <span className="docs-sidebar-title">GETTING STARTED</span>
            <ul className="docs-sidebar-links">
              <li>
                <Link to="/contracts" className="docs-link active">
                  Contracts & Adresses
                </Link>
              </li>
              <li>
                <Link to="/tokenomics" className="docs-link">
                  Tokenomics
                </Link>
              </li>
              <li>
                <Link to="/hub" className="docs-link">
                  Rewards Hub
                </Link>
              </li>
              <li>
                <Link to="/claim" className="docs-link">
                  Claim Portal
                </Link>
              </li>
            </ul>
          </div>

          <div className="docs-sidebar-section">
            <span className="docs-sidebar-title">RESOURCES</span>
            <ul className="docs-sidebar-links">
              <li>
                <a href="https://basescan.org/token/0xb200000000000000000000df24ecb8bf51100a01" target="_blank" rel="noopener noreferrer" className="docs-link">
                  BaseScan Explorer <ArrowUpRight size={12} />
                </a>
              </li>
              <li>
                <a href="https://dexscreener.com/base/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5" target="_blank" rel="noopener noreferrer" className="docs-link">
                  Dexscreener <ArrowUpRight size={12} />
                </a>
              </li>
              <li>
                <a href="https://opensea.io/collection/vibeclubnft" target="_blank" rel="noopener noreferrer" className="docs-link">
                  OpenSea Collection <ArrowUpRight size={12} />
                </a>
              </li>
            </ul>
          </div>

          <div className="docs-sidebar-bottom">
            <Link to="/" className="docs-back-btn">
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="docs-main-content">
          
          <div className="docs-breadcrumb">Getting Started</div>
          
          <h1 className="docs-title">Contracts & Adresses</h1>
          <p className="docs-subtitle">
            All verified onchain smart contracts and protocol addresses deployed on Base mainnet.
          </p>

          <div className="docs-groups">
            {CONTRACT_GROUPS.map((group, idx) => (
              <div key={idx} className="docs-group">
                <div className="docs-group-label">{group.groupTitle}</div>
                <div className="docs-cards-list">
                  {group.items.map((item) => (
                    <DocContractCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </main>

      </div>
    </div>
  );
}
