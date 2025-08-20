import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bitcoin, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { toast } from 'sonner';

interface BitcoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CandlestickData {
  timestamp: number;
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isGreen: boolean;
}

interface BitcoinPrice {
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
}

const BitcoinModal: React.FC<BitcoinModalProps> = ({ open, onOpenChange }) => {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W' | '1M'>('1D');
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<BitcoinPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Mapear timeframes para dias da API
  const timeframeToDays = {
    '1H': 1,
    '4H': 1,
    '1D': 7,
    '1W': 30,
    '1M': 90
  };

  // Função para buscar dados do Bitcoin
  const fetchBitcoinData = async () => {
    setLoading(true);
    try {
      // Buscar preço atual com dados de mudança 24h
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false'
      );
      
      if (!priceResponse.ok) {
        throw new Error(`Erro na API de preços: ${priceResponse.status}`);
      }
      
      const priceData = await priceResponse.json();
      
      if (priceData.market_data) {
        const bitcoinPrice: BitcoinPrice = {
          current_price: priceData.market_data.current_price.usd,
          price_change_24h: priceData.market_data.price_change_24h || 0,
          price_change_percentage_24h: priceData.market_data.price_change_percentage_24h || 0,
          market_cap: priceData.market_data.market_cap.usd || 0,
          volume_24h: priceData.market_data.total_volume.usd || 0
        };
        setCurrentPrice(bitcoinPrice);
        setTrend(bitcoinPrice.price_change_percentage_24h >= 0 ? 'up' : 'down');
      }

      // Buscar dados históricos para candlestick
      const days = timeframeToDays[timeframe];
      const historyResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`
      );
      
      if (!historyResponse.ok) {
        throw new Error(`Erro na API de histórico: ${historyResponse.status}`);
      }
      
      const historyData = await historyResponse.json();

      if (Array.isArray(historyData) && historyData.length > 0) {
        const processedData: CandlestickData[] = historyData.map((item: number[]) => {
          const [timestamp, open, high, low, close] = item;
          const date = new Date(timestamp);
          const isGreen = close >= open;
          
          return {
            timestamp,
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            open,
            high,
            low,
            close,
            volume: Math.random() * 1000000000, // Volume simulado
            isGreen
          };
        });

        setCandlestickData(processedData);
      } else {
        throw new Error('Dados históricos não disponíveis');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Bitcoin:', error);
      toast.error('Usando dados simulados - API indisponível');
      
      // Dados de fallback mais realistas
      const basePrice = 105000;
      const mockCandlestickData: CandlestickData[] = [];
      
      // Gerar dados simulados baseados no timeframe
      const dataPoints = timeframe === '1H' ? 24 : timeframe === '4H' ? 24 : timeframe === '1D' ? 7 : timeframe === '1W' ? 4 : 12;
      
      for (let i = 0; i < dataPoints; i++) {
        const timestamp = Date.now() - (dataPoints - i) * (timeframe === '1H' ? 3600000 : timeframe === '4H' ? 14400000 : 86400000);
        const variation = (Math.random() - 0.5) * 5000;
        const open = basePrice + variation + (i * 200);
        const close = open + (Math.random() - 0.5) * 3000;
        const high = Math.max(open, close) + Math.random() * 1000;
        const low = Math.min(open, close) - Math.random() * 1000;
        
        mockCandlestickData.push({
          timestamp,
          date: new Date(timestamp).toLocaleDateString('pt-BR'),
          time: new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000000000,
          isGreen: close >= open
        });
      }
      
      setCandlestickData(mockCandlestickData);
      
      setCurrentPrice({
        current_price: basePrice,
        price_change_24h: 2500,
        price_change_percentage_24h: 2.4,
        market_cap: 2100000000000,
        volume_24h: 45000000000
      });
      setTrend('up');
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados quando o modal abrir ou timeframe mudar
  useEffect(() => {
    if (open) {
      fetchBitcoinData();
    }
  }, [open, timeframe]);

  // Componente customizado para renderizar candlestick
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close, isGreen } = payload;
    const color = isGreen ? '#22c55e' : '#ef4444';
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    // Calcular posições relativas
    const scale = height / (high - low);
    const wickX = x + width / 2;
    const bodyWidth = Math.max(width * 0.6, 2);
    const bodyX = x + (width - bodyWidth) / 2;
    
    const highY = y + (high - high) * scale;
    const lowY = y + (high - low) * scale;
    const openY = y + (high - open) * scale;
    const closeY = y + (high - close) * scale;
    const bodyTopY = Math.min(openY, closeY);
    const bodyBottomY = Math.max(openY, closeY);

    return (
      <g>
        {/* Pavio superior */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={bodyTopY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Pavio inferior */}
        <line
          x1={wickX}
          y1={bodyBottomY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Corpo da vela */}
        <rect
          x={bodyX}
          y={bodyTopY}
          width={bodyWidth}
          height={Math.max(bodyBottomY - bodyTopY, 1)}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Cores baseadas na tendência
  const getThemeColors = () => {
    return {
      primary: trend === 'up' ? '#22c55e' : '#ef4444',
      background: trend === 'up' ? 'from-green-50 to-emerald-50' : 'from-red-50 to-rose-50',
      border: trend === 'up' ? 'border-green-200' : 'border-red-200',
      text: trend === 'up' ? 'text-green-600' : 'text-red-600'
    };
  };

  const colors = getThemeColors();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className={`bg-gradient-to-br ${colors.background} ${colors.border} border-2`}>
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-white shadow-lg`}>
                  <Bitcoin className="h-8 w-8" style={{ color: colors.primary }} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Bitcoin (BTC/USD)
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="font-mono">
                      BITSTAMP
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Atualizado em tempo real
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Price Info */}
          {currentPrice && (
            <div className="px-6 pb-4">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Preço Atual</p>
                      <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                        ${currentPrice.current_price.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Variação 24h</p>
                      <div className="flex items-center gap-2">
                        {trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${colors.text}`}>
                          {trend === 'up' ? '+' : ''}
                          {currentPrice.price_change_percentage_24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Market Cap</p>
                      <p className="font-semibold">
                        ${(currentPrice.market_cap / 1e12).toFixed(2)}T
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Volume 24h</p>
                      <p className="font-semibold">
                        ${(currentPrice.volume_24h / 1e9).toFixed(2)}B
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeframe Selector */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(['1H', '4H', '1D', '1W', '1M'] as const).map((tf) => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeframe(tf)}
                    className={timeframe === tf ? '' : 'bg-white/80'}
                    style={timeframe === tf ? { backgroundColor: colors.primary } : {}}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBitcoinData}
                disabled={loading}
                className="bg-white/80"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>
            </div>
          </div>

          {/* Chart */}
          <div className="px-6 pb-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="h-96">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
                        <p className="text-gray-500">Carregando dados...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer
                        config={{
                          price: {
                            theme: {
                              light: colors.primary,
                              dark: colors.primary
                            }
                          }
                        }}
                      >
                        <AreaChart
                          data={candlestickData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={colors.primary} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#e5e7eb" 
                            strokeOpacity={0.3}
                            horizontal={true}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickMargin={10}
                          />
                          <YAxis 
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            tickMargin={10}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as CandlestickData;
                                return (
                                  <div className="bg-gray-900 text-white p-3 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
                                    <p className="font-semibold mb-2 text-sm">{label}</p>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-300">Preço:</span>
                                        <span className="font-mono font-semibold" style={{ color: colors.primary }}>
                                          ${data.close.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-300">Variação:</span>
                                        <span className={`font-mono ${data.isGreen ? 'text-green-400' : 'text-red-400'}`}>
                                          {data.isGreen ? '+' : ''}{((data.close - data.open) / data.open * 100).toFixed(2)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke={colors.primary}
                            strokeWidth={3}
                            fill="url(#priceGradient)"
                            dot={false}
                            activeDot={{ 
                              r: 6, 
                              fill: colors.primary,
                              stroke: '#ffffff',
                              strokeWidth: 2
                            }}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <div className="px-6 pb-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                Dados fornecidos pela CoinGecko API • Gráfico de linha em tempo real
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Design inspirado nos widgets da Apple • Linha suave com gradiente de preenchimento
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BitcoinModal;
