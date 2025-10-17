
import React, { useState, useEffect } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartTooltip 
} from '@/components/ui/chart';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { cn } from '@/lib/utils';
import BitcoinModal from './BitcoinModal';

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
  const [modalOpen, setModalOpen] = useState(false);
  
  // Função para buscar dados históricos do Bitcoin (24h)
  const fetchBitcoinHistory = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      
      setSparklineData(historyData);
      
      // Calcular tendência baseada no primeiro e último preço das últimas 24h
      if (historyData.length >= 2) {
        const firstPrice = historyData[0].price;
        const lastPrice = historyData[historyData.length - 1].price;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        
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
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd'
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.bitcoin) {
        throw new Error('Dados de preço não encontrados');
      }
      
      const newPrices: PriceData = {
        brl: data.bitcoin.brl,
        usd: data.bitcoin.usd
      };
      
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
      await Promise.all([
        fetchBitcoinHistory(),
        fetchBitcoinPrice()
      ]);
    };
    
    fetchData();
    
    // Atualizar preço a cada 2 minutos
    const interval = setInterval(() => {
      fetchBitcoinPrice();
    }, 120000);
    
    // Atualizar histórico a cada 30 minutos
    const historyInterval = setInterval(() => {
      fetchBitcoinHistory();
    }, 1800000);
    
    return () => {
      clearInterval(interval);
      clearInterval(historyInterval);
    };
  }, []);
  
  // Função para alternar a moeda
  const toggleCurrency = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrency(prev => prev === 'BRL' ? 'USD' : 'BRL');
    setPriceChanged(true);
    setTimeout(() => setPriceChanged(false), 500);
  };

  // Função para abrir o modal
  const handleCardClick = () => {
    setModalOpen(true);
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
  
  const getTrendIcon = () => {
    switch (currentTrend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <TooltipHelper content={tooltipContent.dashboard.bitcoinCard}>
      <Card 
        className={`w-[320px] h-[140px] bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border border-orange-200/50 dark:border-orange-800/30 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${className}`}
        onClick={toggleCurrency}
      >
        <div className="p-5 h-full flex flex-col relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-2 right-2 text-6xl">₿</div>
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Bitcoin 
                  className="h-5 w-5 text-orange-600 dark:text-orange-400" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    Bitcoin
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    BTC
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${trendColor}20`, 
                      color: trendColor 
                    }}
                  >
                    {currency}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    24h
                  </span>
                </div>
              </div>
            </div>
            
            {/* Price and Change */}
            {isLoading ? (
              <div className="text-right">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="text-right">
                <div 
                  className={`text-xl font-bold ${priceChanged ? 'animate-pulse' : ''}`}
                  style={{ color: trendColor }}
                >
                  {currency === 'USD' 
                    ? `$${(currentPrice / 1000).toFixed(1)}k`
                    : `R$${(currentPrice / 1000).toFixed(0)}k`
                  }
                </div>
                {percentChange !== 0 && (
                  <div 
                    className="flex items-center justify-end gap-1 text-sm font-medium"
                    style={{ color: trendColor }}
                  >
                    {getTrendIcon()}
                    {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Enhanced Chart */}
          <div className="flex-1 w-full relative z-10 overflow-hidden">
            <ChartContainer
              config={{
                price: {
                  theme: {
                    light: trendColor,
                    dark: trendColor
                  }
                }
              }}
              className="h-full w-full"
            >
              <AreaChart 
                data={chartData} 
                margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
              >
                <defs>
                  <linearGradient id={`btcGradient-${currency}`} x2="0" y2="1">
                    <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
                    <stop offset="50%" stopColor={trendColor} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ChartTooltip 
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2 text-xs">
                          <p className="font-medium text-foreground">
                            {currency === 'USD' 
                              ? `$${value.toLocaleString()}`
                              : `R$${value.toLocaleString()}`
                            }
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(label).toLocaleTimeString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={trendColor}
                  strokeWidth={2}
                  fill={`url(#btcGradient-${currency})`}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ChartContainer>
          </div>
          
          {/* Subtle indicator dots */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `${trendColor}60` }}
            ></div>
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `${trendColor}40` }}
            ></div>
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `${trendColor}20` }}
            ></div>
          </div>
        </div>
      </Card>
    </TooltipHelper>
  );
};

export default BTCNowCard;
