/**
 * Módulo de Integração de API e Gerenciamento de Resiliência Offline-First.
 * Alinhado com os requisitos de CPF e tb_fila_diaria do Biochallenge 2026.
 */

const API_BASE_URL = '/api/v1';

let offlineCounter = 100;
const pendingOfflineTickets = [];

/**
 * Verifica a saúde da API do Backend.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Consulta agendamentos no e-SUS PEC por CPF.
 */
export async function checkCPFSchedule(cpf) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/check-cpf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
      signal: AbortSignal.timeout(2500),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('[OFFLINE] Falha ao consultar CPF no e-SUS:', error);
  }
  return { has_schedule: false };
}

/**
 * Emite uma nova senha de atendimento no backend (tb_fila_diaria).
 * Em modo offline, executa a emissão de emergência local.
 */
export async function createTicket(category, priority = 'NORMAL', cpf = null, subPriority = null) {
  const priorityNum = priority === 'PREFERENCIAL' ? 1 : 0;
  const payload = {
    tipo_demanda: category,
    prioridade_fila: priorityNum,
    sub_prioridade: subPriority,
    cpf_paciente: cpf,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      return { ...data, isOffline: false };
    }
    throw new Error(`Erro API: ${response.status}`);
  } catch (error) {
    console.warn('[OFFLINE FALLBACK] Ativando gerador de senha offline local...');
    
    offlineCounter++;
    const categoryPrefixes = {
      AGENDADO: 'AGN',
      ESPONTANEO: 'ESP',
      VACINACAO: 'VAC',
      FARMACIA: 'FAR',
      TRIAGEM_DIGITAL: 'TRG',
    };
    const prefix = categoryPrefixes[category] || 'SNH';
    const pFlag = priorityNum === 1 ? 'P' : '';
    const offlineTicketNumber = `${prefix}-${pFlag}OFF${offlineCounter}`;

    const defaultSetores = {
      AGENDADO: 'Consultório 02 - Atendimento Agendado',
      ESPONTANEO: 'Balcão 01 - Acolhimento & Triagem',
      VACINACAO: 'Sala de Imunização 02 - Vacinas',
      FARMACIA: 'Farmácia Básica - Dispensação de Medicamentos',
      TRIAGEM_DIGITAL: 'Balcão de Triagem Digital (QR)',
    };

    const offlineTicket = {
      id_atendimento: Date.now(),
      ticket_number: offlineTicketNumber,
      tipo_demanda: category,
      prioridade_fila: priorityNum,
      sub_prioridade: subPriority,
      cpf_paciente: cpf,
      setor_destino: defaultSetores[category] || 'Balcão de Triagem',
      status_sincronizacao: false,
      created_at: new Date().toISOString(),
      status: 'WAITING',
      qr_code_data: (category === 'TRIAGEM_DIGITAL' || category === 'ESPONTANEO') ? `https://ubs-triagem.gov.br/offline?ticket=${offlineTicketNumber}` : null,
      isOffline: true,
    };

    pendingOfflineTickets.push(offlineTicket);
    return offlineTicket;
  }
}
