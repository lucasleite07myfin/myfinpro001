import React, { useState, useEffect, useRef } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BitcoinModal from './BitcoinModal';

interface PriceData {
  brl: number;
  usd: number;
}

const BitcoinHeaderButton: React.FC = () => {
  const [prices, setPrices] = useState<PriceData>({ brl: 0, usd: 0 });
  const [percentChange, setPercentChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBitcoinData = async (signal: AbortSignal) => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd&include_24hr_change=true',
        { signal, headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      if (data.bitcoin) {
        setPrices({
          usd: data.bitcoin.usd ?? 0,
          brl: data.bitcoin.brl ?? 0,
        });
        setPercentChange(data.bitcoin.usd_24h_change ?? 0);
        setHasError(false);
      }
      setIsLoading(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Erro ao buscar dados do Bitcoin:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchBitcoinData(controller.signal);
    const interval = setInterval(() => {
      fetchBitcoinData(controller.signal);
    }, 60000); // 60s para respeitar rate limit do CoinGecko

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const isPositive = percentChange >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <>
      <Button 
        variant="ghost" 
        className="h-9 px-3 bg-black hover:bg-gray-800 text-white border border-gray-700 transition-all duration-200"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center gap-2">
          <Bitcoin className="h-4 w-4 text-yellow-500" />
          <div className="flex flex-col items-start text-xs">
            {isLoading ? (
              <span className="font-medium">...</span>
            ) : hasError ? (
              <div className="flex items-center gap-1 text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-[10px]">Indisponível</span>
              </div>
            ) : (
              <>
                <span className="font-medium">
                  ${(prices.usd / 1000).toFixed(1)}k
                </span>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendIcon className="h-2.5 w-2.5" />
                  <span className="text-[10px]">
                    {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Button>
      
      <BitcoinModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
};

export default BitcoinHeaderButton;
