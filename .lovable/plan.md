
# Relatorio de Bugs e Erros Encontrados

## Bug 1: CORS - API Binance bloqueada (CRITICO)

**Arquivo:** `src/components/BitcoinHeaderButton.tsx` (linhas 19-22)

O componente `BitcoinHeaderButton` faz chamadas diretas a `https://api.binance.com/api/v3/ticker/24hr` que sao bloqueadas por CORS em producao. Isso gera dezenas de erros no console em TODAS as paginas, pois o componente esta no Header global.

**Impacto:** O botao de Bitcoin no header mostra dados fallback estaticos ($105.0k, +2.5%) em vez de dados reais. Os erros CORS se repetem a cada 30 segundos (intervalo configurado na linha 49), poluindo o console continuamente.

**Solucao:** Migrar as chamadas da Binance API para usar a mesma CoinGecko API que ja e usada com sucesso no `BTCNowCard.tsx` e `useCryptoPriceUpdater.ts`. CoinGecko permite CORS de qualquer origem. Alternativamente, criar uma backend function (edge function) que faz proxy das chamadas Binance.

---

## Bug 2: Duplicacao de chamadas Binance (useEffect sem cleanup adequado)

**Arquivo:** `src/components/BitcoinHeaderButton.tsx` (linhas 47-51)

Os logs mostram chamadas DUPLICADAS para a Binance API (4 erros simultaneos ao inves de 2). Isso sugere que o componente esta sendo montado duas vezes (React StrictMode) e o efeito nao esta cancelando chamadas fetch pendentes ao desmontar.

**Solucao:** Adicionar AbortController no useEffect para cancelar fetch pendentes, similar ao padrao ja usado em `useCryptoPriceUpdater.ts`.

---

## Bug 3: Inconsistencia de APIs para dados Bitcoin

**Arquivos:**
- `BitcoinHeaderButton.tsx` - usa Binance API (com CORS)
- `BTCNowCard.tsx` - usa CoinGecko API (funciona)
- `useCryptoPriceUpdater.ts` - usa CoinGecko API (funciona)
- `useCryptoPrice.ts` - usa CoinGecko API (funciona)

**Impacto:** Tres componentes usam CoinGecko (que funciona) e um usa Binance (que nao funciona). Isso cria inconsistencia nos dados mostrados e erros desnecessarios.

**Solucao:** Unificar todas as chamadas de preco Bitcoin para usar CoinGecko API, eliminando a dependencia da Binance.

---

## Bug 4: Dados hardcoded no fallback do Bitcoin Header

**Arquivo:** `src/components/BitcoinHeaderButton.tsx` (linhas 41-42)

Quando a API Binance falha (que e SEMPRE em producao por causa do CORS), o componente usa valores fixos:
```
setPrices({ brl: 600000, usd: 105000 });
setPercentChange(2.5);
```

O usuario ve "$105.0k +2.5%" que parece real mas e totalmente falso e nunca muda. Isso pode induzir o usuario a erro sobre o preco atual do Bitcoin.

**Solucao:** Alem de corrigir a API, o fallback deveria mostrar um indicador visual de que os dados nao estao atualizados (ex: icone de aviso ou texto "dados indisponiveis").

---

## Bug 5: `symbolToIdMap` duplicado

**Arquivo:** `src/hooks/useCryptoPriceUpdater.ts`

O mapeamento `symbolToIdMap` e definido duas vezes identico no mesmo arquivo (linhas 44-74 e linhas 136-146). Isso e codigo duplicado que aumenta a manutencao e risco de divergencia.

**Solucao:** Extrair o mapeamento para uma constante no topo do arquivo ou em um arquivo utilitario compartilhado.

---

## Bug 6: CSS hardcoded para tema claro no CategoryCombobox

**Arquivo:** `src/components/CategoryCombobox.tsx` (linha 100)

```
className="w-full justify-between bg-white border-gray-300..."
```

Usa `bg-white` e `border-gray-300` hardcoded em vez de tokens de tema como `bg-background` e `border-border`. Se dark mode for implementado, este componente nao respeitara o tema.

---

## Resumo de Prioridades

| # | Bug | Severidade | Esforco |
|---|-----|-----------|---------|
| 1 | CORS Binance API | Critico | Baixo |
| 2 | Fetch duplicado | Medio | Baixo |
| 3 | APIs inconsistentes | Medio | Baixo |
| 4 | Fallback enganoso | Medio | Baixo |
| 5 | Codigo duplicado | Baixo | Baixo |
| 6 | CSS hardcoded | Baixo | Baixo |

## Plano de Correcao

### Passo 1: Corrigir BitcoinHeaderButton.tsx
- Substituir chamadas Binance API por CoinGecko API (mesma usada em BTCNowCard)
- Adicionar AbortController para cleanup do useEffect
- Melhorar fallback com indicador visual de dados indisponiveis

### Passo 2: Extrair symbolToIdMap
- Criar constante compartilhada em `src/utils/cryptoMappings.ts`
- Atualizar `useCryptoPriceUpdater.ts` para usar a constante

### Passo 3: Corrigir CSS do CategoryCombobox
- Substituir `bg-white` por `bg-background`
- Substituir `border-gray-300` por `border-border`

## Detalhes Tecnicos da Correcao Principal

O `BitcoinHeaderButton.tsx` sera alterado para usar:
```
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd&include_24hr_change=true
```

Em vez de:
```
https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
https://api.binance.com/api/v3/ticker/24hr?symbol=BTCBRL
```

Isso reduz de 2 chamadas para 1 e elimina completamente os erros CORS.
