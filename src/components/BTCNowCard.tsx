
import React, { useState, useEffect } from 'react';
import { Bitcoin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartTooltip 
} from '@/components/ui/chart';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

interface BTCNowCardProps {
  className?: string;
}

interface PriceData {
  brl: number;
  usd: number;
}

interface HistoryItem {
  timestamp: string;
  price: number;
  time: number;
}

const BTCNowCard: React.FC<BTCNowCardProps> = ({ className }) => {
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('USD');
  const [prices, setPrices] = useState<PriceData>({ brl: 0, usd: 0 });
  const [sparklineData, setSparklineData] = useState<HistoryItem[]>([]);
  const [priceChanged, setPriceChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrend, setCurrentTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [percentChange, setPercentChange] = useState<number>(0);
  
  // Função para buscar dados históricos do Bitcoin (24h)
  const fetchBitcoinHistory = async () => {
    try {
      console.log('Buscando dados históricos do Bitcoin...');
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados históricos recebidos:', data);
      
      if (!data.prices || !Array.isArray(data.prices)) {
        throw new Error('Formato de dados inválido');
      }
      
      const pricesData = data.prices;
      
      // Converter dados para formato do gráfico
      const historyData = pricesData.map(([timestamp, priceValue]: [number, number]) => ({
        timestamp: new Date(timestamp).toISOString(),
        price: priceValue,
        time: timestamp
      }));
      
      console.log('Dados históricos processados:', historyData.length, 'pontos');
      setSparklineData(historyData);
      
      // Calcular tendência baseada no primeiro e último preço das últimas 24h
      if (historyData.length >= 2) {
        const firstPrice = historyData[0].price;
        const lastPrice = historyData[historyData.length - 1].price;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        console.log(`Tendência calculada: ${change.toFixed(2)}% (${firstPrice} -> ${lastPrice})`);
        setPercentChange(change);
        setCurrentTrend(change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');
      }
      
    } catch (error) {
      console.error('Erro ao buscar histórico do Bitcoin:', error);
      // Fallback para dados mockados realistas
      const basePrice = 45000;
      const mockData = Array.from({ length: 24 }, (_, i) => {
        const variation = Math.sin(i * 0.3) * 3000 + (Math.random() - 0.5) * 2000;
        const price = basePrice + variation + (i * 100); // Tendência ligeiramente ascendente
        return {
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          price: price,
          time: Date.now() - (23 - i) * 60 * 60 * 1000
        };
      });
      
      setSparklineData(mockData);
      // Calcular tendência dos dados mockados
      const change = ((mockData[mockData.length - 1].price - mockData[0].price) / mockData[0].price) * 100;
      setPercentChange(change);
      setCurrentTrend(change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');
    }
  };
  
  // Função para buscar preço atual do Bitcoin
  const fetchBitcoinPrice = async () => {
    try {
      console.log('Buscando preço atual do Bitcoin...');
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd'
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Preço atual recebido:', data);
      
      if (!data.bitcoin) {
        throw new Error('Dados de preço não encontrados');
      }
      
      const newPrices: PriceData = {
        brl: data.bitcoin.brl,
        usd: data.bitcoin.usd
      };
      
      console.log('Preços atualizados:', newPrices);
      setPrices(newPrices);
      setPriceChanged(true);
      
      // Reset da animação
      setTimeout(() => setPriceChanged(false), 500);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Erro ao buscar preço do Bitcoin:', error);
      toast.error('Falha ao carregar dados do Bitcoin');
      setIsLoading(false);
      
      // Fallback com preços realistas
      setPrices({ brl: 600000, usd: 105000 });
    }
  };
  
  // Efeito para buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      console.log('Iniciando busca de dados...');
      await Promise.all([
        fetchBitcoinHistory(),
        fetchBitcoinPrice()
      ]);
    };
    
    fetchData();
    
    // Atualizar preço a cada 2 minutos
    const interval = setInterval(() => {
      console.log('Atualizando preço (intervalo)...');
      fetchBitcoinPrice();
    }, 120000);
    
    // Atualizar histórico a cada 30 minutos
    const historyInterval = setInterval(() => {
      console.log('Atualizando histórico (intervalo)...');
      fetchBitcoinHistory();
    }, 1800000);
    
    return () => {
      clearInterval(interval);
      clearInterval(historyInterval);
    };
  }, []);
  
  // Função para alternar a moeda
  const toggleCurrency = () => {
    console.log(`Alternando moeda de ${currency} para ${currency === 'BRL' ? 'USD' : 'BRL'}`);
    setCurrency(prev => prev === 'BRL' ? 'USD' : 'BRL');
    setPriceChanged(true);
    setTimeout(() => setPriceChanged(false), 500);
  };

  // Determinar a cor baseada na tendência
  const getTrendColor = () => {
    switch (currentTrend) {
      case 'up': return '#22c55e'; // Verde
      case 'down': return '#ef4444'; // Vermelho
      default: return '#64748b'; // Cinza neutro
    }
  };

  // Obter preço atual baseado na moeda selecionada
  const getCurrentPrice = () => {
    return currency === 'BRL' ? prices.brl : prices.usd;
  };

  // Converter dados do gráfico se necessário (para BRL)
  const getChartData = () => {
    if (currency === 'USD') {
      return sparklineData;
    } else {
      // Converter USD para BRL usando a taxa atual
      const usdToBrlRate = prices.brl / prices.usd;
      return sparklineData.map(item => ({
        ...item,
        price: item.price * usdToBrlRate
      }));
    }
  };

  const trendColor = getTrendColor();
  const currentPrice = getCurrentPrice();
  const chartData = getChartData();
  
  return (
    <TooltipHelper content={tooltipContent.dashboard.bitcoinCard}>
      <Card 
        className={`w-[280px] h-[100px] bg-transparent border-0 shadow-none overflow-hidden hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer transition-all duration-200 ${className}`}
        onClick={toggleCurrency}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header com BTC separado do valor e moeda */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bitcoin 
                className="h-4 w-4" 
                style={{ color: trendColor }}
              />
              <span 
                className="font-medium text-sm"
                style={{ color: trendColor }}
              >
                BTC
              </span>
            </div>
            
            {isLoading ? (
              <div className="text-sm text-gray-400">...</div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Valor com moeda ao lado */}
                <div className="flex items-center gap-2">
                  <div 
                    className={`text-sm font-semibold ${priceChanged ? 'animate-pulse' : ''}`}
                    style={{ color: trendColor }}
                  >
                    {currency === 'USD' 
                      ? `$${(currentPrice / 1000).toFixed(1)}k`
                      : `R$${(currentPrice / 1000).toFixed(0)}k`
                    }
                  </div>
                  <span 
                    className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-gray-700"
                    style={{ color: trendColor }}
                  >
                    {currency}
                  </span>
                </div>
                
                {/* Percentual de mudança */}
                {percentChange !== 0 && (
                  <div 
                    className="text-xs font-medium"
                    style={{ color: trendColor }}
                  >
                    {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Gráfico ocupando o espaço restante */}
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer
                config={{
                  price: {
                    theme: {
                      light: trendColor,
                      dark: trendColor
                    }
                  }
                }}
              >
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`btcGradient-${currency}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={trendColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={trendColor}
                    strokeWidth={1.2}
                    fill={`url(#btcGradient-${currency})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </TooltipHelper>
  );
};

export default BTCNowCard;
