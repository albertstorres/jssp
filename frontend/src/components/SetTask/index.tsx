import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import type { Task } from '../GetTasks';

interface SetTaskProps {
  selectedTeamIds: number[];
  selectedCategoryId: number | null;
  onSuccess?: () => void;
}

function SetTask({ selectedTeamIds, selectedCategoryId, onSuccess }: SetTaskProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedTeamIds.length || !selectedCategoryId) {
      setMessage('Selecione pelo menos uma equipe e uma categoria.');
      return;
    }

    try {
      for (const teamId of selectedTeamIds) {
        const response = await api.post<Task>(
          'http://localhost:8000/api/v1/tasks/',
          {
            team: teamId,
            category: selectedCategoryId,
          },
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );
        console.log(`Tarefa criada com ID: ${response.data.id}`);
      }

      setMessage(`Tarefa(s) criada(s) com sucesso.`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao criar tarefa: ', error);
      setMessage('Erro ao criar tarefa.');
    }
  }

  return (
    <div className="set-task-container">
      <form onSubmit={handleSubmit} className="set-task-form">
        <button type="submit" className="create-task-button">
          Criar Tarefa(s)
        </button>
        {message && <p className="feedback-message">{message}</p>}
      </form>
    </div>
  );
}

export default SetTask;