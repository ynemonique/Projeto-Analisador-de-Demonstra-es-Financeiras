import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Helper to check and retrieve the Gemini client lazily
let geminiClient = null;

function getGeminiClient() {
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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { pdfBase64, filename } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF enviado ou dados inválidos.' });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyError) {
      return res.status(401).json({
        error: 'Chave de API não configurada',
        message: 'A chave GEMINI_API_KEY não foi encontrada nos Segredos da Vercel ou do ambiente. Por favor, adicione sua chave de API nas variáveis de ambiente da Vercel (Settings > Environment Variables) com o nome GEMINI_API_KEY para habilitar a análise em tempo real.'
      });
    }

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        anoAtual: {
          type: Type.OBJECT,
          properties: {
            ano: { type: Type.INTEGER },
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
        anoAnterior: {
          type: Type.OBJECT,
          properties: {
            ano: { type: Type.INTEGER },
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
        indicadoresAtual: {
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
        relatorio: {
          type: Type.OBJECT,
          properties: {
            empresaNome: { type: Type.STRING },
            periodoAnalisado: { type: Type.STRING },
            moeda: { type: Type.STRING },
            resumoGeral: { type: Type.STRING },
            destaquesPositivos: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            pontosAtencao: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            notasExplicativasDestaques: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recomendacoesConsultor: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
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

    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      }
    };

    const textPart = {
      text: promptText
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [pdfPart, textPart],
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.1,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('O modelo Gemini não retornou nenhum texto.');
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.status(200).json(parsedData);

  } catch (error) {
    console.error('[Serverless] Erro ao analisar PDF:', error);
    return res.status(500).json({ 
      error: 'Falha na análise das demonstrações', 
      message: error.message || 'Erro inesperado ao processar o arquivo PDF contábil no servidor.' 
    });
  }
}
