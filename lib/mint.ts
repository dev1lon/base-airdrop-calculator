import { createThirdwebClient, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

// Public thirdweb client (clientId is safe to expose; it's domain-restricted in
// the thirdweb dashboard). Used for wallet connection and IPFS uploads.
export const thirdwebClient = createThirdwebClient({
  clientId: "9fc72617b74d7e3491fe1b5e48ee1402",
});

export const cardChain = base;

// CardNFT on Base — public, paid mint with a mintBatch(uri, quantity).
export const cardContract = getContract({
  client: thirdwebClient,
  chain: base,
  address: "0x30a2e809a4d5fC320cCfda39ec87e80b53d7975B",
});

// 0.003 ETH per card.
export const MINT_PRICE_WEI = 3_000_000_000_000_000n;
export const MINT_PRICE_ETH = 0.003;

// Connect options: Coinbase (Base app / Smart Wallet), MetaMask/injected, and
// WalletConnect for any mobile wallet. Inside the Base app the injected
// provider auto-connects via AutoConnect.
export const wallets = [
  createWallet("com.coinbase.wallet"),
  createWallet("io.metamask"),
  createWallet("walletConnect"),
];
