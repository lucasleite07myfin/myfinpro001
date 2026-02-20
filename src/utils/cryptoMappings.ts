/**
 * Mapeamento de símbolos de criptomoedas para IDs do CoinGecko.
 * Usado por múltiplos componentes para consultas de preço.
 */
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'LINK': 'chainlink',
  'ATOM': 'cosmos',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'HBAR': 'hedera-hashgraph',
  'APE': 'apecoin',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'CRV': 'curve-dao-token',
  'GRT': 'the-graph',
  'ENJ': 'enjincoin',
  'CHZ': 'chiliz',
  'BAT': 'basic-attention-token',
};

/**
 * Retorna o ID do CoinGecko para um dado símbolo de cripto.
 */
export const getCoinGeckoId = (symbol: string): string => {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
};
