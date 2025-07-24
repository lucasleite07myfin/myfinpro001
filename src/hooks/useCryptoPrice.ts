import { useState, useEffect } from 'react';

export interface CryptoPrice {
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

export const useCryptoPrice = (coinId: string | null) => {
  const [price, setPrice] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl&include_24hr_change=true&include_last_updated_at=true`
      );
      
      if (!response.ok) {
        throw new Error('Falha ao buscar preço da criptomoeda');
      }
      
      const data = await response.json();
      
      if (data[id]) {
        setPrice({
          current_price: data[id].brl,
          price_change_24h: data[id].brl_24h_change || 0,
          price_change_percentage_24h: ((data[id].brl_24h_change || 0) / data[id].brl) * 100,
          last_updated: new Date(data[id].last_updated_at * 1000).toLocaleString('pt-BR'),
        });
      } else {
        throw new Error('Moeda não encontrada');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Error fetching crypto price:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coinId) {
      fetchPrice(coinId);
    } else {
      setPrice(null);
      setError(null);
    }
  }, [coinId]);

  return {
    price,
    loading,
    error,
    refetch: () => coinId && fetchPrice(coinId),
  };
};