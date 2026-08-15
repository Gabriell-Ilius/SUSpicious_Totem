import api from './api';

const filaService = {
  consultarFilas: async () => {
    try {
      const response = await api.get('/filas/');
      return response.data; // { total_aguardando, senhas, ultimas_emitidas, ultimas_chamadas }
    } catch (error) {
      console.error('Erro ao consultar filas:', error);
      throw error;
    }
  },

  chamarProxima: async () => {
    try {
      const response = await api.post('/senhas/proxima');
      return response.data;
    } catch (error) {
      console.error('Erro ao chamar próxima senha:', error);
      throw error;
    }
  },

  resetarFila: async () => {
    try {
      const response = await api.post('/senhas/reset');
      return response.data;
    } catch (error) {
      console.error('Erro ao resetar fila:', error);
      throw error;
    }
  }
};

export default filaService;
