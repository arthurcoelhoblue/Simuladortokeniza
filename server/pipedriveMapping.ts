/**
 * Helper para mapear tipo de oportunidade para pipeline e stage corretos no Pipedrive
 */

export function getPipedrivePipelineAndStage(tipoOportunidade: "investidor" | "emissor") {
  if (tipoOportunidade === "emissor") {
    return {
      pipeline_id: Number(process.env.PIPEDRIVE_EMISSOR_PIPELINE_ID) || null,
      stage_id: Number(process.env.PIPEDRIVE_EMISSOR_STAGE_ID) || null,
    };
  }

  return {
    pipeline_id: Number(process.env.PIPEDRIVE_INVESTOR_PIPELINE_ID) || null,
    stage_id: Number(process.env.PIPEDRIVE_INVESTOR_STAGE_ID) || null,
  };
}
