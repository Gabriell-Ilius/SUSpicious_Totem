import api from './api';

const senhaService = {
  gerarSenha: async (tipoAtendimento, cpf = null, prioridade = 0) => {
    try {
      const response = await api.post('/senhas/', {
        tipo_atendimento: tipoAtendimento,
        cpf: cpf || null,
        prioridade: prioridade
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar senha:', error);
      throw error;
    }
  },
};

export default senhaService;
