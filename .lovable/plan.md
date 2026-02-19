

# Criar `src/utils/money.ts` -- Utilitario de valores monetarios em centavos

## Objetivo

Criar um arquivo utilitario que trata valores monetarios como inteiros em centavos, eliminando erros de ponto flutuante. Todas as funcoes usam apenas manipulacao de strings e aritmetica inteira -- nunca `parseFloat`.

## Arquivo a criar

### `src/utils/money.ts`

Contera:

| Funcao | Entrada | Saida | Exemplo |
|--------|---------|-------|---------|
| `normalizeCurrencyInputToDigits` | `"R$ 1.234,56"` | `"123456"` | Remove tudo que nao e digito |
| `currencyStringToCents` | `"R$ 1.234,56"` | `123456` | Usa normalize, converte para inteiro |
| `decimalStringToCents` | `"1234,56"` ou `"1234.56"` | `123456` | Split no separador, pad direita |
| `centsToDecimalString` | `123456` | `"1234.56"` | Divide string, sempre 2 casas |
| `formatBRLFromCents` | `123456` | `"R$ 1.234,56"` | Intl.NumberFormat em cents/100 |
| `formatNumberFromCentsForInput` | `123456` | `"1.234,56"` | Sem prefixo R$, para inputs |

## Detalhes tecnicos

- Tipo `MoneyCents = number` exportado para tipagem semantica
- `decimalStringToCents` faz split no separador (`,` ou `.`), pega parte inteira e parte decimal, faz pad/truncate para exatamente 2 digitos, e concatena como `parseInt(intPart + fracPart)`
- `centsToDecimalString` converte o inteiro para string, separa os 2 ultimos digitos como centavos, e monta `"parte.centavos"` -- trata sinal negativo
- `formatBRLFromCents` usa `Intl.NumberFormat` passando `cents / 100` (divisao inteira segura pois o resultado e usado apenas para formatacao de exibicao, nao para calculo)
- Nenhuma funcao usa `parseFloat`

## Impacto

- Nenhum arquivo existente e modificado nesta etapa
- Futuramente, `formatters.ts` e os services poderao migrar para usar estas funcoes

