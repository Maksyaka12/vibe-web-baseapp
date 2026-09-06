import React, { useState } from 'react';
import { Copy, Check, ArrowUpRight } from 'lucide-react';

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
        <p className="doc-card-desc">{item.description}</p>
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
            Transparency Zone. All verified smart contracts and addresses related to the $VIBE Economy.
          </p>
        </div>

        {/* Full width groups */}
        <div className="docs-groups-full">
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

      </div>
    </section>
  );
}
