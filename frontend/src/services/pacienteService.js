import api from './api';

const pacienteService = {
  buscarPorCPF: async (cpf) => {
    try {
      const response = await api.get(`/pacientes/${cpf}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

export default pacienteService;
