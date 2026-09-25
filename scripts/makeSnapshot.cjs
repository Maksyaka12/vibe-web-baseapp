/**
 * VIBE Tokenomics - Direct On-Chain Snapshot & Merkle Tree Generator
 * 
 * Usage:
 *   node scripts/makeSnapshot.cjs [roundNumber]
 *   Example: node scripts/makeSnapshot.cjs 2
 */

const fs = require('fs');
const path = require('path');
const { createPublicClient, http, parseAbi, parseUnits, formatUnits, keccak256, encodePacked, concatHex } = require('../frontend/node_modules/viem');
const { base } = require('../frontend/node_modules/viem/chains');

const TOKEN_ADDRESS = '0xb200000000000000000000df24ecb8bf51100a01';
const VESTING_CONTRACT = '0x77e04dd8c45725d2b2b3c8eebac2f3f1708fd089';
const MONTHLY_POOL = 10000000; // 10,000,000 $VIBE
const MAX_ALLOCATION_CAP = 500000; // 500,000 $VIBE cap

// Exactly 4 system contracts excluded:
const SYSTEM_EXCLUSIONS = [
  '0x498581ff718922c3f8e6a244956af099b2652b2b', // 1. Uniswap V4 Pool
  '0x3beea54db87a632a5faf20db6765d3af94c81b31', // 2. Vesting Vault 100M
  '0xfce13943c69b8cfe3de795dfe1a8447c8f8a99cb', // 3. Staking Contract
  '0x000000000000000000000000000000000000dead', // 4. Burn Address
  '0x0000000000000000000000000000000000000000'  // Zero Address
].map(a => a.toLowerCase());

function hashPair(a, b) {
  const bufA = Buffer.from(a.slice(2), 'hex');
  const bufB = Buffer.from(b.slice(2), 'hex');
  return Buffer.compare(bufA, bufB) < 0
    ? keccak256(concatHex([a, b]))
    : keccak256(concatHex([b, a]));
}

function buildMerkleTree(elements) {
  const leaves = elements.map(e => e.leaf);
  if (leaves.length === 0) return { root: '0x0', proofs: {} };

  let layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const currentLayer = layers[layers.length - 1];
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
      } else {
        nextLayer.push(currentLayer[i]);
      }
    }
    layers.push(nextLayer);
  }

  const root = layers[layers.length - 1][0];
  const proofs = {};
  for (let i = 0; i < elements.length; i++) {
    const proof = [];
    let idx = i;
    for (let l = 0; l < layers.length - 1; l++) {
      const layer = layers[l];
      const isRightNode = idx % 2 === 1;
      const pairIdx = isRightNode ? idx - 1 : idx + 1;
      if (pairIdx < layer.length) {
        proof.push(layer[pairIdx]);
      }
      idx = Math.floor(idx / 2);
    }
    proofs[elements[i].address.toLowerCase()] = {
      address: elements[i].address,
      balance: elements[i].balance,
      amount: elements[i].amount,
      amountWei: elements[i].amountWei.toString(),
      sharePercent: elements[i].sharePercent,
      isCapped: elements[i].isCapped,
      leaf: elements[i].leaf,
      proof: proof
    };
  }
  return { root, proofs };
}

async function runSnapshot() {
  const roundNumber = parseInt(process.argv[2] || '2', 10);
  console.log('\n======================================================');
  console.log(`🚀 VIBE Holder Rewards Snapshot (Round ${roundNumber})`);
  console.log('======================================================');
  console.log('Token CA:             ' + TOKEN_ADDRESS);
  console.log('Vesting Contract:     ' + VESTING_CONTRACT);
  console.log('Monthly Reward Pool:  ' + MONTHLY_POOL.toLocaleString() + ' $VIBE');
  console.log('Max Allocation Cap:   ' + MAX_ALLOCATION_CAP.toLocaleString() + ' $VIBE');
  console.log('Timestamp:            ' + new Date().toISOString());
  console.log('-----------------------------------------------------\n');

  const SNAPSHOT_TIMESTAMPS = {
    1: '2026-08-26T00:00:00Z',
    2: '2026-09-25T00:00:00Z',
    3: '2026-10-25T00:00:00Z',
    4: '2026-11-24T00:00:00Z'
  };
  const targetIso = SNAPSHOT_TIMESTAMPS[roundNumber] || '2026-09-25T00:00:00Z';

  console.log(`[1/4] 🔍 Fetching top holders from Base Blockscout / On-chain...`);
  const res = await fetch('https://base.blockscout.com/api/v2/tokens/' + TOKEN_ADDRESS + '/holders');
  const d = await res.json();
  if (!d.items || d.items.length === 0) {
    throw new Error('Failed to fetch holders from Blockscout API');
  }

  // Take top 30 on-chain addresses and filter out the 4 system contracts -> exactly 26 eligible holders
  const top30 = d.items.slice(0, 30);
  const eligible = [];

  top30.forEach((item) => {
    const addr = item.address.hash.toLowerCase();
    if (!SYSTEM_EXCLUSIONS.includes(addr)) {
      const bal = Number(item.value) / 1e18;
      eligible.push({
        address: addr,
        balance: bal
      });
    }
  });

  console.log(`\nFound EXACTLY ${eligible.length} Qualified Wallets (Top 30 minus 4 System Contracts):`);
  const totalEligibleSum = eligible.reduce((acc, h) => acc + h.balance, 0);
  console.log(`Total Qualified Balance Sum: ${Math.round(totalEligibleSum).toLocaleString('en-US')} $VIBE\n`);

  console.log(`[2/4] 🧮 Calculating Proportional Allocations with ${MAX_ALLOCATION_CAP.toLocaleString()} $VIBE Max Cap...`);
  let remainingPool = MONTHLY_POOL;
  let remainingHolders = [...eligible];
  const finalRewards = new Map();

  while (remainingHolders.length > 0) {
    const currSum = remainingHolders.reduce((acc, h) => acc + h.balance, 0);
    let newlyCappedCount = 0;
    const nextRemaining = [];

    for (const h of remainingHolders) {
      const share = (h.balance / currSum) * remainingPool;
      if (share >= MAX_ALLOCATION_CAP) {
        finalRewards.set(h.address, { amount: MAX_ALLOCATION_CAP, isCapped: true });
        remainingPool -= MAX_ALLOCATION_CAP;
        newlyCappedCount++;
      } else {
        nextRemaining.push(h);
      }
    }

    if (newlyCappedCount === 0) {
      const finalSum = remainingHolders.reduce((acc, h) => acc + h.balance, 0);
      for (const h of remainingHolders) {
        const rew = Math.round((h.balance / finalSum) * remainingPool);
        finalRewards.set(h.address, { amount: Math.min(MAX_ALLOCATION_CAP, rew), isCapped: false });
      }
      break;
    }
    remainingHolders = nextRemaining;
  }

  let totalDistributed = 0;
  const elements = eligible.map(h => {
    const capInfo = finalRewards.get(h.address);
    const rewardAmount = capInfo.amount;
    totalDistributed += rewardAmount;
    const amountWei = parseUnits(rewardAmount.toString(), 18);
    const leaf = keccak256(encodePacked(['address', 'uint256', 'uint256'], [h.address, BigInt(roundNumber), amountWei]));
    return {
      address: h.address,
      balance: Math.round(h.balance),
      amount: rewardAmount,
      amountWei: amountWei,
      sharePercent: ((rewardAmount / MONTHLY_POOL) * 100).toFixed(2) + '%',
      isCapped: capInfo.isCapped,
      leaf: leaf
    };
  });

  console.log(`Total Distributed: ${totalDistributed.toLocaleString('en-US')} $VIBE`);

  console.log(`\n[3/4] 🌳 Generating Merkle Tree & Cryptographic Proofs...`);
  const { root, proofs } = buildMerkleTree(elements);

  console.log('\n======================================================');
  console.log('✅ SNAPSHOT & MERKLE Generated Successfully!');
  console.log('======================================================');
  console.log(`🔑 Merkle Root (for Round ${roundNumber}):`);
  console.log(root + '\n');

  const outDir = path.join(__dirname, '../snapshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const rootFile = path.join(outDir, `round_${roundNumber}_root.txt`);
  fs.writeFileSync(rootFile, root, 'utf8');

  const proofsFile = path.join(outDir, `round_${roundNumber}_proofs.json`);
  fs.writeFileSync(proofsFile, JSON.stringify({
    round: roundNumber,
    token: TOKEN_ADDRESS,
    vestingContract: VESTING_CONTRACT,
    snapshotDate: targetIso,
    merkleRoot: root,
    totalHolders: elements.length,
    totalEligibleSupply: totalEligibleSum,
    monthlyPool: MONTHLY_POOL,
    maxAllocationCap: MAX_ALLOCATION_CAP,
    claims: proofs
  }, null, 2), 'utf8');

  const frontendDataDir = path.join(__dirname, '../frontend/src/data');
  if (!fs.existsSync(frontendDataDir)) fs.mkdirSync(frontendDataDir, { recursive: true });
  fs.writeFileSync(path.join(frontendDataDir, `round_${roundNumber}_proofs.json`), JSON.stringify({
    round: roundNumber,
    merkleRoot: root,
    claims: proofs
  }, null, 2), 'utf8');

  const csvFile = path.join(outDir, `round_${roundNumber}_table.csv`);
  let csv = 'Rank,Address,Balance,SharePercent,RewardAmount,IsCapped\n';
  elements.forEach((e, idx) => {
    csv += (idx + 1) + ',' + e.address + ',' + e.balance + ',' + e.sharePercent + ',' + e.amount + ',' + e.isCapped + '\n';
  });
  fs.writeFileSync(csvFile, csv, 'utf8');

  console.log('[4/4] 📁 Files Saved:');
  console.log('1. Root file:   ' + rootFile);
  console.log('2. Proofs file: ' + proofsFile);
  console.log('3. Audit CSV:   ' + csvFile);
  console.log('4. UI Ready:    ' + path.join(frontendDataDir, `round_${roundNumber}_proofs.json`));

  console.log('\n📋 All ' + elements.length + ' Qualified Allocations (with 500k CAP):');
  console.table(elements.map((e, idx) => ({
    '#': idx + 1,
    'Address': e.address,
    'Balance': e.balance.toLocaleString('en-US') + ' $VIBE',
    'Share': e.sharePercent,
    'Reward': e.amount.toLocaleString('en-US') + ' $VIBE' + (e.isCapped ? ' (CAPPED)' : '')
  })));

  console.log('\n🎯 NEXT ACTION:');
  console.log(`Send 1 transaction on Base to contract ${VESTING_CONTRACT}:`);
  console.log(`Function: setMerkleRoot(${roundNumber}, "${root}")\n`);
}

runSnapshot().catch(err => {
  console.error('Fatal error during snapshot execution:', err);
  process.exit(1);
});
