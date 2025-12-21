/**
 * Biblioteca de Templates de Negócio
 * Templates pré-configurados com receitas e custos típicos
 */

export interface ReceitaTemplate {
  nome: string;
  precoUnitario: number;
  quantidadeMensal: number;
  crescimentoMensalPct?: number;
}

export interface CustoFixoTemplate {
  nome: string;
  valorMensal: number;
  reajusteAnualPct?: number;
}

export interface BusinessTemplate {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  receitas: ReceitaTemplate[];
  custosFixos: CustoFixoTemplate[];
}

export const businessTemplates: BusinessTemplate[] = [
  {
    id: 'academia',
    nome: 'Academia',
    descricao: 'Modelo típico de academia com mensalidades e custos operacionais',
    icone: '💪',
    receitas: [
      {
        nome: 'Mensalidade Básica',
        precoUnitario: 15000, // R$ 150
        quantidadeMensal: 100,
        crescimentoMensalPct: 5,
      },
      {
        nome: 'Mensalidade Premium',
        precoUnitario: 25000, // R$ 250
        quantidadeMensal: 30,
        crescimentoMensalPct: 3,
      },
      {
        nome: 'Personal Trainer',
        precoUnitario: 10000, // R$ 100
        quantidadeMensal: 20,
        crescimentoMensalPct: 2,
      },
    ],
    custosFixos: [
      {
        nome: 'Aluguel',
        valorMensal: 1000000, // R$ 10k
        reajusteAnualPct: 10,
      },
      {
        nome: 'Pessoal (Instrutores)',
        valorMensal: 2000000, // R$ 20k
        reajusteAnualPct: 5,
      },
      {
        nome: 'Energia e Água',
        valorMensal: 300000, // R$ 3k
        reajusteAnualPct: 8,
      },
      {
        nome: 'Manutenção Equipamentos',
        valorMensal: 200000, // R$ 2k
        reajusteAnualPct: 5,
      },
      {
        nome: 'Marketing',
        valorMensal: 500000, // R$ 5k
      },
    ],
  },
  {
    id: 'restaurante',
    nome: 'Restaurante',
    descricao: 'Modelo típico de restaurante com diferentes categorias de pratos',
    icone: '🍽️',
    receitas: [
      {
        nome: 'Almoço Executivo',
        precoUnitario: 3500, // R$ 35
        quantidadeMensal: 600, // ~20 por dia útil
        crescimentoMensalPct: 2,
      },
      {
        nome: 'Jantar À La Carte',
        precoUnitario: 8000, // R$ 80
        quantidadeMensal: 300, // ~10 por dia
        crescimentoMensalPct: 3,
      },
      {
        nome: 'Bebidas',
        precoUnitario: 1500, // R$ 15
        quantidadeMensal: 800,
        crescimentoMensalPct: 2,
      },
    ],
    custosFixos: [
      {
        nome: 'Aluguel',
        valorMensal: 1500000, // R$ 15k
        reajusteAnualPct: 10,
      },
      {
        nome: 'Pessoal (Cozinha + Salão)',
        valorMensal: 3000000, // R$ 30k
        reajusteAnualPct: 6,
      },
      {
        nome: 'Energia, Água e Gás',
        valorMensal: 500000, // R$ 5k
        reajusteAnualPct: 8,
      },
      {
        nome: 'Fornecedores (Fixo)',
        valorMensal: 1000000, // R$ 10k
        reajusteAnualPct: 7,
      },
      {
        nome: 'Marketing',
        valorMensal: 300000, // R$ 3k
      },
    ],
  },
  {
    id: 'saas',
    nome: 'SaaS B2B',
    descricao: 'Modelo típico de software como serviço para empresas',
    icone: '💻',
    receitas: [
      {
        nome: 'Plano Starter',
        precoUnitario: 9900, // R$ 99
        quantidadeMensal: 50,
        crescimentoMensalPct: 10,
      },
      {
        nome: 'Plano Professional',
        precoUnitario: 29900, // R$ 299
        quantidadeMensal: 20,
        crescimentoMensalPct: 8,
      },
      {
        nome: 'Plano Enterprise',
        precoUnitario: 99900, // R$ 999
        quantidadeMensal: 5,
        crescimentoMensalPct: 5,
      },
      {
        nome: 'Serviços de Implementação',
        precoUnitario: 500000, // R$ 5k
        quantidadeMensal: 3,
      },
    ],
    custosFixos: [
      {
        nome: 'Infraestrutura Cloud (AWS/Azure)',
        valorMensal: 500000, // R$ 5k
        reajusteAnualPct: 10,
      },
      {
        nome: 'Pessoal (Dev + Suporte)',
        valorMensal: 4000000, // R$ 40k
        reajusteAnualPct: 8,
      },
      {
        nome: 'Marketing Digital',
        valorMensal: 1000000, // R$ 10k
      },
      {
        nome: 'Ferramentas e Licenças',
        valorMensal: 200000, // R$ 2k
        reajusteAnualPct: 5,
      },
    ],
  },
  {
    id: 'clinica',
    nome: 'Clínica Médica',
    descricao: 'Modelo típico de clínica com consultas e procedimentos',
    icone: '🏥',
    receitas: [
      {
        nome: 'Consulta Clínico Geral',
        precoUnitario: 20000, // R$ 200
        quantidadeMensal: 200, // ~10 por dia útil
        crescimentoMensalPct: 3,
      },
      {
        nome: 'Consulta Especialista',
        precoUnitario: 35000, // R$ 350
        quantidadeMensal: 80,
        crescimentoMensalPct: 4,
      },
      {
        nome: 'Exames Laboratoriais',
        precoUnitario: 15000, // R$ 150
        quantidadeMensal: 100,
        crescimentoMensalPct: 2,
      },
      {
        nome: 'Procedimentos Simples',
        precoUnitario: 50000, // R$ 500
        quantidadeMensal: 30,
        crescimentoMensalPct: 2,
      },
    ],
    custosFixos: [
      {
        nome: 'Aluguel',
        valorMensal: 800000, // R$ 8k
        reajusteAnualPct: 10,
      },
      {
        nome: 'Pessoal (Médicos + Enfermagem)',
        valorMensal: 3500000, // R$ 35k
        reajusteAnualPct: 7,
      },
      {
        nome: 'Material Médico',
        valorMensal: 500000, // R$ 5k
        reajusteAnualPct: 6,
      },
      {
        nome: 'Energia e Água',
        valorMensal: 200000, // R$ 2k
        reajusteAnualPct: 8,
      },
      {
        nome: 'Seguros e Certificações',
        valorMensal: 300000, // R$ 3k
        reajusteAnualPct: 5,
      },
      {
        nome: 'Marketing',
        valorMensal: 400000, // R$ 4k
      },
    ],
  },
];

export function getTemplateById(id: string): BusinessTemplate | undefined {
  return businessTemplates.find(t => t.id === id);
}
