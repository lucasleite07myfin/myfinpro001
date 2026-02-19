

# Corrigir exibicao de "&#x2F;" no lugar de "/" em categorias e descricoes

## Problema
A funcao `sanitizeText` em `src/utils/xssSanitizer.ts` codifica a barra `/` como `&#x2F;`. Como o React ja faz escape automatico de texto em JSX, essa codificacao dupla faz com que `&#x2F;` apareca literalmente na tela em vez de `/`.

Isso afeta qualquer texto que contenha `/` e passe por `sanitizeText()`, como:
- Categorias: "Receita Federal / Prefeitura" aparece como "Receita Federal &#x2F; Prefeitura"
- Descricoes: "Jardinagem/ Sr. Raimundo" aparece como "Jardinagem&#x2F; Sr. Raimundo"

## Solucao
Remover a linha `.replace(/\//g, '&#x2F;')` da funcao `sanitizeText`. A barra `/` nao representa risco de XSS em contexto de texto, e o React ja protege automaticamente contra injecao de HTML.

## Detalhes tecnicos

**Arquivo:** `src/utils/xssSanitizer.ts`

Remover a ultima linha do bloco de replace na funcao `sanitizeText` (linha 25):
```typescript
// ANTES
return sanitized
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;')
  .replace(/\//g, '&#x2F;');  // <-- remover esta linha

// DEPOIS
return sanitized
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;');
```

Nenhum outro arquivo precisa ser alterado. A correcao resolve o problema em todos os locais que usam `sanitizeText()`.

