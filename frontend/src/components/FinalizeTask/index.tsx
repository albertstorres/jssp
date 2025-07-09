import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface FinalizeTaskProps {
  taskId: number;
  onTaskFinalized: () => void;  //Callback para sinalizar a página
}

function FinalizeTask({ taskId, onTaskFinalized }: FinalizeTaskProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();
  const [message, setMessage] = useState('');

  async function handleFinalize() {
    try {
      const url = `http://localhost:8000/api/v1/tasks/${taskId}/`;
      
      await api.patch(
        url,
        { status: 'finished' },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );
      setMessage('Tarefa finalizada com sucesso!');
      onTaskFinalized(); // NOVO: Dispara reload da lista
    } catch (error) {
      console.error('Erro ao finalizar tarefa:', error);
      setMessage('Erro ao finalizar a tarefa.');
    }
  }

  return (
    <div className="finalize-task-container">
      <button onClick={handleFinalize} className="finalize-task-button">
        Finalizar Tarefa
      </button>

      {message && (
        <p
          className={`finalize-task-message ${
            message.includes('sucesso') ? 'success' : 'error'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default FinalizeTask;