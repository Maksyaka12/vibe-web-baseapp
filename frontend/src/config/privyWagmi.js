import { http, fallback } from 'wagmi';
import { base } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { BASE_RPC_URLS } from './rpc';

export const privyWagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: fallback(BASE_RPC_URLS.map(url => http(url, { timeout: 10000, retryCount: 2 }))),
  },
});

