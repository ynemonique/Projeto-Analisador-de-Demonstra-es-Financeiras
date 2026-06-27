/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to support uploading PDFs converted to base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to check and retrieve the Gemini client lazily
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Primary Endpoint for PDF Statement Analysis
app.post('/api/analyze-pdf', async (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF enviado ou dados inválidos.' });
    }

    console.log(`[Backend] Iniciando análise do PDF: ${filename || 'documento.pdf'}`);

    // Check if key is configured, if not, return custom error to alert user elegantly in frontend
    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (keyError) {
      console.warn('[Backend] GEMINI_API_KEY não configurada ou inválida. Retornando erro amigável.');
      return res.status(401).json({
        error: 'Chave de API não configurada',
        message: 'A chave GEMINI_API_KEY não foi encontrada nos Segredos do AI Studio. Por favor, adicione-a no painel de configurações (Settings > Secrets) para habilitar o processamento em tempo real.'
      });
    }

    // Define the structured JSON response schema to get consistent type-safe financial figures
    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        // Dados Financeiros do Ano Atual (exercício mais recente)
        anoAtual: {
          type: Type.OBJECT,
          properties: {
            ano: { type: Type.STRING, description: "O ano correspondente ao exercício mais recente (ex: '2025')" },
            
            // Balanço Patrimonial (Ativo)
            ativoCirculante: { type: Type.NUMBER, description: "Total do Ativo Circulante" },
            ativoNaoCirculante: { type: Type.NUMBER, description: "Total do Ativo Não Circulante" },
            ativoTotal: { type: Type.NUMBER, description: "Total do Ativo (Ativo Circulante + Não Circulante)" },
            
            // Balanço Patrimonial (Passivo e PL)
            passivoCirculante: { type: Type.NUMBER, description: "Total do Passivo Circulante" },
            passivoNaoCirculante: { type: Type.NUMBER, description: "Total do Passivo Não Circulante" },
            patrimonioLiquido: { type: Type.NUMBER, description: "Total do Patrimônio Líquido" },
            passivoTotal: { type: Type.NUMBER, description: "Total do Passivo + PL (deve coincidir exatamente com Ativo Total)" },
            
            // Demonstração do Resultado (DRE)
            receitaLiquida: { type: Type.NUMBER, description: "Receita Líquida de Vendas/Serviços" },
            lucroBruto: { type: Type.NUMBER, description: "Lucro Bruto operacional" },
            ebitda: { type: Type.NUMBER, description: "EBITDA calculado (Lucro Operacional antes de Juros, Impostos, Depreciação e Amortização). Se não listado explicitamente, calcule uma estimativa razoável baseada no resultado operacional somando depreciação/amortização se listadas." },
            lucroLiquido: { type: Type.NUMBER, description: "Lucro Líquido (ou Prejuízo) do Exercício" }
          },
          required: [
            "ano", "ativoCirculante", "ativoNaoCirculante", "ativoTotal", 
            "passivoCirculante", "passivoNaoCirculante", "patrimonioLiquido", "passivoTotal",
            "receitaLiquida", "lucroBruto", "ebitda", "lucroLiquido"
          ]
        },

        // Dados Financeiros do Ano Anterior (exercício comparativo)
        anoAnterior: {
          type: Type.OBJECT,
          properties: {
            ano: { type: Type.STRING, description: "O ano anterior comparativo (ex: '2024')" },
            ativoCirculante: { type: Type.NUMBER },
            ativoNaoCirculante: { type: Type.NUMBER },
            ativoTotal: { type: Type.NUMBER },
            passivoCirculante: { type: Type.NUMBER },
            passivoNaoCirculante: { type: Type.NUMBER },
            patrimonioLiquido: { type: Type.NUMBER },
            passivoTotal: { type: Type.NUMBER },
            receitaLiquida: { type: Type.NUMBER },
            lucroBruto: { type: Type.NUMBER },
            ebitda: { type: Type.NUMBER },
            lucroLiquido: { type: Type.NUMBER }
          },
          required: [
            "ano", "ativoCirculante", "ativoNaoCirculante", "ativoTotal", 
            "passivoCirculante", "passivoNaoCirculante", "patrimonioLiquido", "passivoTotal",
            "receitaLiquida", "lucroBruto", "ebitda", "lucroLiquido"
          ]
        },

        // Análise de Indicadores (Qualitativo para Ano Atual)
        indicadoresAtual: {
          type: Type.OBJECT,
          properties: {
            liquidezCorrente: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "Liquidez Corrente calculada (Ativo Circulante / Passivo Circulante), arredondada para duas casas decimais." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Breve explicação contábil do resultado para o gestor." }
              },
              required: ["valor", "status", "analise"]
            },
            liquidezGeral: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "Liquidez Geral calculada (Ativo Circulante + Realizável LP) / (Passivo Circulante + Não Circulante)." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Análise contábil deste índice de longo prazo." }
              },
              required: ["valor", "status", "analise"]
            },
            margemBruta: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "Margem Bruta em porcentagem (Lucro Bruto / Receita Líquida * 100)." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Análise sobre o poder de precificação e lucratividade industrial/comercial bruta." }
              },
              required: ["valor", "status", "analise"]
            },
            margemLiquida: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "Margem Líquida em porcentagem (Lucro Líquido / Receita Líquida * 100)." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Análise da margem líquida pós despesas operacionais, tributárias e financeiras." }
              },
              required: ["valor", "status", "analise"]
            },
            roe: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "ROE em porcentagem (Lucro Líquido / Patrimônio Líquido * 100)." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Análise da taxa de retorno sobre o capital próprio investido pelos sócios." }
              },
              required: ["valor", "status", "analise"]
            },
            roa: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "ROA em porcentagem (Lucro Líquido / Ativo Total * 100)." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Análise do retorno gerado sobre cada real de ativos totais investidos." }
              },
              required: ["valor", "status", "analise"]
            },
            endividamento: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER, description: "Endividamento Geral em porcentagem (Passivo Circulante + Não Circulante) / Ativo Total * 100." },
                status: { type: Type.STRING, description: "Excelente, Bom, Regular ou Crítico" },
                analise: { type: Type.STRING, description: "Análise da estrutura de capital e dependência de capitais de terceiros." }
              },
              required: ["valor", "status", "analise"]
            }
          },
          required: ["liquidezCorrente", "liquidezGeral", "margemBruta", "margemLiquida", "roe", "roa", "endividamento"]
        },

        // Análise de Indicadores (Qualitativo para Ano Anterior)
        indicadoresAnterior: {
          type: Type.OBJECT,
          properties: {
            liquidezCorrente: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            },
            liquidezGeral: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            },
            margemBruta: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            },
            margemLiquida: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            },
            roe: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            },
            roa: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            },
            endividamento: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.NUMBER },
                status: { type: Type.STRING },
                analise: { type: Type.STRING }
              },
              required: ["valor", "status", "analise"]
            }
          },
          required: ["liquidezCorrente", "liquidezGeral", "margemBruta", "margemLiquida", "roe", "roa", "endividamento"]
        },

        // Relatório Executivo
        relatorio: {
          type: Type.OBJECT,
          properties: {
            empresaNome: { 
              type: Type.STRING, 
              description: "Nome oficial da empresa ou razão social descrita no cabeçalho das demonstrações contábeis." 
            },
            periodoAnalisado: { 
              type: Type.STRING, 
              description: "Período analisado, por exemplo, 'Exercício de 2025 (Comparativo com 2024)'." 
            },
            moeda: { 
              type: Type.STRING, 
              description: "A moeda e unidade monetária do relatório (ex: 'R$ (Milhares)' ou 'R$ (Real)')." 
            },
            resumoGeral: { 
              type: Type.STRING, 
              description: "Relatório executivo narrativo e resumido focado em apresentar os resultados aos gestores e tomadores de decisão de forma clara e descomplicada." 
            },
            destaquesPositivos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 a 5 principais destaques positivos ou melhorias em relação ao ano anterior (ex: crescimento de receita, ganho de margem)."
            },
            pontosAtencao: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 a 5 pontos críticos ou de atenção que exigem cuidado do gestor (ex: aumento de passivo circulante, margens apertadas)."
            },
            notasExplicativasDestaques: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista contendo os pontos mais relevantes ou curiosidades contábeis extraídas das Notas Explicativas do PDF (ex: contingências judiciais, critérios de estoques, novos financiamentos)."
            },
            recomendacoesConsultor: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recomendações práticas e acionáveis feitas por um consultor contábil especialista para melhorar a saúde financeira da empresa (mínimo 3 conselhos)."
            }
          },
          required: [
            "empresaNome", "periodoAnalisado", "moeda", "resumoGeral", 
            "destaquesPositivos", "pontosAtencao", "notasExplicativasDestaques", "recomendacoesConsultor"
          ]
        }
      },
      required: [
        "anoAtual", "anoAnterior", 
        "indicadoresAtual", "indicadoresAnterior", 
        "relatorio"
      ]
    };

    const promptText = `
Você é um consultor contábil e analista financeiro sênior altamente qualificado.
Seu objetivo é analisar as demonstrações contábeis contidas no arquivo PDF anexo (que inclui o Balanço Patrimonial, a DRE - Demonstração do Resultado do Exercício, a DFC, a DMPL e as Notas Explicativas).

Instruções para extração e análise:
1. Extraia o nome da empresa e identifique o ano atual (mais recente) e o ano anterior (comparativo).
2. Localize as contas do Balanço Patrimonial (Ativo Circulante, Ativo Não Circulante, Ativo Total, Passivo Circulante, Passivo Não Circulante, Patrimônio Líquido e Passivo Total) para os dois anos. Garanta que Ativo Total seja igual a Passivo Total + PL para ambos os anos.
3. Localize as contas da DRE (Receita Líquida, Lucro Bruto, EBITDA e Lucro Líquido) para os dois anos.
4. Se os valores do PDF forem apresentados em Milhares de Reais (R$ mil) ou Milhões, mantenha a proporcionalidade consistente em todo o JSON, mas represente-os como números reais absolutos equivalentes ou como declarados. Especifique no campo "moeda" se está em reais absolutos ou em milhares de reais.
5. Calcule os indicadores financeiros fundamentais conforme fórmulas tradicionais de análise de balanço e defina o status (Excelente, Bom, Regular ou Crítico) baseando-se nos padrões de mercado. Escreva análises contundentes, fáceis de entender para um gestor que NÃO entende de contabilidade profunda (linguagem corporativa amigável, transparente e focado em tomada de decisões).
6. Leia atentamente as NOTAS EXPLICATIVAS para extrair de 3 a 5 fatos de extrema relevância (ex: regras de depreciação, contingências ativas/passivas, empréstimos contraídos, garantias prestadas) e liste-os em 'notasExplicativasDestaques'.
7. Forneça um resumo executivo brilhante sobre a evolução financeira geral, listando pontos fortes (destaques positivos), pontos fracos/riscos (pontos de atenção) e recomendações consultivas muito realistas.

Tudo deve ser fornecido estritamente em Português do Brasil. Garanta que todos os valores numéricos sejam representados puramente como números (sem símbolos de moeda ou porcentagem dentro do valor numérico).
`;

    // Process using inline PDF data for native multimodal reading
    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      }
    };

    const textPart = {
      text: promptText
    };

    // Make the API call to gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [pdfPart, textPart],
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.1, // low temperature for highly analytical factual extraction
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('O modelo Gemini não retornou nenhum texto.');
    }

    // Parse the parsed JSON response
    const parsedData = JSON.parse(responseText.trim());
    console.log('[Backend] Análise concluída com sucesso!');
    
    return res.json(parsedData);

  } catch (error: any) {
    console.error('[Backend] Erro ao analisar PDF:', error);
    return res.status(500).json({ 
      error: 'Falha na análise das demonstrações', 
      message: error.message || 'Erro inesperado ao processar o arquivo PDF contábil no servidor.' 
    });
  }
});

// Setup Vite development server or serve built bundle in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Backend] Iniciado em modo de Desenvolvimento com middleware Vite.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Backend] Iniciado em modo de Produção servindo arquivos estáticos de dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] Servidor rodando com sucesso no endereço: http://localhost:${PORT}`);
  });
}

startServer();
