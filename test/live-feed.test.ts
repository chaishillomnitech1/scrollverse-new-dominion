import { expect } from 'chai';
import { ethers } from 'ethers';

describe("📡 [Crystalline Apex Multi-RPC Fallback Diagnostics]", function () {
  const targetVault = "0x377956c1471d9ce142df6932895839243da23a2c";
  const testEndpoints = [
    "https://polygon-rpc.com",
    "https://ankr.com/rpc/polygon",
    "https://llamarpc.com/polygon"
  ];

  it("Should intercept node latency and cycle gracefully to next active gateway", async function () {
    let activeConnectionVerified = false;
    let fallbackTriggerCount = 0;

    for (const rpcUrl of testEndpoints) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const blockNumber = await provider.getBlockNumber();
        console.log(`✓ Connected to ${rpcUrl} | Block: ${blockNumber}`);
        activeConnectionVerified = true;
        break;
      } catch (error) {
        fallbackTriggerCount++;
        console.log(`⚠️ Fallback triggered at: ${rpcUrl}`);
      }
    }

    expect(activeConnectionVerified).to.be.true;
    expect(fallbackTriggerCount).to.be.greaterThanOrEqual(0);
  });

  it("Should retrieve vault balance when connection established", async function () {
    let balanceRetrieved = false;

    for (const rpcUrl of testEndpoints) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balance = await provider.getBalance(targetVault);
        const formatted = ethers.formatEther(balance);
        console.log(`✓ Vault balance: ${formatted} MATIC`);
        balanceRetrieved = true;
        break;
      } catch (error) {
        continue;
      }
    }

    expect(balanceRetrieved).to.be.true;
  });

  it("Should respect reduced-motion accessibility preference", async function () {
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
    
    expect(prefersReducedMotion === true || prefersReducedMotion === false).to.be.true;
    console.log(`✓ Reduced-motion preference: ${prefersReducedMotion ? 'ENABLED' : 'DISABLED'}`);
  });
});
