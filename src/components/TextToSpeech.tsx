import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TextToSpeechProps {
  text?: string;
  autoRead?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showControls?: boolean;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({
  text,
  autoRead = false,
  className = '',
  variant = 'outline',
  size = 'sm',
  showControls = true
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    // Verificar se o navegador suporta Web Speech API
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Carregar vozes disponíveis
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Preferir voz em português brasileiro
        const ptBrVoice = availableVoices.find(voice => 
          voice.lang === 'pt-BR' || voice.lang.startsWith('pt')
        );
        
        if (ptBrVoice) {
          setSelectedVoice(ptBrVoice);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0]);
        }
      };

      // Carregar vozes imediatamente
      loadVoices();
      
      // Algumas vezes as vozes não carregam imediatamente
      speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      toast.error('Seu navegador não suporta síntese de voz');
    }

    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (autoRead && text && isSupported && selectedVoice) {
      handleSpeak();
    }
  }, [autoRead, text, isSupported, selectedVoice]);

  const handleSpeak = () => {
    if (!isSupported || !text?.trim()) {
      toast.error('Não há texto para ler ou recurso não suportado');
      return;
    }

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar voz
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Configurações de fala
    utterance.rate = 0.9; // Velocidade (0.1 - 10)
    utterance.pitch = 1; // Tom (0 - 2)
    utterance.volume = 0.8; // Volume (0 - 1)
    utterance.lang = 'pt-BR'; // Idioma

    // Event listeners
    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Erro na síntese de voz:', event);
      setIsReading(false);
      setIsPaused(false);
      toast.error('Erro ao reproduzir áudio');
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  };

  const handleResume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  };

  const handleStop = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsReading(false);
      setIsPaused(false);
    }
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => handleSpeak(), 100);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showControls && (
        <>
          {!isReading ? (
            <Button
              variant={variant}
              size={size}
              onClick={handleSpeak}
              disabled={!text?.trim()}
              className="flex items-center gap-1"
              title="Ler texto em voz alta"
            >
              <Volume2 className="h-4 w-4" />
              {size !== 'icon' && 'Ouvir'}
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              {!isPaused ? (
                <Button
                  variant={variant}
                  size={size}
                  onClick={handlePause}
                  className="flex items-center gap-1"
                  title="Pausar leitura"
                >
                  <Pause className="h-4 w-4" />
                  {size !== 'icon' && 'Pausar'}
                </Button>
              ) : (
                <Button
                  variant={variant}
                  size={size}
                  onClick={handleResume}
                  className="flex items-center gap-1"
                  title="Continuar leitura"
                >
                  <Play className="h-4 w-4" />
                  {size !== 'icon' && 'Continuar'}
                </Button>
              )}

              <Button
                variant={variant}
                size={size}
                onClick={handleStop}
                className="flex items-center gap-1"
                title="Parar leitura"
              >
                <VolumeX className="h-4 w-4" />
                {size !== 'icon' && 'Parar'}
              </Button>

              <Button
                variant={variant}
                size={size}
                onClick={handleRestart}
                className="flex items-center gap-1"
                title="Reiniciar leitura"
              >
                <RotateCcw className="h-4 w-4" />
                {size !== 'icon' && 'Reiniciar'}
              </Button>
            </div>
          )}

          {isReading && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              {isPaused ? 'Pausado' : 'Lendo...'}
            </Badge>
          )}
        </>
      )}

      {voices.length > 0 && showControls && (
        <select
          value={selectedVoice?.name || ''}
          onChange={(e) => {
            const voice = voices.find(v => v.name === e.target.value);
            setSelectedVoice(voice || null);
          }}
          className="text-xs border rounded px-2 py-1 bg-background"
          title="Selecionar voz"
        >
          {voices
            .filter(voice => voice.lang.startsWith('pt') || voice.lang.startsWith('en'))
            .map(voice => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
        </select>
      )}
    </div>
  );
};

export default TextToSpeech;