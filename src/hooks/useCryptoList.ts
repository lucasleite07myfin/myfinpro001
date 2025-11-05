import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  current_price?: number;
  price_change_24h?: number;
  market_cap_rank?: number;
}

export const useCryptoList = () => {
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar as top 1000 criptomoedas da CoinGecko com preços em BRL
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=1000&page=1&sparkline=false&locale=en&price_change_percentage=24h'
      );
      
      if (!response.ok) {
        throw new Error('Falha ao buscar lista de criptomoedas');
      }
      
      const data = await response.json();
      
      const formattedCoins: CryptoCoin[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        price_change_24h: coin.price_change_percentage_24h,
        market_cap_rank: coin.market_cap_rank,
      }));
      
      setCoins(formattedCoins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      logger.error('Error fetching crypto list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  return {
    coins,
    loading,
    error,
    refetch: fetchCoins,
  };
};
