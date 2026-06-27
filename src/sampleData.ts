/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisResponse } from './types';

export const sampleFinancialData: AnalysisResponse = {
  anoAtual: {
    ano: '2025',
    ativoCirculante: 12500000,
    ativoNaoCirculante: 8200000,
    ativoTotal: 20700000,
    passivoCirculante: 7800000,
    passivoNaoCirculante: 4500000,
    patrimonioLiquido: 8400000,
    passivoTotal: 20700000,
    receitaLiquida: 24500000,
    lucroBruto: 9800000,
    ebitda: 3800000,
    lucroLiquido: 2100000,
  },
  anoAnterior: {
    ano: '2024',
    ativoCirculante: 10800000,
    ativoNaoCirculante: 7500000,
    ativoTotal: 18300000,
    passivoCirculante: 7200000,
    passivoNaoCirculante: 4100000,
    patrimonioLiquido: 7000000,
    passivoTotal: 18300000,
    receitaLiquida: 21200000,
    lucroBruto: 8100000,
    ebitda: 2900000,
    lucroLiquido: 1400000,
  },
  indicadoresAtual: {
    liquidezCorrente: {
      valor: 1.60,
      status: 'Bom',
      analise: 'A empresa possui R$ 1,60 de ativos circulantes para cada R$ 1,00 de obrigações de curto prazo, o que indica uma margem de segurança confortável para honrar seus compromissos imediatos.'
    },
    liquidezGeral: {
      valor: 1.02,
      status: 'Regular',
      analise: 'A liquidez geral de 1,02 mostra que no longo prazo a empresa cobre suas obrigações totais, mas a margem é estreita, exigindo monitoramento da conversão de ativos de longo prazo.'
    },
    margemBruta: {
      valor: 40.0,
      status: 'Excelente',
      analise: 'Uma margem bruta robusta de 40%, refletindo excelente poder de precificação e controle rígido sobre o Custo dos Bens Vendidos (COGS).'
    },
    margemLiquida: {
      valor: 8.57,
      status: 'Bom',
      analise: 'A margem líquida de 8,57% é sólida para o segmento comercial, mostrando boa conversão de receita bruta em lucro real após despesas operacionais, financeiras e tributárias.'
    },
    roe: {
      valor: 25.0,
      status: 'Excelente',
      analise: 'Retorno sobre o Patrimônio Líquido de 25% indica alta atratividade e eficiência na remuneração do capital próprio investido pelos acionistas.'
    },
    roa: {
      valor: 10.14,
      status: 'Bom',
      analise: 'Retorno sobre o Ativo de 10,14% demonstra que a empresa utiliza seus ativos totais (infraestrutura, estoque e caixa) de forma produtiva para gerar resultados.'
    },
    endividamento: {
      valor: 59.42,
      status: 'Regular',
      analise: 'O endividamento de 59,42% indica que pouco mais da metade dos ativos é financiada por capital de terceiros. Embora aceitável, recomenda-se atenção ao custo financeiro dessas dívidas.'
    }
  },
  indicadoresAnterior: {
    liquidezCorrente: {
      valor: 1.50,
      status: 'Bom',
      analise: 'No ano anterior, a liquidez de 1,50 já era saudável, tendo evoluído positivamente para 1,60 em 2025.'
    },
    liquidezGeral: {
      valor: 0.99,
      status: 'Regular',
      analise: 'Abaixo de 1,00 no ano anterior (0,99), indicando que as obrigações totais superavam ligeiramente o realizável de curto e longo prazo somados.'
    },
    margemBruta: {
      valor: 38.21,
      status: 'Bom',
      analise: 'Margem bruta de 38,21% em 2024, apresentando expansão de 1,79 ponto percentual no exercício atual.'
    },
    margemLiquida: {
      valor: 6.60,
      status: 'Regular',
      analise: 'A margem líquida era de 6,60% e expandiu de forma notável devido ao ganho de escala operacional (alavancagem operacional).'
    },
    roe: {
      valor: 20.0,
      status: 'Bom',
      analise: 'O retorno sobre o capital próprio subiu de 20% para 25%, refletindo expressivo aumento da rentabilidade.'
    },
    roa: {
      valor: 7.65,
      status: 'Regular',
      analise: 'Retorno de 7,65% sobre os ativos no ano anterior, com evolução significativa em 2025.'
    },
    endividamento: {
      valor: 61.75,
      status: 'Regular',
      analise: 'O endividamento total diminuiu ligeiramente de 61,75% para 59,42%, reduzindo o perfil de risco financeiro da empresa.'
    }
  },
  relatorio: {
    empresaNome: 'Aliança Comercial & Industrial S.A.',
    periodoAnalisado: 'Exercício de 2025 (Comparativo com 2024)',
    moeda: 'R$ (Real)',
    resumoGeral: 'A Aliança Comercial & Industrial S.A. apresentou um excelente desempenho financeiro no exercício de 2025. O destaque absoluto foi o crescimento de 15,5% na Receita Líquida aliado a uma expansão de margens operacionais, indicando eficiência produtiva e excelente aceitação de mercado. A posição de liquidez de curto prazo melhorou de 1,50 para 1,60, conferindo maior resiliência financeira. O endividamento recuou sutilmente, passando a ser financiado em maior parte pelo reinvestimento de lucros, consolidando uma estrutura de capital mais saudável.',
    destaquesPositivos: [
      'Expansão expressiva de 50% no Lucro Líquido (de R$ 1,4M para R$ 2,1M) demonstrando alavancagem operacional.',
      'Melhoria do indicador de Liquidez Corrente para 1,60, reduzindo o risco de insolvência de curto prazo.',
      'Margem bruta altamente robusta de 40%, sugerindo sólida vantagem competitiva e eficácia na negociação com fornecedores.',
      'ROE excelente de 25% que posiciona a empresa no quartil superior de rentabilidade do setor.'
    ],
    pontosAtencao: [
      'Apesar da melhora, a Liquidez Geral (1,02) permanece próxima de 1,00, indicando pouca folga financeira em horizontes de longo prazo.',
      'O passivo circulante cresceu de R$ 7,2M para R$ 7,8M, exigindo atenção contínua ao fluxo de caixa operacional diário.',
      'A dependência de capital de terceiros representa 59,42% dos recursos totais da companhia.'
    ],
    notasExplicativasDestaques: [
      'Nota Explicativa nº 8 (Estoques): Registrou aumento no giro de estoques com redução do prazo médio de estocagem de 45 para 38 dias.',
      'Nota Explicativa nº 14 (Financiamentos): Amortização relevante de dívidas indexadas ao CDI com Alongamento do perfil do endividamento para longo prazo.',
      'Nota Explicativa nº 22 (Contingências): Há contingências fiscais classificadas como de perda possível no montante de R$ 450 mil, sem necessidade de provisionamento contábil.'
    ],
    recomendacoesConsultor: [
      'Priorizar o alongamento do perfil do endividamento remanescente de curto prazo para o longo prazo, aliviando a pressão sobre o capital de giro.',
      'Aproveitar a geração de caixa robusta para constituir uma reserva financeira estratégica que melhore o índice de Liquidez Geral.',
      'Aprimorar a política de concessão de crédito a clientes para mitigar riscos de inadimplência, dado o aumento nas contas a receber indicado nas notas explicativas.'
    ]
  }
};
