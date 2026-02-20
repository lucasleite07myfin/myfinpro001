

# Fix: Texto sobreposto na tabela de Transacoes Recentes

## Problema

Na tabela de transacoes do Dashboard, descricoes longas, badges "Despesa Fixa" e categorias com nomes extensos estao se sobrepondo entre linhas. Isso acontece porque cada linha da tabela virtualizada tem altura fixa de 60px, mas o conteudo frequentemente precisa de mais espaco.

## Causa Raiz

O componente `TransactionsTable.tsx` usa virtualizacao (`@tanstack/react-virtual`) com `estimateSize: () => 60`, mas:
- Descricoes longas como "Documento de arrecadacao Municipal/ DAM" ocupam 2 linhas
- O badge "Despesa Fixa" adiciona uma linha extra dentro da celula
- Categorias como "Receita Federal / Prefeitura" quebram em 2 linhas
- Metodos de pagamento como "Transferencia Bancaria" tambem quebram

## Solucao

Combinar duas estrategias:

1. **Aumentar a altura estimada das linhas** de 60px para 72px para acomodar melhor o conteudo
2. **Truncar textos longos** com `truncate` para evitar que ultrapassem o espaco disponivel
3. **Limitar o badge** a ficar na mesma linha que a descricao, sem adicionar altura extra

## Detalhes Tecnicos

**Arquivo:** `src/components/TransactionsTable.tsx`

### Alteracoes:

1. **Linha 89** - Aumentar `estimateSize` de 60 para 72:
   ```
   estimateSize: () => 72
   ```

2. **Linha 169** - Descricao: trocar layout vertical por horizontal com truncamento:
   ```
   <div className="flex items-center gap-2 min-w-0">
     <span className="font-medium text-neutral-900 text-sm truncate">{sanitizeText(transaction.description)}</span>
     {renderBadge ? renderBadge(transaction) : defaultRenderBadge(transaction)}
   </div>
   ```

3. **Linha 64** - Badge: tornar mais compacto, sem quebra de linha:
   ```
   <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap shrink-0">
   ```

4. **Linha 174** - Categoria: adicionar truncamento:
   ```
   <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded-md truncate block max-w-[140px]">
   ```

5. **Linha 184** - Pagamento: adicionar `whitespace-nowrap`:
   ```
   <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md whitespace-nowrap">
   ```

Estas mudancas garantem que nenhum texto ultrapasse os limites da linha, eliminando a sobreposicao visual.
