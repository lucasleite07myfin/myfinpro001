import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChartBar, FileSpreadsheet, FileText, PlusCircle } from 'lucide-react';
import { formatCurrency, formatMonth } from '@/utils/formatters';
import MonthSelector from '@/components/MonthSelector';
import StatsCard from '@/components/StatsCard';
import { toast } from '@/components/ui/sonner';

// Tipo para a DRE
interface DREItem {
  id: string;
  name: string;
  value: number;
  isTotal?: boolean;
  isFormula?: boolean;
  isEditable?: boolean;
  isNegative?: boolean;
  isSubItem?: boolean;
  parentId?: string;
  formula?: () => number;
}

interface DeducaoVendas {
  id: string;
  name: string;
  value: number;
}

interface DespesaOperacional {
  id: string;
  name: string;
  value: number;
}

const DRE: React.FC = () => {
  const { currentMonth, setCurrentMonth } = useBusiness();
  const [aliquotaImposto, setAliquotaImposto] = useState(0.15); // 15% padrão
  const [receitaBruta, setReceitaBruta] = useState(25000);
  const [cmv, setCmv] = useState(8000);
  const [receitasFinanceiras, setReceitasFinanceiras] = useState(500);
  const [despesasFinanceiras, setDespesasFinanceiras] = useState(1200);

  // Estados para linhas personalizáveis
  const [deducoesVendas, setDeducoesVendas] = useState<DeducaoVendas[]>([
    { id: '1', name: 'Impostos sobre Vendas', value: 2750 },
    { id: '2', name: 'Devoluções', value: 500 },
    { id: '3', name: 'Descontos Comerciais', value: 300 }
  ]);

  const [despesasOperacionais, setDespesasOperacionais] = useState<DespesaOperacional[]>([
    { id: '1', name: 'Despesas com Vendas', value: 3200 },
    { id: '2', name: 'Despesas Administrativas', value: 4500 },
    { id: '3', name: 'Despesas Gerais', value: 2100 }
  ]);

  // Cálculos da DRE
  const totalDeducoes = useMemo(() => {
    return deducoesVendas.reduce((acc, item) => acc + item.value, 0);
  }, [deducoesVendas]);

  const receitaLiquida = useMemo(() => {
    return receitaBruta - totalDeducoes;
  }, [receitaBruta, totalDeducoes]);

  const lucroBruto = useMemo(() => {
    return receitaLiquida - cmv;
  }, [receitaLiquida, cmv]);

  const totalDespesasOperacionais = useMemo(() => {
    return despesasOperacionais.reduce((acc, item) => acc + item.value, 0);
  }, [despesasOperacionais]);

  const resultadoOperacional = useMemo(() => {
    return lucroBruto - totalDespesasOperacionais;
  }, [lucroBruto, totalDespesasOperacionais]);

  const resultadoFinanceiro = useMemo(() => {
    return receitasFinanceiras - despesasFinanceiras;
  }, [receitasFinanceiras, despesasFinanceiras]);

  const ebt = useMemo(() => {
    return resultadoOperacional + resultadoFinanceiro;
  }, [resultadoOperacional, resultadoFinanceiro]);

  const impostoRenda = useMemo(() => {
    return ebt > 0 ? ebt * aliquotaImposto : 0;
  }, [ebt, aliquotaImposto]);

  const lucroLiquido = useMemo(() => {
    return ebt - impostoRenda;
  }, [ebt, impostoRenda]);

  // Funções para adicionar novas linhas
  const adicionarDeducao = () => {
    const novaDeducao = {
      id: `${deducoesVendas.length + 1}`,
      name: `Nova Dedução ${deducoesVendas.length + 1}`,
      value: 0
    };
    setDeducoesVendas([...deducoesVendas, novaDeducao]);
  };

  const adicionarDespesa = () => {
    const novaDespesa = {
      id: `${despesasOperacionais.length + 1}`,
      name: `Nova Despesa ${despesasOperacionais.length + 1}`,
      value: 0
    };
    setDespesasOperacionais([...despesasOperacionais, novaDespesa]);
  };

  // Funções para atualizar valores
  const atualizarDeducao = (id: string, campo: keyof DeducaoVendas, valor: any) => {
    setDeducoesVendas(deducoes => 
      deducoes.map(item => 
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  };

  const atualizarDespesa = (id: string, campo: keyof DespesaOperacional, valor: any) => {
    setDespesasOperacionais(despesas => 
      despesas.map(item => 
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  };

  // Funções para exportar
  const exportarExcel = () => {
    // Em um sistema real, aqui iria a lógica para gerar o arquivo Excel
    toast.success("Arquivo Excel gerado com sucesso!");
  };

  const exportarPDF = () => {
    // Em um sistema real, aqui iria a lógica para gerar o arquivo PDF
    toast.success("Arquivo PDF gerado com sucesso!");
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ChartBar className="mr-2" /> DRE - Demonstração do Resultado do Exercício
            </h1>
            <p className="text-muted-foreground">
              Análise detalhada das receitas e despesas do período
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MonthSelector
              value={currentMonth}
              onChange={setCurrentMonth}
            />
            <Button onClick={exportarExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button onClick={exportarPDF} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* Painel Resumido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Receita Líquida"
            value={receitaLiquida}
            isCurrency={true}
            isPositive={true}
          />
          <StatsCard
            title="Lucro Bruto"
            value={lucroBruto}
            isCurrency={true}
            isPositive={lucroBruto > 0}
          />
          <StatsCard
            title="Lucro Líquido"
            value={lucroLiquido}
            isCurrency={true}
            isPositive={lucroLiquido > 0}
          />
        </div>

        {/* Tabela DRE */}
        <Card>
          <CardHeader className="bg-neutral-50 border-b">
            <CardTitle className="text-lg">DRE - {formatMonth(currentMonth)}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-2/3">Descrição</TableHead>
                    <TableHead className="w-1/3 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Receita Bruta */}
                  <TableRow className="hover:bg-neutral-50">
                    <TableCell className="font-medium">Receita Bruta</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={receitaBruta}
                        onChange={(e) => setReceitaBruta(Number(e.target.value))}
                        className="text-right w-40 ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Deduções de Vendas */}
                  <TableRow className="bg-neutral-100 hover:bg-neutral-50">
                    <TableCell className="font-medium flex items-center justify-between">
                      (-) Deduções de Vendas
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={adicionarDeducao}
                        className="flex items-center gap-1"
                      >
                        <PlusCircle className="h-4 w-4" /> Linha
                      </Button>
                    </TableCell>
                    <TableCell className="text-right font-medium text-expense">
                      {formatCurrency(totalDeducoes)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Itens de Deduções */}
                  {deducoesVendas.map((deducao) => (
                    <TableRow key={deducao.id} className="hover:bg-neutral-50">
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        <Input
                          value={deducao.name}
                          onChange={(e) => atualizarDeducao(deducao.id, 'name', e.target.value)}
                          className="border-dashed"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={deducao.value}
                          onChange={(e) => atualizarDeducao(deducao.id, 'value', Number(e.target.value))}
                          className="text-right w-40 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Receita Líquida */}
                  <TableRow className="font-medium hover:bg-neutral-50">
                    <TableCell>Receita Líquida</TableCell>
                    <TableCell className="text-right">{formatCurrency(receitaLiquida)}</TableCell>
                  </TableRow>
                  
                  {/* CMV */}
                  <TableRow className="hover:bg-neutral-50">
                    <TableCell className="font-medium">(-) CMV (Custo das Mercadorias Vendidas)</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={cmv}
                        onChange={(e) => setCmv(Number(e.target.value))}
                        className="text-right w-40 ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Lucro Bruto */}
                  <TableRow className="font-medium hover:bg-neutral-50">
                    <TableCell>Lucro Bruto</TableCell>
                    <TableCell className={`text-right ${lucroBruto >= 0 ? 'text-green-600' : 'text-expense'}`}>
                      {formatCurrency(lucroBruto)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Despesas Operacionais */}
                  <TableRow className="bg-neutral-100 hover:bg-neutral-50">
                    <TableCell className="font-medium flex items-center justify-between">
                      (-) Despesas Operacionais
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={adicionarDespesa}
                        className="flex items-center gap-1"
                      >
                        <PlusCircle className="h-4 w-4" /> Linha
                      </Button>
                    </TableCell>
                    <TableCell className="text-right font-medium text-expense">
                      {formatCurrency(totalDespesasOperacionais)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Itens de Despesas */}
                  {despesasOperacionais.map((despesa) => (
                    <TableRow key={despesa.id} className="hover:bg-neutral-50">
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        <Input
                          value={despesa.name}
                          onChange={(e) => atualizarDespesa(despesa.id, 'name', e.target.value)}
                          className="border-dashed"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={despesa.value}
                          onChange={(e) => atualizarDespesa(despesa.id, 'value', Number(e.target.value))}
                          className="text-right w-40 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Resultado Operacional (EBIT) */}
                  <TableRow className="font-medium hover:bg-neutral-50">
                    <TableCell>Resultado Operacional (EBIT)</TableCell>
                    <TableCell className={`text-right ${resultadoOperacional >= 0 ? 'text-green-600' : 'text-expense'}`}>
                      {formatCurrency(resultadoOperacional)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Receitas Financeiras */}
                  <TableRow className="hover:bg-neutral-50">
                    <TableCell>Receitas Financeiras</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={receitasFinanceiras}
                        onChange={(e) => setReceitasFinanceiras(Number(e.target.value))}
                        className="text-right w-40 ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Despesas Financeiras */}
                  <TableRow className="hover:bg-neutral-50">
                    <TableCell>(-) Despesas Financeiras</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={despesasFinanceiras}
                        onChange={(e) => setDespesasFinanceiras(Number(e.target.value))}
                        className="text-right w-40 ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Resultado Financeiro */}
                  <TableRow className="font-medium hover:bg-neutral-50">
                    <TableCell>Resultado Financeiro</TableCell>
                    <TableCell className={`text-right ${resultadoFinanceiro >= 0 ? 'text-green-600' : 'text-expense'}`}>
                      {formatCurrency(resultadoFinanceiro)}
                    </TableCell>
                  </TableRow>
                  
                  {/* EBT */}
                  <TableRow className="font-medium hover:bg-neutral-50">
                    <TableCell>EBT (Lucro antes dos Impostos)</TableCell>
                    <TableCell className={`text-right ${ebt >= 0 ? 'text-green-600' : 'text-expense'}`}>
                      {formatCurrency(ebt)}
                    </TableCell>
                  </TableRow>
                  
                  {/* IR/CSLL */}
                  <TableRow className="hover:bg-neutral-50">
                    <TableCell className="flex items-center gap-2">
                      (-) IR/CSLL
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">Alíquota:</span>
                        <Input
                          type="number"
                          value={aliquotaImposto * 100}
                          onChange={(e) => setAliquotaImposto(Number(e.target.value) / 100)}
                          className="w-16 text-center"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-expense">
                      {formatCurrency(impostoRenda)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Lucro Líquido */}
                  <TableRow className="font-medium text-lg hover:bg-neutral-50">
                    <TableCell>Lucro Líquido</TableCell>
                    <TableCell className={`text-right ${lucroLiquido >= 0 ? 'text-green-600' : 'text-expense'}`}>
                      {formatCurrency(lucroLiquido)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DRE;
