/*
 * Element Friends: Starknet settings (optional layer).
 * After deploying the contract (see contracts/README.md), paste its address into `contractAddress`.
 * While `contractAddress` is empty, players can still connect a wallet, but minting stays off.
 *
 * Cartridge (via StarkZap): social / passkey login with session policies limited to this game's
 * mint entrypoints, and feeMode { type: "paymaster" } so mints are free where Cartridge/AVNU
 * sponsorship is configured. Extension wallets (Ready, Braavos) remain available as an alternative.
 */
window.EF_STARKNET_CONFIG = {
  enabled: true,                              // set to false to hide every Starknet button
  network: 'sepolia',
  networkName: 'Sepolia testnet',
  chainId: '0x534e5f5345504f4c4941',          // SN_SEPOLIA
  rpcUrl: 'https://starknet-sepolia.drpc.org', // any Starknet JSON-RPC (v0.8+) endpoint for Sepolia
  contractAddress: '',                        // <- paste the deployed ElementFriends address here
  explorerTx: 'https://sepolia.voyager.online/tx/',
  explorerContract: 'https://sepolia.voyager.online/contract/',
  explorerNft: 'https://sepolia.voyager.online/nft/',     // + <contract>/<tokenId>: a friend's collectible page
  batchSize: 30,                              // discoveries minted per transaction when syncing many
  // Cartridge / StarkZap (cute onboarding: no seed phrase; sponsored fees when available)
  cartridge: {
    enabled: true,
    // Preferred fee mode. { type: "paymaster" } is the current API; "sponsored" is a deprecated alias.
    feeMode: { type: 'paymaster' },
    fallbackFeeMode: 'user_pays',             // used if paymaster/SNIP-9 sponsorship isn't available
    deploy: 'if_needed',
    methods: ['discover', 'discover_batch'],  // session policies — only these entrypoints
    // Optional Cartridge Controller overrides:
    // preset: 'element-friends',             // Cartridge dashboard preset name, if you create one
    // url: 'https://x.cartridge.gg',          // custom Controller URL
    // paymaster: { nodeUrl: 'https://…' },   // AVNU/custom paymaster (usually unused with Cartridge)
  },
  installLinks: [
    { name: 'Ready', url: 'https://www.ready.co/' },
    { name: 'Braavos', url: 'https://braavos.app/' }
  ]
};
