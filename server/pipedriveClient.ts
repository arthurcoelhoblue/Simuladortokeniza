import { Lead, Opportunity, Simulation } from "../drizzle/schema";
import { updateLead, updateOpportunity } from "./db";
import { getPipedrivePipelineAndStage } from "./pipedriveMapping";

/**
 * Cliente de integração com Pipedrive
 * Gerencia criação/busca de pessoas e deals no Pipedrive
 */

// Tipos do Pipedrive
export type PipedrivePerson = {
  id: number;
  name: string;
  email?: { value: string }[];
  phone?: { value: string }[];
};

export type PipedriveDeal = {
  id: number;
  title: string;
  value: number;
  currency: string;
  person_id: number;
  stage_id?: number;
};

// Configurações do Pipedrive via ENV
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || "";
const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL || "https://api.pipedrive.com/v1";
const PIPEDRIVE_STAGE_ID = process.env.PIPEDRIVE_STAGE_ID || "1"; // Stage padrão para novas oportunidades

/**
 * Busca pessoa no Pipedrive por email ou telefone
 */
async function searchPipedrivePersonByContact(email?: string | null, phone?: string | null): Promise<number | null> {
  if (!PIPEDRIVE_API_TOKEN) {
    console.warn("⚠️ PIPEDRIVE_API_TOKEN não configurado");
    return null;
  }

  try {
    // Buscar por email primeiro
    if (email) {
      const searchUrl = `${PIPEDRIVE_BASE_URL}/persons/search?term=${encodeURIComponent(email)}&fields=email&api_token=${PIPEDRIVE_API_TOKEN}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.items && data.data.items.length > 0) {
          const personId = data.data.items[0].item.id;
          console.log(`🔍 Pessoa encontrada no Pipedrive por email: ${personId}`);
          return personId;
        }
      }
    }

    // Se não encontrou por email, tentar por telefone
    if (phone) {
      const searchUrl = `${PIPEDRIVE_BASE_URL}/persons/search?term=${encodeURIComponent(phone)}&fields=phone&api_token=${PIPEDRIVE_API_TOKEN}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.items && data.data.items.length > 0) {
          const personId = data.data.items[0].item.id;
          console.log(`🔍 Pessoa encontrada no Pipedrive por telefone: ${personId}`);
          return personId;
        }
      }
    }

    console.log("🔍 Pessoa não encontrada no Pipedrive");
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar pessoa no Pipedrive:", error);
    return null;
  }
}

/**
 * Cria nova pessoa no Pipedrive
 */
async function createPipedrivePerson(lead: Lead): Promise<number | null> {
  if (!PIPEDRIVE_API_TOKEN) {
    console.warn("⚠️ PIPEDRIVE_API_TOKEN não configurado");
    return null;
  }

  try {
    const payload = {
      name: lead.nomeCompleto,
      email: lead.email ? [lead.email] : undefined,
      phone: lead.whatsapp || lead.telefone ? [lead.whatsapp || lead.telefone] : undefined,
    };

    const response = await fetch(`${PIPEDRIVE_BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const personId = data.data.id;
      console.log(`✅ Pessoa criada no Pipedrive com ID: ${personId}`);
      return personId;
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro ao criar pessoa no Pipedrive: ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao criar pessoa no Pipedrive:", error);
    return null;
  }
}

/**
 * Busca ou cria pessoa no Pipedrive para um lead
 * Atualiza o campo pipedrivePersonId no lead local
 */
export async function findOrCreatePipedrivePersonForLead(lead: Lead): Promise<number | null> {
  console.log(`🔗 Integração Pipedrive: buscando/criando pessoa para lead ${lead.id}`);

  // Se já tem pipedrivePersonId, retornar direto
  if (lead.pipedrivePersonId) {
    const personId = parseInt(lead.pipedrivePersonId);
    console.log(`✅ Lead ${lead.id} já tem pipedrivePersonId: ${personId}`);
    return personId;
  }

  // Buscar pessoa existente no Pipedrive
  let personId = await searchPipedrivePersonByContact(lead.email, lead.whatsapp || lead.telefone);

  // Se não encontrou, criar nova pessoa
  if (!personId) {
    personId = await createPipedrivePerson(lead);
  }

  // Salvar pipedrivePersonId no lead local
  if (personId) {
    await updateLead(lead.id, { pipedrivePersonId: personId.toString() });
    console.log(`✅ Pessoa Pipedrive vinculada ao lead ${lead.id} com id=${personId}`);
  }

  return personId;
}

/**
 * Cria deal no Pipedrive para uma oportunidade
 */
export async function createPipedriveDealForOpportunity(params: {
  lead: Lead;
  simulation: Simulation;
  opportunity: Opportunity;
  personId: number;
}): Promise<number | null> {
  if (!PIPEDRIVE_API_TOKEN) {
    console.warn("⚠️ PIPEDRIVE_API_TOKEN não configurado");
    return null;
  }

  const { lead, simulation, opportunity, personId } = params;

  console.log(`🎯 Criando deal no Pipedrive para oportunidade ${opportunity.id} (simulação ${simulation.id})`);

  try {
    // Obter pipeline e stage corretos baseado no tipoOportunidade
    const { pipeline_id, stage_id } = getPipedrivePipelineAndStage(opportunity.tipoOportunidade);
    
    if (!pipeline_id || !stage_id) {
      console.warn(`⚠️ Pipeline/Stage não configurado para tipoOportunidade=${opportunity.tipoOportunidade}`);
      return null;
    }
    
    console.log(`🔗 Pipedrive: usando pipeline_id=${pipeline_id}, stage_id=${stage_id} (${opportunity.tipoOportunidade})`);

    // Calcular valor em reais
    const ticketEmReais = opportunity.ticketEstimado / 100;
    const ticketFormatado = ticketEmReais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    // Montar título do deal
    const tipoSimulacaoFormatado = simulation.tipoSimulacao === "investimento" ? "Investimento" : "Financiamento";
    const title = `${tipoSimulacaoFormatado} ${ticketFormatado} - ${lead.nomeCompleto}`;

    // Payload do deal
    const payload = {
      title,
      value: ticketEmReais,
      currency: "BRL",
      person_id: personId,
      pipeline_id,
      stage_id,
      // Campos customizados podem ser adicionados aqui
      // Ex: prazo_meses: simulation.prazoMeses
    };

    const response = await fetch(`${PIPEDRIVE_BASE_URL}/deals?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const dealId = data.data.id;
      console.log(`✅ Deal Pipedrive criado com id=${dealId} e salvo em opportunities.pipedriveDealId`);
      return dealId;
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro ao criar deal no Pipedrive: ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao criar deal no Pipedrive:", error);
    return null;
  }
}
