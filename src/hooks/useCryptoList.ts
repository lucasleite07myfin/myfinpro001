import { useState, useEffect } from 'react';

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
}

export const useCryptoList = () => {
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar as top 1000 criptomoedas da CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=1000&page=1&sparkline=false&locale=en'
      );
      
      if (!response.ok) {
        throw new Error('Falha ao buscar lista de criptomoedas');
      }
      
      const data = await response.json();
      
      const formattedCoins: CryptoCoin[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
      }));
      
      setCoins(formattedCoins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Error fetching crypto list:', err);
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
