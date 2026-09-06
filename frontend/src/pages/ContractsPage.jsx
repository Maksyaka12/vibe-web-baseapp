import React, { useState } from 'react';
import { Copy, Check, ArrowUpRight, ShieldCheck, FileCode, Flame, Coins, Crown, ExternalLink, Sparkles, Database } from 'lucide-react';

const CONTRACT_ITEMS = [
  {
    id: 'token',
    title: '$VIBE Token Contract',
    tag: 'ERC-20 / B20 Standard',
    tagColor: 'blue',
    icon: Coins,
    address: '0xb200000000000000000000df24ecb8bf51100a01',
    description: 'The native $VIBE token on Base. Fair launch with 1 Billion fixed supply, 0% taxes, verified source code, and zero team allocations.',
    links: [
      { label: 'Basescan', url: 'https://basescan.org/token/0xb200000000000000000000df24ecb8bf51100a01' },
      { label: 'Dexscreener', url: 'https://dexscreener.com/base/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5' },
      { label: 'o1.exchange', url: 'https://launch.o1.exchange/token/0xb200000000000000000000df24ecb8bf51100a01?chain=8453' }
    ]
  },
  {
    id: 'buyback',
    title: 'Buyback & Burn & Community Pool Adress',
    tag: 'Treasury & Revenue',
    tagColor: 'green',
    icon: Flame,
    address: '0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf',
    description: 'Dedicated transparent protocol address that collects creator revenue from market trading and utilizes 100% of it for token buybacks, permanent burns, and community reward pool refills.',
    links: [
      { label: 'View on Basescan', url: 'https://basescan.org/address/0x067c66aDdD3C6D484c1882B68E197B614f7f3Ebf#transactions' }
    ]
  },
  {
    id: 'nft-mint',
    title: 'Vibe Club NFT Mint Contract',
    tag: 'ERC-721 Collection',
    tagColor: 'purple',
    icon: Crown,
    address: '0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886',
    description: 'Official smart contract for the exclusive 333 Vibe Club NFT collection. Features dual-currency minting (ETH and $VIBE) with an automatic 80% $VIBE burn mechanism upon minting.',
    links: [
      { label: 'Basescan', url: 'https://basescan.org/address/0x9E92307Dbec2d0aE4BBF14cA93E1cA00edC4b886' },
      { label: 'OpenSea', url: 'https://opensea.io/collection/vibeclubnft' }
    ]
  },
  {
    id: 'holder-distributor',
    title: 'Holder Rewards Distributor Contract',
    tag: 'Merkle Distributor',
    tagColor: 'amber',
    icon: ShieldCheck,
    address: '0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089',
    description: 'Cryptographically secured Merkle Distributor smart contract governing the monthly release of 10,000,000 $VIBE community unlock rewards to verified holders.',
    links: [
      { label: 'View on Basescan', url: 'https://basescan.org/address/0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089' },
      { label: 'Claim Portal', url: '/claim' }
    ]
  },
  {
    id: 'royalty-distributor',
    title: 'NFT Royalty Distributor Contract',
    tag: 'Merkle Distributor',
    tagColor: 'purple',
    icon: Crown,
    address: '0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1',
    description: 'Merkle Distributor smart contract responsible for the equal distribution of 15% protocol royalties among all 333 Vibe Club NFT holders.',
    links: [
      { label: 'View on Basescan', url: 'https://basescan.org/address/0x3753EE7fa9538087f901aa5E4afc12dBA57B97c1' }
    ]
  },
  {
    id: 'staking',
    title: '$VIBE Staking Vaults (o1.exchange)',
    tag: 'DeFi Staking',
    tagColor: 'blue',
    icon: Database,
    isMultiAddress: true,
    addresses: [
      { label: 'Epoch 1 Vault', address: '0xafa3ce23e0043b651d98e5a89b55a80b71be2f4a945a745cd6e37316b5075663', url: 'https://launch.o1.exchange/staking/vaults/0xafa3ce23e0043b651d98e5a89b55a80b71be2f4a945a745cd6e37316b5075663?chain=8453' },
      { label: 'Epoch 2 Vault', address: '0x5dcabfeb83e84ad87572c531dfa8de915e0b5d8c11e4ca39598a3c6b4fc1e446', url: 'https://launch.o1.exchange/staking/vaults/0x5dcabfeb83e84ad87572c531dfa8de915e0b5d8c11e4ca39598a3c6b4fc1e446?chain=8453' }
    ],
    description: 'Verified single-sided $VIBE staking vaults on o1.exchange, distributing 15% of community reward allocation across 10-day epochs.',
    links: [
      { label: 'o1 Staking Vaults', url: 'https://launch.o1.exchange/staking/vaults/0x5dcabfeb83e84ad87572c531dfa8de915e0b5d8c11e4ca39598a3c6b4fc1e446?chain=8453' }
    ]
  },
  {
    id: 'lp-pool',
    title: '$VIBE Liquidity Pool Pair',
    tag: 'DEX Pool (Base)',
    tagColor: 'green',
    icon: FileCode,
    address: '0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5',
    description: 'Primary onchain liquidity pool pair on Base network, facilitating seamless decentralized swaps and liquidity routing.',
    links: [
      { label: 'Basescan', url: 'https://basescan.org/address/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5' },
      { label: 'Dexscreener', url: 'https://dexscreener.com/base/0xa1a4159e61ac9fc48aa9e9992c8d4870ef8a496d5749af1d219e8002f74835c5' }
    ]
  }
];

function AddressRow({ address, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="contract-addr-box">
      {label && <span className="contract-addr-sublabel">{label}:</span>}
      <code className="contract-addr-code">{address}</code>
      <div className="contract-addr-actions">
        <button
          onClick={handleCopy}
          className={`contract-copy-btn ${copied ? 'copied' : ''}`}
          title="Copy Address"
          type="button"
        >
          {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        <a
          href={`https://basescan.org/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="contract-ext-btn"
          title="View on Basescan"
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <section className="contracts-page-section">
      <div className="wrap">
        
        {/* Header */}
        <div className="contracts-header">
          <div className="contracts-eyebrow">
            <span className="contracts-dot" />
            Verified Onchain Documentation
          </div>
          <h1 className="contracts-title">
            Contracts & <span className="bl">Adresses</span>.
          </h1>
          <p className="contracts-subtitle">
            Complete registry of all verified smart contracts, distributors, and protocol addresses powering the $VIBE ecosystem on Base.
          </p>
        </div>

        {/* Network Info Strip */}
        <div className="contracts-network-strip">
          <div className="network-item">
            <span className="net-lbl">Network</span>
            <span className="net-val">
              <span className="net-dot" /> Base Mainnet
            </span>
          </div>
          <div className="network-item">
            <span className="net-lbl">Chain ID</span>
            <span className="net-val">8453</span>
          </div>
          <div className="network-item">
            <span className="net-lbl">Block Explorer</span>
            <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="net-val net-link">
              BaseScan.org <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="network-item">
            <span className="net-lbl">Standard</span>
            <span className="net-val">B20 / ERC-20 / ERC-721</span>
          </div>
        </div>

        {/* Contracts Grid */}
        <div className="contracts-grid">
          {CONTRACT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="contract-card">
                <div className="contract-card-top">
                  <div className="contract-card-header-left">
                    <div className={`contract-card-icon-wrap ${item.tagColor}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="contract-card-title">{item.title}</h3>
                      <span className={`contract-badge ${item.tagColor}`}>{item.tag}</span>
                    </div>
                  </div>
                </div>

                <p className="contract-card-desc">{item.description}</p>

                {item.isMultiAddress ? (
                  <div className="contract-multi-addresses">
                    {item.addresses.map((sub, idx) => (
                      <AddressRow key={idx} address={sub.address} label={sub.label} />
                    ))}
                  </div>
                ) : (
                  <AddressRow address={item.address} />
                )}

                {item.links && item.links.length > 0 && (
                  <div className="contract-card-links">
                    {item.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target={link.url.startsWith('http') ? '_blank' : '_self'}
                        rel={link.url.startsWith('http') ? 'noopener noreferrer' : ''}
                        className="contract-pill-link"
                      >
                        {link.label}
                        <ArrowUpRight size={14} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Security & Transparency Note */}
        <div className="contracts-notice-box">
          <ShieldCheck size={28} color="var(--blue)" className="notice-icon" />
          <div>
            <h4>100% Onchain & Community-Driven</h4>
            <p>
              All contracts listed above are deployed and active on Base Mainnet. $VIBE was fair launched with zero mint privileges, no hidden taxes, and non-custodial Merkle distribution contracts.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
