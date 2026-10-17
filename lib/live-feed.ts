import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface LiveFeedMetrics {
  vaultNativeBalance: string;
  networkNodeStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeRepomirrorsCount: number;
  systemCoherenceWindow: number;
  lastUpdatedTimestamp: string;
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
    vaultNativeBalance: "0.0000",
    networkNodeStatus: 'ONLINE',
    activeRepomirrorsCount: 141,
    systemCoherenceWindow: 864.4,
    lastUpdatedTimestamp: new Date().toISOString()
  });

  const queryOnChainVaultWithFallback = async () => {
    let success = false;
    
    for (const rpcUrl of RPC_FALLBACK_NODES) {
      if (success) break;
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balanceWei = await provider.getBalance(VAULT_ENDPOINT);
        const formattedBalance = ethers.formatEther(balanceWei);

        setMetrics(prev => ({
          ...prev,
          vaultNativeBalance: Number(formattedBalance).toFixed(4),
          networkNodeStatus: 'ONLINE',
          lastUpdatedTimestamp: new Date().toISOString()
        }));
        success = true;
        console.log(`📊 [Live Vault Engine]: Telemetry synced — Balance: ${formattedBalance} MATIC`);
        break;
      } catch (error) {
        console.warn(`⚠️ Gateway latency at: ${rpcUrl}. Attempting fallback routing...`);
      }
    }

    if (!success) {
      setMetrics(prev => ({ ...prev, networkNodeStatus: 'OFFLINE' }));
      console.error("❌ All RPC endpoints exhausted. System degraded.");
    }
  };

  useEffect(() => {
    queryOnChainVaultWithFallback();
    // Strict 60-second SWR cache boundary
    const syncTicker = setInterval(queryOnChainVaultWithFallback, 60000);
    return () => clearInterval(syncTicker);
  }, []);

  return metrics;
}
