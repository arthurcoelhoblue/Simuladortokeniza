/**
 * Script de teste para chamar a API real da Tokeniza e documentar formato da resposta
 * Executar: node server/testTokenizaApi.mjs
 */

const TOKENIZA_CROWDFUNDING_URL =
  "https://plataforma.tokeniza.com.br/api/v1/crowdfunding/getCrowdfundingList";

async function testTokenizaApi() {
  console.log("📡 Testando API da Tokeniza...\n");
  console.log("URL:", TOKENIZA_CROWDFUNDING_URL, "\n");

  try {
    const res = await fetch(TOKENIZA_CROWDFUNDING_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()), "\n");

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Erro:", errorText);
      return;
    }

    const data = await res.json();
    
    console.log("✅ Resposta recebida com sucesso!\n");
    console.log("Chaves do objeto raiz:", Object.keys(data), "\n");
    
    if (data.data && Array.isArray(data.data)) {
      console.log("Total de ofertas:", data.data.length, "\n");
      
      if (data.data.length > 0) {
        console.log("=== PRIMEIRA OFERTA (exemplo) ===");
        console.log(JSON.stringify(data.data[0], null, 2), "\n");
        
        console.log("=== CAMPOS DISPONÍVEIS ===");
        console.log("Chaves:", Object.keys(data.data[0]), "\n");
      }
    }
    
    console.log("=== RESPOSTA COMPLETA (primeiros 3 itens) ===");
    const preview = {
      ...data,
      data: data.data?.slice(0, 3) || [],
    };
    console.log(JSON.stringify(preview, null, 2));
    
  } catch (error) {
    console.error("❌ Erro ao chamar API:", error.message);
  }
}

testTokenizaApi();
