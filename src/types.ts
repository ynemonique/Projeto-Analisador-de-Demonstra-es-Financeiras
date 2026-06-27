/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FinancialDataYear {
  ano: string;
  
  // Balanço Patrimonial (BP)
  ativoCirculante: number;
  ativoNaoCirculante: number;
  ativoTotal: number;
  
  passivoCirculante: number;
  passivoNaoCirculante: number;
  patrimonioLiquido: number;
  passivoTotal: number; // Passivo + PL
  
  // Demonstração do Resultado (DRE)
  receitaLiquida: number;
  lucroBruto: number;
  ebitda: number;
  lucroLiquido: number;
}

export interface IndicatorDetail {
  valor: number;
  status: 'Excelente' | 'Bom' | 'Regular' | 'Crítico';
  analise: string;
}

export interface FinancialIndicators {
  liquidezCorrente: IndicatorDetail;
  liquidezGeral: IndicatorDetail;
  margemBruta: IndicatorDetail;
  margemLiquida: IndicatorDetail;
  roe: IndicatorDetail;
  roa: IndicatorDetail;
  endividamento: IndicatorDetail;
}

export interface ExecutiveReport {
  empresaNome: string;
  periodoAnalisado: string;
  moeda: string;
  resumoGeral: string;
  destaquesPositivos: string[];
  pontosAtencao: string[];
  notasExplicativasDestaques: string[];
  recomendacoesConsultor: string[];
}

export interface AnalysisResponse {
  anoAtual: FinancialDataYear;
  anoAnterior: FinancialDataYear;
  indicadoresAtual: FinancialIndicators;
  indicadoresAnterior: FinancialIndicators;
  relatorio: ExecutiveReport;
}
