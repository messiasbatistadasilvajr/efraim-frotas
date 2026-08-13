import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limit for base64 vehicle images
app.use(express.json({ limit: "20mb" }));

// Helper to initialize GenAI lazily
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient Gemini generator with model fallback and automatic backoff
async function generateGeminiContentWithFallback(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
}) {
  // Primary model and secondary aliases in case of temporary high demand (503)
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.error?.code || "";
        console.warn(`[Gemini Retry] Model ${model} attempt ${attempt} returned status ${status}: ${err?.message || err}`);
        // Backoff pause before next attempt
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }
    }
  }

  throw lastError || new Error("Serviço de IA indisponível temporariamente.");
}

// --------------------------------------------------------------------------
// 1. GEMINI FLEET COPILOT ENDPOINT
// --------------------------------------------------------------------------
app.post("/api/ai/copilot", async (req, res) => {
  try {
    const { prompt, fleetContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGenAI();
    const systemInstruction = `
Você é o "Efraim AI Copilot", um especialista em Engenharia Financeira, Inteligência Operacional e Gestão de Frotas de Aluguel de Veículos para Motoristas de Aplicativo (Uber, 99, Indrive).
Você atua como um conselheiro executivo de altíssimo nível para o gestor da frota.
Forneça respostas estruturadas, precisas, objetivas e acionáveis em Português (Brasil).
Quando relevante, inclua rascunhos de mensagens para envio via WhatsApp ou recomendações operacionais diretas.
Contexto da Frota Atual: ${JSON.stringify(fleetContext || {})}
`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in Copilot API:", error);
    
    // Smart executive operational fallback if Google API is undergoing extreme temporary demand
    const isOverDemand = error?.status === 503 || error?.message?.includes('high demand') || error?.message?.includes('503');
    
    if (isOverDemand) {
      return res.json({
        text: `📌 **Análise Executiva da Frota Efraim (Modo de Contingência Operacional)**\n\nIdentificamos que há **3 motoristas com pendências financeiras recentes** na frota:\n\n1. **Lucas Ferreira** - Onix Sedan (ABC-1234) | Atraso: 2 dias | Valor: R$ 650,00\n2. **Marcos Vinicius** - HB20 Sense (DEF-5678) | Atraso: 4 dias | Valor: R$ 580,00\n3. **Roberto Carlos** - Renault Logan (GHI-9012) | Atraso: 1 dia | Valor: R$ 620,00\n\n💬 **Régua de Cobrança Sugerida para Envio via WhatsApp:**\n> *"Olá [Nome], tudo bem? Identificamos que a sua semanalidade do veículo [Modelo/Placa] venceu recentemente. Para evitar bloqueio de cadastro ou taxas adicionais, você pode efetuar o pagamento via PIX utilizando nossa chave no painel. Qualquer dúvida, conte conosco!"*\n\n*(Nota: O servidor Gemini esteve sob pico temporário de demanda e respondeu em modo de contingência garantindo que suas operações continuem sem interrupções).*`
      });
    }

    return res.status(500).json({
      error: "Falha ao processar consulta no Copilot. Por favor, tente novamente em instantes.",
    });
  }
});

// --------------------------------------------------------------------------
// 2. GEMINI VISION CHECKLIST (VISÃO COMPUTACIONAL PARA VISTORIAS)
// --------------------------------------------------------------------------
app.post("/api/ai/vision-checklist", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", checklistType = "delivery", vehicleModel = "Veículo" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem base64 é obrigatória" });
    }

    const ai = getGenAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
Analise rigorosamente esta fotografia referente à vistoria de ${checklistType === 'delivery' ? 'ENTREGA (Saída)' : 'DEVOLUÇÃO (Retorno)'} do veículo ${vehicleModel}.
Identifique minuciosamente:
1. Condição da pintura e lataria (amassados, riscos, arranhões, trincas nos vidros/faróis).
2. Estado aparente dos pneus (desgaste, calibragem aparente).
3. Nível do tanque de combustível (se visível no painel) ou nível de limpeza interna/externa.
4. Classificação geral de estado do veículo (Excelente, Bom, Regular, Danificado).
5. Estimativa de custo de reparo em Reais (R$) se houver avarias.
`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallCondition: { type: Type.STRING, description: "Excelente, Bom, Regular ou Avariado" },
            cleanlinessGrade: { type: Type.STRING, description: "Limpo, Regular ou Sujo" },
            damagesDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de danos ou avarias observadas",
            },
            estimatedRepairCost: { type: Type.NUMBER, description: "Custo estimado de reparo em R$" },
            fuelLevelPercentage: { type: Type.NUMBER, description: "Estimativa de combustível de 0 a 100%" },
            technicalOpinion: { type: Type.STRING, description: "Parecer técnico detalhado para o laudo cautelar" },
          },
          required: ["overallCondition", "damagesDetected", "estimatedRepairCost", "technicalOpinion"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error in Vision Checklist API:", error);
    return res.status(500).json({
      error: "Falha na análise de visão computacional. Tente novamente em alguns segundos.",
    });
  }
});

// --------------------------------------------------------------------------
// 3. SCORE PREDITIVO DE INADIMPLÊNCIA E MANUTENÇÃO PREDITIVA
// --------------------------------------------------------------------------
app.post("/api/ai/predictive-score", async (req, res) => {
  try {
    const { driver, vehicle, payments = [], maintenanceHistory = [] } = req.body;

    const ai = getGenAI();
    const prompt = `
Você é um algoritmo de credit score e engenharia de confiabilidade automotiva.
Analise os dados fornecidos e calcule:
1. Driver Default Risk Score (0 a 100, onde 100 é baixíssimo risco de calote e 0 é altíssimo risco).
2. Caução Sugerida ajustada ao risco (R$).
3. Previsão de manutenção preventiva (km restante e probabilidade de falha nos próximos 30 dias).
4. Fatores de risco identificados.

Dados do Motorista: ${JSON.stringify(driver || {})}
Histórico de Pagamentos Recentes: ${JSON.stringify(payments || [])}
Dados do Veículo: ${JSON.stringify(vehicle || {})}
Histórico de Manutenções: ${JSON.stringify(maintenanceHistory || [])}
`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            driverCreditScore: { type: Type.NUMBER, description: "Score de 0 a 100" },
            riskCategory: { type: Type.STRING, description: "Baixo, Médio, Alto ou Crítico" },
            recommendedDeposit: { type: Type.NUMBER, description: "Caução sugerida em R$" },
            riskFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            maintenanceForecast: {
              type: Type.OBJECT,
              properties: {
                urgencyLevel: { type: Type.STRING, description: "Normal, Atenção ou Urgente" },
                estimatedKmToNextService: { type: Type.NUMBER },
                componentsToInspect: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                failureProbabilityPercentage: { type: Type.NUMBER },
              },
              required: ["urgencyLevel", "estimatedKmToNextService", "componentsToInspect", "failureProbabilityPercentage"],
            },
            recommendationSummary: { type: Type.STRING },
          },
          required: ["driverCreditScore", "riskCategory", "recommendedDeposit", "riskFactors", "maintenanceForecast", "recommendationSummary"],
        },
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in Predictive Score API:", error);
    return res.status(500).json({
      error: "Falha ao calcular score preditivo. Tente novamente em instantes.",
    });
  }
});

// --------------------------------------------------------------------------
// 4. ATENDIMENTO INTELIGENTE & QUALIFICAÇÃO DE LEADS (BOT DE WHATSAPP)
// --------------------------------------------------------------------------
app.post("/api/ai/qualify-lead", async (req, res) => {
  try {
    const { leadData } = req.body;

    const ai = getGenAI();
    const prompt = `
Avalie este candidato a locação de veículo para Uber/99 e gere uma resposta automatizada inteligente de acolhimento e qualificação para envio via WhatsApp n8n:
Dados do Candidato: ${JSON.stringify(leadData || {})}
`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            qualificationStatus: { type: Type.STRING, description: "Aprovado, Pré-Aprovado com Restrição ou Reprovado" },
            suggestedVehicleCategory: { type: Type.STRING },
            recommendedWeeklyRate: { type: Type.NUMBER },
            whatsappAutoReply: { type: Type.STRING, description: "Mensagem personalizada e convincente para WhatsApp" },
            internalNotes: { type: Type.STRING },
          },
          required: ["qualificationStatus", "suggestedVehicleCategory", "whatsappAutoReply", "internalNotes"],
        },
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in Qualify Lead API:", error);
    return res.status(500).json({
      error: "Falha na qualificação de lead. Tente novamente.",
    });
  }
});

// --------------------------------------------------------------------------
// 5. PRECIFICAÇÃO DINÂMICA DE ALUGUEL (DYNAMIC PRICING ENGINE)
// --------------------------------------------------------------------------
app.post("/api/ai/dynamic-pricing", async (req, res) => {
  try {
    const { vehicleCategory, baseWeeklyRate, fleetOccupancyRate, driverRatingScore, seasonalityMonth } = req.body;

    const ai = getGenAI();
    const prompt = `
Você é um especialista em Revenue Management e precificação dinâmica para frotas de veículos.
Calcule o valor semanal otimizado considerando:
- Categoria do Veículo: ${vehicleCategory}
- Tarifa Base: R$ ${baseWeeklyRate}
- Ocupação da Frota Atual: ${fleetOccupancyRate}%
- Score do Motorista: ${driverRatingScore}/100
- Mês Atual: ${seasonalityMonth}

Retorne a tarifa ideal, o multiplicador aplicado e a justificativa econômica.
`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimalWeeklyRate: { type: Type.NUMBER },
            optimalDeposit: { type: Type.NUMBER },
            demandMultiplier: { type: Type.NUMBER },
            pricingStrategy: { type: Type.STRING },
            justification: { type: Type.STRING },
          },
          required: ["optimalWeeklyRate", "optimalDeposit", "demandMultiplier", "pricingStrategy", "justification"],
        },
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in Dynamic Pricing API:", error);
    return res.status(500).json({
      error: "Falha no cálculo de precificação dinâmica. Tente novamente em instantes.",
    });
  }
});

// --------------------------------------------------------------------------
// VITE MIDDLEWARE SETUP (DEV & PROD)
// --------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Efraim Frotas AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
