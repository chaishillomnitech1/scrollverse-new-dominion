import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface LiveFeedMetrics {
  vaultNativeBalance: string | null;
  networkNodeStatus: 'CONNECTING' | 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  dataSource: 'Polygon public RPC';
  lastUpdatedTimestamp: string | null;
  lastError: string | null;
}

export function useLiveFeed() {
  const VAULT_ENDPOINT = "0x377956c1471d9ce142df6932895839243da23a2c";
  
  // Resilient Redundant RPC Gateway Matrix
  const RPC_FALLBACK_NODES = [
    "https://polygon-rpc.com",
    "https://ankr.com/rpc/polygon",
    "https://llamarpc.com/polygon"
  ];

  const [metrics, setMetrics] = useState<LiveFeedMetrics>({
    vaultNativeBalance: null,
    networkNodeStatus: 'CONNECTING',
    dataSource: 'Polygon public RPC',
    lastUpdatedTimestamp: null,
    lastError: null
  });

  const queryOnChainVaultWithFallback = async () => {
    for (const [index, rpcUrl] of RPC_FALLBACK_NODES.entries()) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balanceWei = await provider.getBalance(VAULT_ENDPOINT);
        const formattedBalance = ethers.formatEther(balanceWei);

        setMetrics({
          vaultNativeBalance: formattedBalance,
          networkNodeStatus: index === 0 ? 'ONLINE' : 'DEGRADED',
          dataSource: 'Polygon public RPC',
          lastUpdatedTimestamp: new Date().toISOString(),
          lastError: null
        });
        return;
      } catch {
        continue;
      }
    }

    setMetrics((prev: LiveFeedMetrics) => ({
      ...prev,
      networkNodeStatus: 'OFFLINE',
      lastError: 'Unable to reach the configured Polygon RPC endpoints.'
    }));
  };

  useEffect(() => {
    queryOnChainVaultWithFallback();
    // Strict 60-second SWR cache boundary
    const syncTicker = setInterval(queryOnChainVaultWithFallback, 60000);
    return () => clearInterval(syncTicker);
  }, []);

  return metrics;
}
