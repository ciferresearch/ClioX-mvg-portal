// networks metadata to add to EVM-based Chains list
// see: https://github.com/ethereum-lists/chains

const networksMetadata = [
  ...(process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA === 'true'
    ? [
        {
          chainId: 11155420,
          networkId: 11155420,
          name: 'OP Sepolia',
          chain: 'optimism-sepolia',
          rpc: [
            process.env.NEXT_PUBLIC_OP_SEPOLIA_RPC_URL ||
              'https://sepolia.optimism.io'
          ],
          faucets: [],
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          infoURL: 'https://docs.optimism.io',
          shortName: 'opsep',
          explorers: [
            {
              name: 'OP Sepolia Etherscan',
              url: 'https://sepolia-optimism.etherscan.io',
              standard: 'EIP3091'
            }
          ]
        }
      ]
    : []),
  {
    chainId: 32456,
    networkId: 32456,
    name: 'Pontus-X Devnet',
    chain: 'Pontus-X',
    rpc: ['https://rpc.dev.pontus-x.eu'],
    faucets: [],
    nativeCurrency: {
      name: 'EURAU',
      symbol: 'EURAU',
      decimals: 6
    },
    infoURL: 'https://docs.pontus-x.eu',
    shortName: 'Pontus-X',
    explorers: [
      {
        name: 'Pontus-X Devnet Explorer',
        url: 'https://explorer.pontus-x.eu/devnet/pontusx',
        standard: ''
      }
    ]
  },
  {
    chainId: 32457,
    networkId: 32457,
    name: 'Pontus-X Testnet',
    chain: 'Pontus-X',
    rpc: ['https://rpc.test.pontus-x.eu'],
    faucets: [],
    nativeCurrency: {
      name: 'EURAU',
      symbol: 'EURAU',
      decimals: 6
    },
    infoURL: 'https://docs.pontus-x.eu',
    shortName: 'Pontus-X',
    explorers: [
      {
        name: 'Pontus-X Testnet Explorer',
        url: 'https://explorer.pontus-x.eu/testnet/pontusx',
        standard: ''
      }
    ]
  }
]

module.exports = {
  networksMetadata
}
