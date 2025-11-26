import axios from "axios";

/**
 * Cliente de integração com Pipedrive - VERSÃO FINAL
 * Implementa busca/criação de pessoa, seleção de pipeline e criação de deals
 * com todos os campos customizados e título padronizado [Simulação] - Nome
 */

const api = axios.create({
  baseURL: process.env.PIPEDRIVE_BASE_URL,
  params: { api_token: process.env.PIPEDRIVE_API_TOKEN }
});

// ------------------------
// 1. Buscar/CRIAR Pessoa
// ------------------------
export async function findOrCreatePerson(lead: any) {
  try {
    // 1. Buscar por email
    if (lead.email) {
      const r = await api.get("/persons/search", {
        params: { term: lead.email, fields: "email" }
      });
      const item = r.data?.data?.items?.[0];
      if (item) {
        console.log("🔍 Pipedrive: pessoa encontrada via email:", item.item.id);
        return item.item.id;
      }
    }

    // 2. Buscar por telefone
    if (lead.whatsapp) {
      const r = await api.get("/persons/search", {
        params: { term: lead.whatsapp, fields: "phone" }
      });
      const item = r.data?.data?.items?.[0];
      if (item) {
        console.log("🔍 Pipedrive: pessoa encontrada via telefone:", item.item.id);
        return item.item.id;
      }
    }

    // 3. Criar pessoa
    const payload = {
      name: lead.nomeCompleto,
      email: lead.email || "",
      phone: [
        {
          value: lead.whatsapp || lead.telefone || "",
          primary: true,
          label: "WhatsApp"
        }
      ]
    };

    const res = await api.post("/persons", payload);
    console.log("✅ Pipedrive: pessoa criada:", res.data.data.id);

    return res.data.data.id;

  } catch (err: any) {
    console.error("❌ Erro criar/buscar pessoa:", err.response?.data || err);
    return null;
  }
}


// ---------------------------------------
// 2. Selecionar pipeline/stage corretos
// ---------------------------------------
export function getPipelineConfig(tipoOportunidade: string) {
  if (tipoOportunidade === "emissor") {
    return {
      pipeline_id: Number(process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID),
      stage_id: Number(process.env.PIPEDRIVE_EMISSOR_STAGE_ID)
    };
  }

  return {
    pipeline_id: Number(process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID),
    stage_id: Number(process.env.PIPEDRIVE_INVESTOR_STAGE_ID)
  };
}


// ----------------------
// 3. Criar negócio/deal
// ----------------------
export async function createDeal({ lead, opportunity, simulation, score }: {
  lead: any;
  opportunity: any;
  simulation: any;
  score: { total: number; valor: number; intencao: number; engajamento: number; urgencia: number };
}) {
  try {
    const person_id = await findOrCreatePerson(lead);
    if (!person_id) {
      console.warn("⚠️ Pipedrive: não foi possível obter person_id.");
      return null;
    }

    const { pipeline_id, stage_id } = getPipelineConfig(opportunity.tipoOportunidade);

    // TAG OBRIGATÓRIA NO TÍTULO:
    const title = `[Simulação] - ${lead.nomeCompleto}`;

    const payload: any = {
      title,
      value: opportunity.ticketEstimado / 100,
      currency: "BRL",
      person_id,
      pipeline_id,
      stage_id,
      // Opcional: fixar dono do deal
      ...(process.env.PIPEDRIVE_DEFAULT_OWNER_ID
        ? { owner_id: Number(process.env.PIPEDRIVE_DEFAULT_OWNER_ID) }
        : {}),
    };

    // Campos customizados (apenas se ENV estiver configurado)
    if (process.env.PIPEDRIVE_FIELD_TOKENIZA_SCORE) {
      payload[process.env.PIPEDRIVE_FIELD_TOKENIZA_SCORE] = score.total;
    }
    if (process.env.PIPEDRIVE_FIELD_SCORE_VALOR) {
      payload[process.env.PIPEDRIVE_FIELD_SCORE_VALOR] = score.valor;
    }
    if (process.env.PIPEDRIVE_FIELD_SCORE_INTENCAO) {
      payload[process.env.PIPEDRIVE_FIELD_SCORE_INTENCAO] = score.intencao;
    }
    if (process.env.PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO) {
      payload[process.env.PIPEDRIVE_FIELD_SCORE_ENGAJAMENTO] = score.engajamento;
    }
    if (process.env.PIPEDRIVE_FIELD_SCORE_URGENCIA) {
      payload[process.env.PIPEDRIVE_FIELD_SCORE_URGENCIA] = score.urgencia;
    }
    if (process.env.PIPEDRIVE_FIELD_ORIGEM_SIMULACAO) {
      payload[process.env.PIPEDRIVE_FIELD_ORIGEM_SIMULACAO] = simulation.origemSimulacao;
    }
    if (process.env.PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE) {
      payload[process.env.PIPEDRIVE_FIELD_TIPO_OPORTUNIDADE] = opportunity.tipoOportunidade;
    }

    console.log("➡️ Enviando DEAL para Pipedrive:", {
      title: payload.title,
      value: payload.value,
      pipeline_id: payload.pipeline_id,
      stage_id: payload.stage_id,
      owner_id: payload.owner_id,
    });

    const res = await api.post("/deals", payload);

    console.log("⬅️ Resposta Pipedrive DEAL:", {
      status: res.status,
      success: res.data?.success,
      id: res.data?.data?.id,
    });

    return res.data.data.id;

  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.error("❌ Erro Pipedrive DEAL:", {
        status: err.response?.status,
        data: err.response?.data,
      });
    } else {
      console.error("❌ Erro Pipedrive DEAL (não Axios):", err);
    }
    return null;
  }
}
