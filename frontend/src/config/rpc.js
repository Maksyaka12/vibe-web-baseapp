import { createPublicClient, http, fallback } from 'viem';
import { base } from 'viem/chains';

export const BASE_RPC_URLS = [
  'https://base.drpc.org',
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.meowrpc.com',
  'https://base-mainnet.public.blastapi.io',
  'https://developer-access-mainnet.base.org',
  'https://1rpc.io/base'
];

export const rpcTransports = fallback(
  BASE_RPC_URLS.map(url => http(url, { timeout: 10000, retryCount: 2 })),
  { rank: false }
);

export const publicClient = createPublicClient({
  chain: base,
  transport: rpcTransports
});

export const getPublicClient = () => publicClient;
