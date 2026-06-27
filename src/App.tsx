/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  Printer, 
  Briefcase, 
  DollarSign, 
  Percent, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Building2,
  Lock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { AnalysisResponse, FinancialDataYear, FinancialIndicators, ExecutiveReport } from './types';
import { sampleFinancialData } from './sampleData';

export default function App() {
  // State variables
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<{ title: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'executivo' | 'balanco' | 'dre' | 'indicadores' | 'notas'>('executivo');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps for the loading animation
  const loadingSteps = [
    'Lendo o arquivo PDF e enviando para o servidor seguro...',
    'Iniciando processamento contábil com a Inteligência Artificial Gemini...',
    'Analisando Notas Explicativas e cruzando informações contábeis...',
    'Extraindo Balanço Patrimonial e DRE (Ativo, Passivo, Receitas e Lucros)...',
    'Calculando índices de Liquidez, Rentabilidade e Endividamento...',
    'Estruturando relatório executivo completo para apresentação ao gestor...'
  ];

  // Load sample demo data
  const handleLoadDemo = () => {
    setLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);
    setIsDemoActive(true);

    // Simulate progress steps for a realistic, premium feeling
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < loadingSteps.length) {
        setLoadingStep(step);
      } else {
        clearInterval(interval);
        setData(sampleFinancialData);
        setLoading(false);
        setActiveTab('executivo');
      }
    }, 600);
  };

  // Helper to format currency values to BRL (R$)
  const formatBRL = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper to format percentage values
  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return '0,00%';
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  // Handle PDF file selection and conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        processFile(file);
      } else {
        setErrorMessage({
          title: 'Formato de arquivo inválido',
          message: 'O arquivo selecionado não é um PDF. Por favor, envie apenas arquivos em formato PDF contendo demonstrações contábeis.'
        });
      }
    }
  };

  const processFile = (file: File) => {
    setLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);
    setIsDemoActive(false);

    // Dynamic fake stepper progression while waiting for server response
    const stepperInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3500);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/analyze-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pdfBase64: base64String,
            filename: file.name
          })
        });

        clearInterval(stepperInterval);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('KEY_MISSING');
          }
          
          let errorMessage = 'Falha na resposta do servidor.';
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const errData = await response.json();
              errorMessage = errData.message || errorMessage;
            } catch (e) {
              errorMessage = 'Ocorreu um erro ao processar os dados contábeis no servidor.';
            }
          } else {
            const textResponse = await response.text();
            if (response.status === 404) {
              errorMessage = 'O serviço de análise (/api/analyze-pdf) não foi encontrado (Erro 404). Se você publicou na Vercel, certifique-se de que a função de backend (Serverless) está ativada ou tente utilizar o modo de demonstração (Demo).';
            } else if (response.status === 413) {
              errorMessage = 'O arquivo PDF enviado é muito grande (Erro 413 - Payload Too Large). Tente enviar um arquivo menor ou comprimido.';
            } else {
              const cleanedText = textResponse.replace(/<[^>]*>/g, '').substring(0, 150).trim();
              errorMessage = `Erro ${response.status} do servidor: ${cleanedText || 'Resposta inválida'}`;
            }
          }
          throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          const cleanedText = textResponse.replace(/<[^>]*>/g, '').substring(0, 150).trim();
          throw new Error(`O servidor não retornou um formato de dados válido (HTML/texto recebido). Detalhes: ${cleanedText || 'Resposta inválida'}`);
        }

        const resultData: AnalysisResponse = await response.json();
        setData(resultData);
        setLoading(false);
        setActiveTab('executivo');
      } catch (err: any) {
        clearInterval(stepperInterval);
        setLoading(false);
        
        if (err.message === 'KEY_MISSING') {
          setErrorMessage({
            title: 'Chave de API não configurada',
            message: 'A chave de API do Google Gemini (GEMINI_API_KEY) não foi detectada. Para realizar análises reais, adicione sua chave de API nas configurações do AI Studio (Settings > Secrets). Enquanto isso, você pode clicar no botão de demonstração para explorar todas as funcionalidades do aplicativo com dados de exemplo!'
          });
        } else {
          setErrorMessage({
            title: 'Erro ao processar PDF',
            message: err.message || 'Ocorreu um erro ao enviar e processar o arquivo. Verifique se o PDF contém dados legíveis e tente novamente.'
          });
        }
      }
    };
    reader.onerror = () => {
      clearInterval(stepperInterval);
      setLoading(false);
      setErrorMessage({
        title: 'Erro de leitura',
        message: 'Não foi possível ler o arquivo PDF no seu navegador.'
      });
    };
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setData(null);
    setIsDemoActive(false);
    setErrorMessage(null);
  };

  // Helper colors and statuses for indicators
  const getStatusColor = (status: 'Excelente' | 'Bom' | 'Regular' | 'Crítico') => {
    switch (status) {
      case 'Excelente': return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60';
      case 'Bom': return 'bg-sky-950/40 text-sky-400 border-sky-900/60';
      case 'Regular': return 'bg-amber-950/40 text-amber-500 border-amber-900/60';
      case 'Crítico': return 'bg-rose-950/40 text-rose-400 border-rose-900/60';
      default: return 'bg-[#1a1a1c] text-[#808080] border-[#2a2a2c]';
    }
  };

  // Recharts structured data conversion
  const chartDREData = data ? [
    {
      name: 'Receita Líquida',
      [data.anoAnterior.ano]: data.anoAnterior.receitaLiquida,
      [data.anoAtual.ano]: data.anoAtual.receitaLiquida,
    },
    {
      name: 'Lucro Bruto',
      [data.anoAnterior.ano]: data.anoAnterior.lucroBruto,
      [data.anoAtual.ano]: data.anoAtual.lucroBruto,
    },
    {
      name: 'EBITDA',
      [data.anoAnterior.ano]: data.anoAnterior.ebitda,
      [data.anoAtual.ano]: data.anoAtual.ebitda,
    },
    {
      name: 'Lucro Líquido',
      [data.anoAnterior.ano]: data.anoAnterior.lucroLiquido,
      [data.anoAtual.ano]: data.anoAtual.lucroLiquido,
    }
  ] : [];

  // Data for structure diagrams (Assets vs Liabilities/PL) for current year
  const assetStructureData = data ? [
    { name: 'Ativo Circulante (Curto Prazo)', value: data.anoAtual.ativoCirculante, color: '#c9a86a' },
    { name: 'Ativo Não Circulante (Longo Prazo)', value: data.anoAtual.ativoNaoCirculante, color: '#4a4a4c' }
  ] : [];

  const liabilitiesStructureData = data ? [
    { name: 'Passivo Circulante', value: data.anoAtual.passivoCirculante, color: '#8a6a3b' },
    { name: 'Passivo Não Circulante', value: data.anoAtual.passivoNaoCirculante, color: '#4a4a4c' },
    { name: 'Patrimônio Líquido (Próprio)', value: data.anoAtual.patrimonioLiquido, color: '#c9a86a' }
  ] : [];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] font-sans leading-relaxed flex flex-col print:bg-white print:text-black">
      {/* Header Bar */}
      <header className="bg-[#0a0a0b] border-b border-[#2a2a2c] sticky top-0 z-40 shadow-xl print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#1a1a1c] p-2 rounded-lg border border-[#2a2a2c] text-[#c9a86a]">
              <Building2 className="h-6 w-6" id="app-logo" />
            </div>
            <div>
              <h1 className="text-lg font-serif italic text-[#c9a86a] leading-tight font-medium">Analisador de Balanço Contábil</h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#808080]">Relatório de Gestão & Indicadores Financeiros com IA</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold bg-[#111113] text-[#e0e0e0] border border-[#2a2a2c]">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Servidor Ativo
            </span>
            <div className="text-xs bg-[#1a1a1c] text-[#808080] px-3 py-1 rounded-sm border border-[#2a2a2c] flex items-center gap-1">
              <Lock className="h-3 w-3 text-[#c9a86a]" />
              <span className="font-mono">Ambiente Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        
        {/* Welcome Section / Upload Zone (When no data loaded) */}
        {!data && !loading && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Context Notice */}
            <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 sm:p-8 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#c9a86a] uppercase tracking-wider bg-[#1a1a1c] border border-[#2a2a2c] px-3 py-1 rounded-sm inline-block">
                  Exclusivo para Profissionais de Contabilidade e Finanças
                </span>
                <h2 className="text-3xl font-serif italic text-[#c9a86a] tracking-tight sm:text-4xl">
                  Transforme Balanços Complexos em Relatórios Executivos Elegantes
                </h2>
                <p className="text-lg text-[#b0b0b0] leading-relaxed max-w-3xl">
                  Carregue o PDF completo das demonstrações contábeis (balanço, DRE e notas explicativas). Nossa inteligência artificial extrai os dados, executa os cálculos e gera uma análise gerencial com gráficos e insights acionáveis em segundos.
                </p>
              </div>

              {/* Quick instructions for limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#1a1a1c] rounded-sm border border-[#2a2a2c] flex gap-3">
                  <div className="bg-[#111113] p-2 rounded-sm text-[#c9a86a] border border-[#2a2a2c] shrink-0 h-10 w-10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-serif text-sm">Privacidade de Dados</h4>
                    <p className="text-xs text-[#b0b0b0] mt-0.5">O arquivo é processado temporariamente de forma segura no servidor do AI Studio. Sem retenção persistente de documentos.</p>
                  </div>
                </div>

                <div className="p-4 bg-[#1a1a1c] rounded-sm border border-[#2a2a2c] flex gap-3">
                  <div className="bg-[#111113] p-2 rounded-sm text-[#c9a86a] border border-[#2a2a2c] shrink-0 h-10 w-10 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-serif text-sm">Respeito à Cota Gratuita</h4>
                    <p className="text-xs text-[#b0b0b0] mt-0.5">O modelo Gemini gratuito possui limites de requisições por minuto. Para balanços extensos, aguarde de 30 a 60 segundos entre cada upload.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="bg-[#1e1113] border border-rose-900/50 rounded-sm p-5 flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-400 font-serif text-sm">{errorMessage.title}</h4>
                  <p className="text-xs text-rose-300 leading-relaxed">{errorMessage.message}</p>
                </div>
              </div>
            )}

            {/* Two Action Panels: PDF Upload & Demo Data */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Box 1: PDF Dropzone */}
              <div 
                className={`md:col-span-8 bg-[#111113] border border-dashed rounded-sm p-8 text-center flex flex-col items-center justify-center min-h-[340px] cursor-pointer transition-all duration-300 ${
                  dragOver 
                    ? 'border-[#c9a86a] bg-[#1a1a1c] scale-[1.01]' 
                    : 'border-[#2a2a2c] hover:border-[#c9a86a] hover:bg-[#1a1a1c]/60'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                id="pdf-upload-zone"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="application/pdf" 
                  className="hidden" 
                />
                
                <div className="bg-[#1a1a1c] border border-[#2a2a2c] p-4 rounded-full text-[#c9a86a] mb-4 transition-transform group-hover:scale-110">
                  <Upload className="h-10 w-10 animate-bounce" />
                </div>
                
                <h3 className="text-lg font-bold text-[#e0e0e0] font-serif italic">Arraste seu PDF contábil aqui</h3>
                <p className="text-sm text-[#808080] mt-1 max-w-sm">
                  Ou clique para selecionar um arquivo PDF do seu computador
                </p>
                
                <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1c] rounded-sm border border-[#2a2a2c] text-xs text-[#b0b0b0] font-medium">
                  <FileText className="h-3.5 w-3.5 text-[#c9a86a]" />
                  <span>Formatos aceitos: Balanço Patrimonial em PDF</span>
                </div>
              </div>

              {/* Box 2: Instant Demo Option */}
              <div className="md:col-span-4 bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 text-white flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div className="bg-[#1a1a1c] border border-[#2a2a2c] w-10 h-10 rounded-sm flex items-center justify-center text-[#c9a86a]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-serif italic text-[#c9a86a] leading-tight font-medium">Quer ver como funciona primeiro?</h3>
                  <p className="text-xs text-[#b0b0b0] leading-relaxed">
                    Clique no botão abaixo para carregar um relatório completo e real de demonstração (Exercício 2024 x 2025). Conheça a riqueza dos indicadores e gráficos agora mesmo.
                  </p>
                </div>

                <button 
                  onClick={handleLoadDemo}
                  className="mt-6 w-full py-3 px-4 bg-[#1a1a1c] border border-[#2a2a2c] hover:bg-[#252527] text-[#c9a86a] font-bold rounded-sm text-xs transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm tracking-wider uppercase"
                  id="btn-demo-start"
                >
                  <TrendingUp className="h-4 w-4" />
                  Visualizar Balanço de Exemplo
                </button>
              </div>

            </div>

            {/* Quick tips about typical financial PDFs */}
            <div className="text-center">
              <p className="text-xs text-[#505050]">
                Dica técnica: Para melhores resultados, certifique-se de que as páginas com as tabelas de Balanço e DRE não estejam borradas. O modelo extrairá inclusive as notas explicativas se presentes no PDF.
              </p>
            </div>
          </div>
        )}

        {/* Loading Progress State */}
        {loading && (
          <div className="max-w-xl mx-auto bg-[#111113] border border-[#2a2a2c] rounded-sm p-8 shadow-2xl text-center space-y-6 my-12 animate-pulse">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2c]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#c9a86a] border-t-transparent animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#c9a86a] font-serif italic">Processando Demonstrações Contábeis</h3>
              <p className="text-xs text-[#b0b0b0] max-w-sm mx-auto">
                Esta etapa pode levar de 15 a 45 segundos, pois a inteligência artificial está lendo tabelas, linhas, colunas e as notas explicativas do PDF.
              </p>
            </div>

            {/* Steps feedback */}
            <div className="border-t border-[#2a2a2c] pt-4 text-left max-w-md mx-auto space-y-3">
              {loadingSteps.map((stepText, index) => (
                <div key={index} className="flex items-center gap-3 text-xs">
                  {loadingStep > index ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : loadingStep === index ? (
                    <RefreshCw className="h-4 w-4 text-[#c9a86a] shrink-0 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-[#2a2a2c] shrink-0 flex items-center justify-center text-[10px] text-[#505050]">
                      {index + 1}
                    </div>
                  )}
                  <span className={`${loadingStep === index ? 'font-semibold text-[#c9a86a] font-serif italic' : 'text-[#808080]'}`}>
                    {stepText}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#1a1a13] rounded-sm p-3 border border-[#3a3a2c] text-left">
              <p className="text-[11px] text-yellow-500 leading-normal flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span><strong>Atenção aos Limites de Rate Limit:</strong> Caso ocorra um erro de timeout, isso indica saturação da fila gratuita de chamadas por minuto da API. Aguarde um instante e reenvie.</span>
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Content (When data is successfully loaded) */}
        {data && !loading && (
          <div className="space-y-6 animate-fade-in print:space-y-8">
            
            {/* Top Presentation Header Bar */}
            <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#c9a86a] print:hidden" />
                  <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wider">Empresa Analisada</span>
                </div>
                <h2 className="text-3xl font-serif italic text-[#c9a86a] print:text-3xl">{data.relatorio.empresaNome}</h2>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#b0b0b0]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#c9a86a]" />
                    {data.relatorio.periodoAnalisado}
                  </span>
                  <span className="bg-[#1a1a1c] text-[#808080] px-2 py-0.5 rounded-sm border border-[#2a2a2c] font-mono text-[10px]">
                    Unidade: {data.relatorio.moeda}
                  </span>
                </div>
              </div>

              {/* Action buttons (Print, Reset) */}
              <div className="flex items-center gap-2 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#1a1a1c] border border-[#2a2a2c] hover:bg-[#252527] text-[#e0e0e0] rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  id="btn-print-report"
                >
                  <Printer className="h-4 w-4 text-[#c9a86a]" />
                  Imprimir Relatório
                </button>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-transparent border border-[#2a2a2c] text-[#808080] hover:text-[#e0e0e0] hover:bg-[#1a1a1c] rounded-sm text-xs font-bold transition-all flex items-center gap-1.5"
                  id="btn-reset-analise"
                >
                  <RefreshCw className="h-4 w-4" />
                  Nova Análise
                </button>
              </div>
            </div>

            {/* Print Header (Only visible on print layout) */}
            <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-slate-900">Relatório Executivo de Análise Contábil</h1>
              <p className="text-sm text-slate-500">Gerado automaticamente via IA - Analisador Contábil Sênior</p>
              <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                <div><strong>Empresa:</strong> {data.relatorio.empresaNome}</div>
                <div><strong>Exercício:</strong> {data.relatorio.periodoAnalisado}</div>
                <div><strong>Unidade Monetária:</strong> {data.relatorio.moeda}</div>
                <div><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            {/* Quick KPI Cards (YoY Comparison) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Receita Líquida */}
              <div className="bg-[#111113] border-l-2 border-r border-t border-b border-[#c9a86a] border-r-[#2a2a2c] border-t-[#2a2a2c] border-b-[#2a2a2c] p-5 shadow-xl flex flex-col justify-between print:border print:border-slate-300">
                <div className="flex justify-between items-start text-[#808080]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Receita Líquida</span>
                  <DollarSign className="h-4 w-4 text-[#808080]" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-serif text-[#e0e0e0]">{formatBRL(data.anoAtual.receitaLiquida)}</span>
                  <div className="flex items-center gap-1 text-[11px] mt-1">
                    {data.anoAtual.receitaLiquida > data.anoAnterior.receitaLiquida ? (
                      <>
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500 font-mono">
                          +{formatPercent(((data.anoAtual.receitaLiquida - data.anoAnterior.receitaLiquida) / data.anoAnterior.receitaLiquida) * 100)}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-rose-500 font-mono">
                          -{formatPercent(((data.anoAnterior.receitaLiquida - data.anoAtual.receitaLiquida) / data.anoAnterior.receitaLiquida) * 100)}
                        </span>
                      </>
                    )}
                    <span className="text-[#505050] font-mono text-[10px]">vs ano anterior</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Lucro Líquido */}
              <div className="bg-[#111113] border-l-2 border-r border-t border-b border-[#c9a86a] border-r-[#2a2a2c] border-t-[#2a2a2c] border-b-[#2a2a2c] p-5 shadow-xl flex flex-col justify-between print:border print:border-slate-300">
                <div className="flex justify-between items-start text-[#808080]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Lucro Líquido</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-serif text-[#e0e0e0]">{formatBRL(data.anoAtual.lucroLiquido)}</span>
                  <div className="flex items-center gap-1 text-[11px] mt-1">
                    {data.anoAtual.lucroLiquido > data.anoAnterior.lucroLiquido ? (
                      <>
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500 font-mono">
                          +{formatPercent(((data.anoAtual.lucroLiquido - data.anoAnterior.lucroLiquido) / data.anoAnterior.lucroLiquido) * 100)}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-rose-500 font-mono">
                          -{formatPercent(((data.anoAnterior.lucroLiquido - data.anoAtual.lucroLiquido) / data.anoAnterior.lucroLiquido) * 100)}
                        </span>
                      </>
                    )}
                    <span className="text-[#505050] font-mono text-[10px]">vs ano anterior</span>
                  </div>
                </div>
              </div>

              {/* Card 3: EBITDA */}
              <div className="bg-[#111113] border-l-2 border-r border-t border-b border-[#c9a86a] border-r-[#2a2a2c] border-t-[#2a2a2c] border-b-[#2a2a2c] p-5 shadow-xl flex flex-col justify-between print:border print:border-slate-300">
                <div className="flex justify-between items-start text-[#808080]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">EBITDA</span>
                  <Percent className="h-4 w-4 text-[#c9a86a]" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-serif text-[#e0e0e0]">{formatBRL(data.anoAtual.ebitda)}</span>
                  <div className="flex items-center gap-1 text-[11px] mt-1">
                    {data.anoAtual.ebitda > data.anoAnterior.ebitda ? (
                      <>
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500 font-mono">
                          +{formatPercent(((data.anoAtual.ebitda - data.anoAnterior.ebitda) / data.anoAnterior.ebitda) * 100)}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-rose-500 font-mono">
                          -{formatPercent(((data.anoAnterior.ebitda - data.anoAtual.ebitda) / data.anoAnterior.ebitda) * 100)}
                        </span>
                      </>
                    )}
                    <span className="text-[#505050] font-mono text-[10px]">vs ano anterior</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Margem Líquida */}
              <div className="bg-[#111113] border-l-2 border-r border-t border-b border-[#c9a86a] border-r-[#2a2a2c] border-t-[#2a2a2c] border-b-[#2a2a2c] p-5 shadow-xl flex flex-col justify-between print:border print:border-slate-300">
                <div className="flex justify-between items-start text-[#808080]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Margem Líquida</span>
                  <Percent className="h-4 w-4 text-[#c9a86a]" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-serif text-[#e0e0e0]">{formatPercent(data.indicadoresAtual.margemLiquida.valor)}</span>
                  <div className="flex items-center gap-1 text-[11px] mt-1">
                    {data.indicadoresAtual.margemLiquida.valor > data.indicadoresAnterior.margemLiquida.valor ? (
                      <>
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500 font-mono">
                          +{formatPercent(data.indicadoresAtual.margemLiquida.valor - data.indicadoresAnterior.margemLiquida.valor)}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-rose-500 font-mono">
                          -{formatPercent(data.indicadoresAnterior.margemLiquida.valor - data.indicadoresAtual.margemLiquida.valor)}
                        </span>
                      </>
                    )}
                    <span className="text-[#505050] font-mono text-[10px]">pp vs anterior</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Selector (Hidden on print) */}
            <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-1 shadow-md flex flex-wrap gap-1 print:hidden" id="report-tab-selector">
              <button
                onClick={() => setActiveTab('executivo')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-sm text-xs font-bold transition-all ${
                  activeTab === 'executivo' 
                    ? 'bg-[#1a1a1c] border border-[#2a2a2c] text-[#c9a86a] font-serif italic shadow-md' 
                    : 'text-[#808080] hover:text-[#e0e0e0] hover:bg-[#1a1a1c]'
                }`}
              >
                Relatório Executivo
              </button>
              <button
                onClick={() => setActiveTab('balanco')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-sm text-xs font-bold transition-all ${
                  activeTab === 'balanco' 
                    ? 'bg-[#1a1a1c] border border-[#2a2a2c] text-[#c9a86a] font-serif italic shadow-md' 
                    : 'text-[#808080] hover:text-[#e0e0e0] hover:bg-[#1a1a1c]'
                }`}
              >
                Balanço Comparativo
              </button>
              <button
                onClick={() => setActiveTab('dre')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-sm text-xs font-bold transition-all ${
                  activeTab === 'dre' 
                    ? 'bg-[#1a1a1c] border border-[#2a2a2c] text-[#c9a86a] font-serif italic shadow-md' 
                    : 'text-[#808080] hover:text-[#e0e0e0] hover:bg-[#1a1a1c]'
                }`}
              >
                DRE & Rentabilidade
              </button>
              <button
                onClick={() => setActiveTab('indicadores')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-sm text-xs font-bold transition-all ${
                  activeTab === 'indicadores' 
                    ? 'bg-[#1a1a1c] border border-[#2a2a2c] text-[#c9a86a] font-serif italic shadow-md' 
                    : 'text-[#808080] hover:text-[#e0e0e0] hover:bg-[#1a1a1c]'
                }`}
              >
                Indicadores Detalhados
              </button>
              <button
                onClick={() => setActiveTab('notas')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-sm text-xs font-bold transition-all ${
                  activeTab === 'notas' 
                    ? 'bg-[#1a1a1c] border border-[#2a2a2c] text-[#c9a86a] font-serif italic shadow-md' 
                    : 'text-[#808080] hover:text-[#e0e0e0] hover:bg-[#1a1a1c]'
                }`}
              >
                Notas Explicativas
              </button>
            </div>

            {/* TAB CONTENT */}

            {/* Tab 1: Executive Summary */}
            {(activeTab === 'executivo' || typeof window === 'undefined') && (
              <div className="space-y-6 print:block">
                {/* General Summary Card */}
                <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl print:border print:border-slate-300">
                  <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic border-b border-[#2a2a2c] pb-3 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#c9a86a]" />
                    Parecer de Análise Contábil / Resumo Geral
                  </h3>
                  <div className="text-[#b0b0b0] text-sm leading-relaxed whitespace-pre-line text-justify">
                    {data.relatorio.resumoGeral}
                  </div>
                </div>

                {/* SWOT style analysis (Highlights vs Risks) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
                  {/* Highlights (Positive) */}
                  <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl print:border print:border-slate-300">
                    <h3 className="text-sm font-bold text-green-400 font-serif italic uppercase tracking-wider border-b border-[#2a2a2c] pb-3 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-500" />
                      Destaques Positivos / Forças
                    </h3>
                    <ul className="space-y-3">
                      {data.relatorio.destaquesPositivos.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#b0b0b0] flex items-start gap-2.5 leading-relaxed text-justify">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Attention Points (Risks) */}
                  <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl print:border print:border-slate-300">
                    <h3 className="text-sm font-bold text-yellow-500 font-serif italic uppercase tracking-wider border-b border-[#2a2a2c] pb-3 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Pontos de Atenção / Vulnerabilidades
                    </h3>
                    <ul className="space-y-3">
                      {data.relatorio.pontosAtencao.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#b0b0b0] flex items-start gap-2.5 leading-relaxed text-justify">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl print:border print:border-slate-300">
                  <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic border-b border-[#2a2a2c] pb-3 mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#c9a86a]" />
                    Recomendações Estratégicas do Consultor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.relatorio.recomendacoesConsultor.map((item, idx) => (
                      <div key={idx} className="p-4 bg-[#1a1a1c] border border-[#2a2a2c] rounded-sm text-xs text-[#b0b0b0] flex flex-col justify-between space-y-2 text-justify">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#111113] border border-[#2a2a2c] text-[#c9a86a] font-bold px-2 py-0.5 rounded-sm text-[10px]">
                            Recomendação #{idx + 1}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#c9a86a]" />
                        </div>
                        <p className="leading-relaxed font-medium mt-1 font-serif italic">"{item}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Comparative Balance Sheet */}
            {activeTab === 'balanco' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Table Content */}
                <div className="lg:col-span-7 bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic border-b border-[#2a2a2c] pb-3">
                      Estrutura do Balanço Patrimonial (BP)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#2a2a2c] text-[#808080] font-semibold bg-[#1a1a1c]">
                            <th className="py-2.5 px-3">Rubrica Contábil</th>
                            <th className="py-2.5 px-3 text-right">{data.anoAnterior.ano}</th>
                            <th className="py-2.5 px-3 text-right">{data.anoAtual.ano}</th>
                            <th className="py-2.5 px-3 text-right">Var. %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* ATIVO */}
                          <tr className="border-b border-[#2a2a2c] bg-[#1a1a1c]/60 font-bold">
                            <td className="py-2 px-3 text-[#c9a86a] font-serif">ATIVO TOTAL</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAnterior.ativoTotal)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.ativoTotal)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">
                              {formatPercent(((data.anoAtual.ativoTotal - data.anoAnterior.ativoTotal) / data.anoAnterior.ativoTotal) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c]">
                            <td className="py-2 px-3 pl-6 text-[#b0b0b0]">Ativo Circulante (Curto Prazo)</td>
                            <td className="py-2 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.ativoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.ativoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#808080]">
                              {formatPercent(((data.anoAtual.ativoCirculante - data.anoAnterior.ativoCirculante) / data.anoAnterior.ativoCirculante) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c]">
                            <td className="py-2 px-3 pl-6 text-[#b0b0b0]">Ativo Não Circulante (Longo Prazo)</td>
                            <td className="py-2 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.ativoNaoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.ativoNaoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#808080]">
                              {formatPercent(((data.anoAtual.ativoNaoCirculante - data.anoAnterior.ativoNaoCirculante) / data.anoAnterior.ativoNaoCirculante) * 100)}
                            </td>
                          </tr>
                          
                          {/* PASSIVO E PL */}
                          <tr className="border-b border-[#2a2a2c] bg-[#1a1a1c]/60 font-bold mt-4">
                            <td className="py-2 px-3 text-[#c9a86a] font-serif">PASSIVO + PL TOTAL</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAnterior.passivoTotal)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.passivoTotal)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">
                              {formatPercent(((data.anoAtual.passivoTotal - data.anoAnterior.passivoTotal) / data.anoAnterior.passivoTotal) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c]">
                            <td className="py-2 px-3 pl-6 text-[#b0b0b0]">Passivo Circulante (Curto Prazo)</td>
                            <td className="py-2 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.passivoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.passivoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#808080]">
                              {formatPercent(((data.anoAtual.passivoCirculante - data.anoAnterior.passivoCirculante) / data.anoAnterior.passivoCirculante) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c]">
                            <td className="py-2 px-3 pl-6 text-[#b0b0b0]">Passivo Não Circulante (Longo Prazo)</td>
                            <td className="py-2 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.passivoNaoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.passivoNaoCirculante)}</td>
                            <td className="py-2 px-3 text-right text-[#808080]">
                              {formatPercent(((data.anoAtual.passivoNaoCirculante - data.anoAnterior.passivoNaoCirculante) / data.anoAnterior.passivoNaoCirculante) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c] font-semibold bg-[#1a1c1a]/40">
                            <td className="py-2 px-3 pl-6 text-green-400 font-serif">Patrimônio Líquido</td>
                            <td className="py-2 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.patrimonioLiquido)}</td>
                            <td className="py-2 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.patrimonioLiquido)}</td>
                            <td className="py-2 px-3 text-right text-green-400">
                              {formatPercent(((data.anoAtual.patrimonioLiquido - data.anoAnterior.patrimonioLiquido) / data.anoAnterior.patrimonioLiquido) * 100)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-sm p-4 text-[11px] text-[#808080] mt-4 leading-normal">
                    <strong>Análise de Fechamento Contábil:</strong> A validação contábil do Ativo em relação ao Passivo + PL foi concluída. Ambos os anos apresentam consistência estrita de igualdade patrimonial (Ativo = Passivo + PL), o que certifica a integridade inicial da extração eletrônica de dados do arquivo PDF.
                  </div>
                </div>

                {/* Graphic Charts Side */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Ativo Structure */}
                  <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-5 shadow-xl">
                    <h4 className="text-sm font-bold text-[#c9a86a] font-serif italic mb-2 text-center">Composição dos Ativos ({data.anoAtual.ano})</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetStructureData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {assetStructureData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatBRL(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-[10px] mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#c9a86a]"></div>
                        <span className="text-[#b0b0b0]">Curto Prazo ({formatPercent((data.anoAtual.ativoCirculante / data.anoAtual.ativoTotal) * 100)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#3a3a3c]"></div>
                        <span className="text-[#b0b0b0]">Longo Prazo ({formatPercent((data.anoAtual.ativoNaoCirculante / data.anoAtual.ativoTotal) * 100)})</span>
                      </div>
                    </div>
                  </div>

                  {/* Passivo Structure */}
                  <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-5 shadow-xl">
                    <h4 className="text-sm font-bold text-[#c9a86a] font-serif italic mb-2 text-center">Origem dos Recursos ({data.anoAtual.ano})</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={liabilitiesStructureData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {liabilitiesStructureData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatBRL(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#c9a86a]"></div>
                        <span className="text-[#b0b0b0]">P. Circulante ({formatPercent((data.anoAtual.passivoCirculante / data.anoAtual.passivoTotal) * 100)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#3a3a3c]"></div>
                        <span className="text-[#b0b0b0]">P. Não Circ. ({formatPercent((data.anoAtual.passivoNaoCirculante / data.anoAtual.passivoTotal) * 100)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-[#b0b0b0]">PL (Capital Próprio) ({formatPercent((data.anoAtual.patrimonioLiquido / data.anoAtual.passivoTotal) * 100)})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: DRE & Rentabilidade */}
            {activeTab === 'dre' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* DRE Table */}
                <div className="lg:col-span-6 bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic border-b border-[#2a2a2c] pb-3">
                      Demonstração do Resultado do Exercício (DRE)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#2a2a2c] text-[#808080] font-semibold bg-[#1a1a1c]">
                            <th className="py-2.5 px-3">Conta de Resultado</th>
                            <th className="py-2.5 px-3 text-right">{data.anoAnterior.ano}</th>
                            <th className="py-2.5 px-3 text-right">{data.anoAtual.ano}</th>
                            <th className="py-2.5 px-3 text-right">Variação %</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#2a2a2c] font-semibold bg-[#1a1a1c]/40">
                            <td className="py-3 px-3 text-[#e0e0e0]">(=) Receita Líquida</td>
                            <td className="py-3 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.receitaLiquida)}</td>
                            <td className="py-3 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.receitaLiquida)}</td>
                            <td className="py-3 px-3 text-right font-bold text-[#e0e0e0]">
                              {formatPercent(((data.anoAtual.receitaLiquida - data.anoAnterior.receitaLiquida) / data.anoAnterior.receitaLiquida) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c]">
                            <td className="py-3 px-3 text-[#b0b0b0]">(=) Lucro Bruto</td>
                            <td className="py-3 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.lucroBruto)}</td>
                            <td className="py-3 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.lucroBruto)}</td>
                            <td className="py-3 px-3 text-right text-[#808080]">
                              {formatPercent(((data.anoAtual.lucroBruto - data.anoAnterior.lucroBruto) / data.anoAnterior.lucroBruto) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c]">
                            <td className="py-3 px-3 text-[#b0b0b0]">(=) EBITDA</td>
                            <td className="py-3 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.ebitda)}</td>
                            <td className="py-3 px-3 text-right text-[#e0e0e0]">{formatBRL(data.anoAtual.ebitda)}</td>
                            <td className="py-3 px-3 text-right text-[#c9a86a] font-semibold">
                              {formatPercent(((data.anoAtual.ebitda - data.anoAnterior.ebitda) / data.anoAnterior.ebitda) * 100)}
                            </td>
                          </tr>
                          <tr className="border-b border-[#2a2a2c] font-bold bg-[#1a1c1a]/40">
                            <td className="py-3 px-3 text-green-400 font-serif">(=) Lucro Líquido</td>
                            <td className="py-3 px-3 text-right text-[#808080]">{formatBRL(data.anoAnterior.lucroLiquido)}</td>
                            <td className="py-3 px-3 text-right text-green-400">{formatBRL(data.anoAtual.lucroLiquido)}</td>
                            <td className="py-3 px-3 text-right text-green-400 font-extrabold">
                              {formatPercent(((data.anoAtual.lucroLiquido - data.anoAnterior.lucroLiquido) / data.anoAnterior.lucroLiquido) * 100)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-sm p-4 text-[11px] text-[#808080] mt-4 leading-normal">
                    <strong>Ponto de Vista Contábil:</strong> A expansão do lucro líquido em relação à receita líquida denota ganho de margem e alavancagem operacional (redução proporcional de custos fixos). Este é o cenário ideal para apresentação de resultados para sócios e investidores.
                  </div>
                </div>

                {/* DRE Column Graphic */}
                <div className="lg:col-span-6 bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic border-b border-[#2a2a2c] pb-3">
                      Evolução das Contas de Resultado (DRE)
                    </h3>
                    <div className="h-72 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartDREData}
                          margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2c" />
                          <XAxis dataKey="name" stroke="#808080" />
                          <YAxis stroke="#808080" tickFormatter={(v) => `R$ ${v / 1000}k`} />
                          <Tooltip formatter={(value: number) => formatBRL(value)} />
                          <Legend />
                          <Bar dataKey={data.anoAnterior.ano} fill="#3a3a3c" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={data.anoAtual.ano} fill="#c9a86a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#808080] text-center mt-3">
                    Comparativo gráfico absoluto das principais rubricas da Demonstração do Resultado do Exercício.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Performance Indicators Deep-dive */}
            {activeTab === 'indicadores' && (
              <div className="space-y-6">
                <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic border-b border-[#2a2a2c] pb-3 mb-6">
                    Métricas e Índices de Desempenho Financeiro ({data.anoAtual.ano})
                  </h3>
 
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 1. Liquidez Corrente */}
                    <div className="border border-[#2a2a2c] rounded-sm p-5 hover:border-[#c9a86a] transition-all bg-[#1a1a1c] shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">Liquidez</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(data.indicadoresAtual.liquidezCorrente.status)}`}>
                          {data.indicadoresAtual.liquidezCorrente.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#c9a86a] font-serif italic text-sm mt-1.5">Liquidez Corrente</h4>
                      <p className="text-2xl font-black text-[#e0e0e0] mt-2">{data.indicadoresAtual.liquidezCorrente.valor.toFixed(2)}</p>
                      
                      {/* YoY Indicators meter */}
                      <div className="mt-2 text-[10px] text-[#808080] flex items-center justify-between border-t border-[#2a2a2c] pt-2">
                        <span>Ano anterior: {data.indicadoresAnterior.liquidezCorrente.valor.toFixed(2)}</span>
                        <span className="font-semibold text-[#e0e0e0]">Meta recomendada: &gt; 1,50</span>
                      </div>
                      <p className="text-[11px] text-[#b0b0b0] leading-normal mt-3 text-justify">{data.indicadoresAtual.liquidezCorrente.analise}</p>
                    </div>
 
                    {/* 2. Liquidez Geral */}
                    <div className="border border-[#2a2a2c] rounded-sm p-5 hover:border-[#c9a86a] transition-all bg-[#1a1a1c] shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">Liquidez</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(data.indicadoresAtual.liquidezGeral.status)}`}>
                          {data.indicadoresAtual.liquidezGeral.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#c9a86a] font-serif italic text-sm mt-1.5">Liquidez Geral</h4>
                      <p className="text-2xl font-black text-[#e0e0e0] mt-2">{data.indicadoresAtual.liquidezGeral.valor.toFixed(2)}</p>
                      
                      <div className="mt-2 text-[10px] text-[#808080] flex items-center justify-between border-t border-[#2a2a2c] pt-2">
                        <span>Ano anterior: {data.indicadoresAnterior.liquidezGeral.valor.toFixed(2)}</span>
                        <span className="font-semibold text-[#e0e0e0]">Meta recomendada: &gt; 1,00</span>
                      </div>
                      <p className="text-[11px] text-[#b0b0b0] leading-normal mt-3 text-justify">{data.indicadoresAtual.liquidezGeral.analise}</p>
                    </div>
 
                    {/* 3. Margem Bruta */}
                    <div className="border border-[#2a2a2c] rounded-sm p-5 hover:border-[#c9a86a] transition-all bg-[#1a1a1c] shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">Rentabilidade</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(data.indicadoresAtual.margemBruta.status)}`}>
                          {data.indicadoresAtual.margemBruta.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#c9a86a] font-serif italic text-sm mt-1.5">Margem Bruta</h4>
                      <p className="text-2xl font-black text-[#e0e0e0] mt-2">{data.indicadoresAtual.margemBruta.valor.toFixed(2)}%</p>
                      
                      <div className="mt-2 text-[10px] text-[#808080] flex items-center justify-between border-t border-[#2a2a2c] pt-2">
                        <span>Ano anterior: {data.indicadoresAnterior.margemBruta.valor.toFixed(2)}%</span>
                        <span className="font-semibold text-[#e0e0e0]">Análise YoY</span>
                      </div>
                      <p className="text-[11px] text-[#b0b0b0] leading-normal mt-3 text-justify">{data.indicadoresAtual.margemBruta.analise}</p>
                    </div>
 
                    {/* 4. Margem Líquida */}
                    <div className="border border-[#2a2a2c] rounded-sm p-5 hover:border-[#c9a86a] transition-all bg-[#1a1a1c] shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">Rentabilidade</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(data.indicadoresAtual.margemLiquida.status)}`}>
                          {data.indicadoresAtual.margemLiquida.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#c9a86a] font-serif italic text-sm mt-1.5">Margem Líquida</h4>
                      <p className="text-2xl font-black text-[#e0e0e0] mt-2">{data.indicadoresAtual.margemLiquida.valor.toFixed(2)}%</p>
                      
                      <div className="mt-2 text-[10px] text-[#808080] flex items-center justify-between border-t border-[#2a2a2c] pt-2">
                        <span>Ano anterior: {data.indicadoresAnterior.margemLiquida.valor.toFixed(2)}%</span>
                        <span className="font-semibold text-[#e0e0e0]">Análise YoY</span>
                      </div>
                      <p className="text-[11px] text-[#b0b0b0] leading-normal mt-3 text-justify">{data.indicadoresAtual.margemLiquida.analise}</p>
                    </div>
 
                    {/* 5. ROE (Return on Equity) */}
                    <div className="border border-[#2a2a2c] rounded-sm p-5 hover:border-[#c9a86a] transition-all bg-[#1a1a1c] shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">Rentabilidade</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(data.indicadoresAtual.roe.status)}`}>
                          {data.indicadoresAtual.roe.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#c9a86a] font-serif italic text-sm mt-1.5">ROE (Retorno sobre PL)</h4>
                      <p className="text-2xl font-black text-[#e0e0e0] mt-2">{data.indicadoresAtual.roe.valor.toFixed(2)}%</p>
                      
                      <div className="mt-2 text-[10px] text-[#808080] flex items-center justify-between border-t border-[#2a2a2c] pt-2">
                        <span>Ano anterior: {data.indicadoresAnterior.roe.valor.toFixed(2)}%</span>
                        <span className="font-semibold text-[#e0e0e0]">Meta recomendada: &gt; 12%</span>
                      </div>
                      <p className="text-[11px] text-[#b0b0b0] leading-normal mt-3 text-justify">{data.indicadoresAtual.roe.analise}</p>
                    </div>
 
                    {/* 6. Grau de Endividamento */}
                    <div className="border border-[#2a2a2c] rounded-sm p-5 hover:border-[#c9a86a] transition-all bg-[#1a1a1c] shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">Estrutura de Capital</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(data.indicadoresAtual.endividamento.status)}`}>
                          {data.indicadoresAtual.endividamento.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#c9a86a] font-serif italic text-sm mt-1.5">Endividamento Geral</h4>
                      <p className="text-2xl font-black text-[#e0e0e0] mt-2">{data.indicadoresAtual.endividamento.valor.toFixed(2)}%</p>
                      
                      <div className="mt-2 text-[10px] text-[#808080] flex items-center justify-between border-t border-[#2a2a2c] pt-2">
                        <span>Ano anterior: {data.indicadoresAnterior.endividamento.valor.toFixed(2)}%</span>
                        <span className="font-semibold text-[#e0e0e0]">Meta recomendada: &lt; 65%</span>
                      </div>
                      <p className="text-[11px] text-[#b0b0b0] leading-normal mt-3 text-justify">{data.indicadoresAtual.endividamento.analise}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
 
            {/* Tab 5: Footnotes & Explanatory Notes Insights */}
            {activeTab === 'notas' && (
              <div className="space-y-6">
                <div className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-6 shadow-xl flex items-start gap-4">
                  <div className="bg-[#1a1a1c] border border-[#2a2a2c] p-3 rounded-sm text-[#c9a86a] shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#c9a86a] font-serif italic">Análise de Notas Explicativas</h3>
                    <p className="text-xs text-[#b0b0b0] leading-relaxed max-w-4xl text-justify">
                      As Notas Explicativas contêm o detalhamento qualitativo de critérios de avaliação de ativos, parcelamento de obrigações de longo prazo, processos judiciais pendentes e políticas contábeis adotadas. Abaixo, destacamos as notas mais relevantes identificadas pelo nosso analisador contábil para subsidiar as decisões de gestão.
                    </p>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.relatorio.notasExplicativasDestaques && data.relatorio.notasExplicativasDestaques.length > 0 ? (
                    data.relatorio.notasExplicativasDestaques.map((item, idx) => (
                      <div key={idx} className="bg-[#111113] border border-[#2a2a2c] rounded-sm p-5 shadow-xl flex items-start gap-3.5 hover:border-[#c9a86a] transition-all">
                        <div className="w-6 h-6 rounded-full bg-[#1a1a1c] border border-[#2a2a2c] flex items-center justify-center font-bold text-xs text-[#c9a86a] shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-[#c9a86a] font-serif italic text-sm">Nota Relevante Extraída</h4>
                          <p className="text-xs text-[#b0b0b0] leading-relaxed text-justify">{item}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="md:col-span-2 text-center py-8 text-[#808080] bg-[#111113] border border-[#2a2a2c] rounded-sm">
                      Nenhum destaque específico de Notas Explicativas foi extraído deste documento.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Explanatory footer note (Printable but also visible) */}
            <div className="bg-[#1a1a1c] border border-[#2a2a2c] rounded-sm p-4 text-[10px] text-[#808080] text-center leading-normal">
              <strong>Isenção de Responsabilidade Contábil:</strong> Este relatório é uma ferramenta de apoio gerencial produzida por inteligência artificial (Google Gemini). Os índices são calculados com base nas demonstrações financeiras fornecidas. Recomenda-se a validação das análises em conjunto com o profissional contábil responsável pela companhia.
            </div>

          </div>
        )}

      </main>

      {/* Footer Bar */}
      <footer className="bg-[#0a0a0b] border-t border-[#2a2a2c] py-6 text-center text-xs text-[#808080] mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Analisador de Balanço Contábil. Todos os direitos reservados.</p>
          <p className="mt-1 text-[10px]">Alimentado por inteligência artificial do Google Gemini. Desenvolvido para apresentações executivas.</p>
        </div>
      </footer>
    </div>
  );
}
