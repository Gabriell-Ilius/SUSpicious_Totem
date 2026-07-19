import api from './api';

const filaService = {
  consultarFilas: async () => {
    try {
      const response = await api.get('/filas/');
      return response.data; // { total_aguardando, senhas, ultimas_chamadas }
    } catch (error) {
      console.error('Erro ao consultar filas:', error);
      throw error;
    }
  },
};

export default filaService;
