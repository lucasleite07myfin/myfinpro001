

# Adicionar funções bridge em `src/utils/formatters.ts`

## Objetivo

Adicionar 4 novas funções que fazem ponte entre o código existente e o novo `money.ts`, sem alterar nenhuma função atual. Isso permite migração gradual.

## Alterações em `src/utils/formatters.ts`

### 1. Novo import (linha 1)

Adicionar import das funções e tipo de `./money`:

```typescript
import { currencyStringToCents, formatBRLFromCents, decimalStringToCents, MoneyCents } from './money';
```

### 2. Quatro novas funções ao final do arquivo

| Função | Descrição |
|--------|-----------|
| `formatCurrencyFromCents(cents)` | Wrapper para `formatBRLFromCents` -- retorna "R$ 1.234,56" |
| `parseCurrencyToCents(currencyString)` | Wrapper para `currencyStringToCents` -- retorna centavos inteiros |
| `formatCentsForCurrencyInput(cents)` | Retorna "R$ 0,00" para 0, senão usa `formatBRLFromCents` |
| `centsFromUnknownDbValue(value)` | Converte valor desconhecido do banco: number -> Math.round(value*100), string -> `decimalStringToCents`, null/undefined -> 0 |

### Detalhes técnicos

- `centsFromUnknownDbValue` usa `Math.round(value * 100)` para numbers porque o banco armazena em reais com decimais -- essa é a única multiplicação de float permitida (conversão de legado)
- `decimalStringToCents` já importado de `money.ts` para o caso de strings
- Nenhuma função existente é modificada ou removida
- O tipo `MoneyCents` é re-exportado via import para que consumidores possam usar

