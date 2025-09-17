import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface SetOperationProps {
  selectedTaskIds: number[];
  selectedEquipmentIds: number[];
  selectedTeamIds: number[];
  onSuccess?: () => void;
  optimizationType?: 'classic' | 'quantum' | null;
  jobsJson?: { jobs: Record<string, Array<[number[], number[], number[]]>> };
}

function SetOperation({
  selectedTaskIds,
  selectedEquipmentIds,
  selectedTeamIds,
  onSuccess,
  optimizationType,
  jobsJson,
}: SetOperationProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage('Informe um nome base para a(s) operação(ões).');
      return;
    }

    const url = 'http://localhost:8000/api/v1/operations/';

    try {
      // Quando houver jobs montados, criar 1 operação por job (um-a-um)
      if (jobsJson && jobsJson.jobs && Object.keys(jobsJson.jobs).length > 0) {
        const jobKeys = Object.keys(jobsJson.jobs);

        for (const jobKey of jobKeys) {
          const tuples = jobsJson.jobs[jobKey];
          if (!Array.isArray(tuples) || tuples.length === 0) continue;

          // Cada job é uma tupla: [ [taskIds], [equipmentIds], [teamIds] ]
          const [taskIds, equipmentIds, teamIds] = tuples[0];

          const payload = {
            name: `${name} - ${jobKey}`,
            task_ids: taskIds || [],
            equipment_ids: equipmentIds || [],
            team_ids: teamIds || [],
            optimization_type: optimizationType,
          };

          // Criar operação 1 por 1, de forma sequencial
          const response = await api.post(url, payload, {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          });
          console.log(`Operação criada (${jobKey}):`, response.data);
        }

        setMessage(`Operações criadas com sucesso: ${jobKeys.length}.`);
        if (onSuccess) onSuccess();
        return;
      }

      // Fallback: comportamento anterior (única operação a partir das seleções atuais)
      if (!selectedTaskIds.length) {
        setMessage('Selecione pelo menos uma tarefa ou forneça jobs válidos.');
        return;
      }

      const payload = {
        name,
        task_ids: selectedTaskIds,
        equipment_ids: selectedEquipmentIds,
        team_ids: selectedTeamIds,
        optimization_type: optimizationType,
      };

      const response = await api.post(url, payload, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      console.log('Operação criada com sucesso: ', response.data);
      setMessage('Operação criada com sucesso.');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao criar operação: ', error);
      setMessage('Erro ao criar operação.');
    }
  }

  return (
    <div className="set-operation-container">
      <form onSubmit={handleSubmit} className="set-operation-form">
        <input
          type="text"
          placeholder="Nome da operação"
          className="operation-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {optimizationType && (
          <p className="selected-optimization">
            Tipo:{' '}
            <strong>
              {optimizationType === 'classic' ? 'Otimização Clássica' : 'Otimização Quântica'}
            </strong>
          </p>
        )}
        <button type="submit" className="create-operation-button">
          Criar operação
        </button>
        {message && <p className="feedback-message">{message}</p>}
      </form>
    </div>
  );
}

export default SetOperation;