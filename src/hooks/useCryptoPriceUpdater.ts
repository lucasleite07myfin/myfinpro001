import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset } from '@/types/finance';
import { logger } from '@/utils/logger';
import { SYMBOL_TO_COINGECKO_ID } from '@/utils/cryptoMappings';

interface CryptoPriceData {
  [coinId: string]: {
    brl: number;
    brl_24h_change: number;
    last_updated_at: number;
  };
}

interface CryptoPriceUpdaterOptions {
  updateInterval?: number; // em segundos
  maxRetries?: number;
  enabled?: boolean;
}

export const useCryptoPriceUpdater = (
  cryptoAssets: Asset[],
  onPriceUpdate: (assetId: string, price: number, change24h: number, lastUpdated: Date) => void,
  options: CryptoPriceUpdaterOptions = {}
) => {
  const {
    updateInterval = 120, // 120 segundos (2 minutos) por padrão - otimizado para reduzir API calls
    maxRetries = 3,
    enabled = true
  } = options;

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache para evitar muitas chamadas desnecessárias
  const cacheRef = useRef<Map<string, { price: number; timestamp: number }>>(new Map());
  const CACHE_DURATION = 15000; // 15 segundos de cache

  const getCoinIds = useCallback(() => {
    return cryptoAssets
      .filter(asset => asset.type === 'Cripto' && asset.symbol)
      .map(asset => SYMBOL_TO_COINGECKO_ID[asset.symbol!.toUpperCase()] || asset.symbol!.toLowerCase())
      .filter((id, index, array) => array.indexOf(id) === index)
      .slice(0, 250);
  }, [cryptoAssets]);

  const updatePrices = useCallback(async () => {
    const coinIds = getCoinIds();
    
    if (coinIds.length === 0 || !enabled) {
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsUpdating(true);
    setError(null);

    try {
      // Verificar cache primeiro
      const now = Date.now();
      const cachedIds = coinIds.filter(id => {
        const cached = cacheRef.current.get(id);
        return cached && (now - cached.timestamp) < CACHE_DURATION;
      });

      const idsToFetch = coinIds.filter(id => !cachedIds.includes(id));

      if (idsToFetch.length > 0) {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=brl&include_24hr_change=true&include_last_updated_at=true`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data: CryptoPriceData = await response.json();

        // Atualizar cache
        Object.entries(data).forEach(([coinId, priceData]) => {
          cacheRef.current.set(coinId, {
            price: priceData.brl,
            timestamp: now
          });
        });

        // Usar mapeamento compartilhado

        // Atualizar preços dos assets
        cryptoAssets.forEach(asset => {
          if (asset.type === 'Cripto' && asset.symbol) {
            const coinId = SYMBOL_TO_COINGECKO_ID[asset.symbol.toUpperCase()] || asset.symbol.toLowerCase();
            const priceData = data[coinId];
            
            if (priceData) {
              const newPrice = priceData.brl;
              const change24h = priceData.brl_24h_change || 0;
              const lastUpdated = new Date(priceData.last_updated_at * 1000);
              
              onPriceUpdate(asset.id, newPrice, change24h, lastUpdated);
            }
          }
        });
      }

      setLastUpdateTime(new Date());
      setRetryCount(0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Requisição cancelada, não é erro
      }

      logger.error('Error updating crypto prices:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Implementar retry com backoff exponencial
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          updatePrices();
        }, delay);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [cryptoAssets, onPriceUpdate, enabled, getCoinIds, retryCount, maxRetries]);

  // Função para atualização manual
  const manualUpdate = useCallback(() => {
    setRetryCount(0);
    updatePrices();
  }, [updatePrices]);

  // Configurar intervalo de atualização
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Primeira atualização imediata
    updatePrices();

    // Configurar intervalo
    intervalRef.current = setInterval(updatePrices, updateInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [updatePrices, updateInterval, enabled]);

  // Cleanup quando componente desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isUpdating,
    lastUpdateTime,
    error,
    manualUpdate,
    retryCount,
    maxRetries
  };
};