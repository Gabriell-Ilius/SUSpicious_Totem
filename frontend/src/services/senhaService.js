import api from './api';

const senhaService = {
  checkCpfSchedule: async (cpf) => {
    try {
      const response = await api.post('/senhas/check-cpf', { cpf });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar agendamento por CPF:', error);
      return { has_schedule: false };
    }
  },

  gerarSenha: async (tipoAtendimento, cpf = null, prioridade = 0, subPrioridade = null) => {
    try {
      const response = await api.post('/senhas/', {
        tipo_atendimento: tipoAtendimento,
        cpf: cpf || null,
        prioridade: prioridade,
        sub_prioridade: subPrioridade || null
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar senha:', error);
      throw error;
    }
  },
};

export default senhaService;
