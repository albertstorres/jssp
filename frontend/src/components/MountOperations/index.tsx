import './styles.css';
import { useMemo, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface MountOperationsProps {
  selectedTaskIds: number[];
  selectedTeamIds: number[];
  selectedEquipmentIds?: number[];
  selectedTeamsDetails?: { id: number; name: string }[];
  optimizationType?: 'classic' | 'quantum' | null;
  onClassicJobsChange?: (jobsJson: { jobs: Record<string, Array<[number[], number[], number[]]>> }) => void;
  onQuantumJobsChange?: (jobsJson: { jobs: Record<string, Array<[number[], number[], number[]]>> }) => void;
  onSendPayload?: (params: {
    type: 'classic' | 'quantum';
    payload: { jobs: Record<string, Array<[number[], number[], number[]]>> };
  }) => void;
  onRemoveSpecificTasks?: (taskIdsToRemove: number[]) => void; // callback para remover tarefas específicas
  onRemoveSpecificTeams?: (teamIdsToRemove: number[]) => void; // callback para remover equipes específicas
  onMountSuccess?: () => void; // callback para notificar sucesso da montagem
}

// Estrutura alvo: {
//   jobs: {
//     job_1: [([taskIds], [equipmentIds], [teamIds])]
//   }
// }

function MountOperations({
  selectedTaskIds,
  selectedTeamIds,
  selectedEquipmentIds = [],
  selectedTeamsDetails = [],
  optimizationType = 'classic',
  onClassicJobsChange,
  onQuantumJobsChange,
  onSendPayload,
  onRemoveSpecificTasks,
  onRemoveSpecificTeams,
  onMountSuccess,
}: MountOperationsProps) {
  const [classicJobs, setClassicJobs] = useState<Record<string, Array<[number[], number[], number[]]>>>({});
  const [quantumJobs, setQuantumJobs] = useState<Record<string, Array<[number[], number[], number[]]>>>({});
  const [classicJobTeamNames, setClassicJobTeamNames] = useState<Record<string, string[]>>({});
  const [quantumJobTeamNames, setQuantumJobTeamNames] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const nextJobName = useMemo(() => {
    const dict = optimizationType === 'quantum' ? quantumJobs : classicJobs;
    const count = Object.keys(dict).length + 1;
    return `job_${count}`;
  }, [classicJobs, quantumJobs, optimizationType]);

  // Função para fazer PATCH nas tarefas selecionadas
  const patchTasksOnMount = async (taskIds: number[]): Promise<boolean> => {
    if (!access || taskIds.length === 0) return true;

    console.log('Atualizando tarefas para on_mount=true:', taskIds);
    
    try {
      const patchPromises = taskIds.map(async (taskId) => {
        const response = await api.patch(
          `http://localhost:8000/api/v1/tasks/${taskId}/`,
          { on_mount: true },
          {
            headers: {
              Authorization: `Bearer ${access}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`Tarefa ${taskId} atualizada para on_mount=true`);
        return response.data;
      });

      await Promise.all(patchPromises);
      console.log('Todas as tarefas foram atualizadas para on_mount=true');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tarefas:', error);
      return false;
    }
  };

  // Função para fazer PATCH nas equipes selecionadas
  const patchTeamsOnMount = async (teamIds: number[]): Promise<boolean> => {
    if (!access || teamIds.length === 0) return true;

    console.log('Atualizando equipes para on_mount=true:', teamIds);
    
    try {
      const patchPromises = teamIds.map(async (teamId) => {
        const response = await api.patch(
          `http://localhost:8000/api/v1/teams/${teamId}/`,
          { on_mount: true },
          {
            headers: {
              Authorization: `Bearer ${access}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`Equipe ${teamId} atualizada para on_mount=true`);
        return response.data;
      });

      await Promise.all(patchPromises);
      console.log('✅ Todas as equipes foram atualizadas para on_mount=true');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar equipes:', error);
      return false;
    }
  };

  async function handleMountJob() {
    if (!selectedTaskIds || selectedTaskIds.length === 0) {
      // Sem tarefas, nada a montar
      return;
    }

    if (!access) {
      console.error('❌ Token de acesso não disponível');
      return;
    }

    setLoading(true);

    try {
      // Capturar apenas as tarefas selecionadas no momento atual (não acumuladas)
      const currentTaskIds = [...selectedTaskIds];
      const currentEquipmentIds = [...(selectedEquipmentIds || [])];
      const currentTeamIds = [...(selectedTeamIds || [])];

      console.log('🔍 Montando job com tarefas atuais:', currentTaskIds);
      console.log('🔍 Equipamentos atuais:', currentEquipmentIds);
      console.log('🔍 Equipes atuais:', currentTeamIds);

      // 1. Primeiro, fazer PATCH nas tarefas para on_mount=true
      console.log('📝 Passo 1: Atualizando tarefas para on_mount=true...');
      const tasksUpdated = await patchTasksOnMount(currentTaskIds);
      
      if (!tasksUpdated) {
        console.error('Falha ao atualizar tarefas. Operação cancelada.');
        setLoading(false);
        return;
      }

      // 2. Depois, fazer PATCH nas equipes para on_mount=true
      console.log('Passo 2: Atualizando equipes para on_mount=true...');
      const teamsUpdated = await patchTeamsOnMount(currentTeamIds);
      
      if (!teamsUpdated) {
        console.error('Falha ao atualizar equipes. Operação cancelada.');
        setLoading(false);
        return;
      }

      // 3. Criar o job localmente após os PATCHs bem-sucedidos
      console.log('Passo 3: Criando job localmente...');
      
      // Estratégia: usar todas as equipes selecionadas para executar as tarefas
      const teamIds = currentTeamIds.length > 0 ? currentTeamIds : [];
      
      console.log('TeamIds selecionados para o job:', teamIds);
      console.log('Total de equipes disponíveis:', currentTeamIds.length);
      
      const jobTuple: [number[], number[], number[]] = [
        currentTaskIds,
        currentEquipmentIds,
        teamIds,
      ];

      const newJobKey = nextJobName;

      if (optimizationType === 'quantum') {
        const newJobs = { ...quantumJobs, [newJobKey]: [jobTuple] };
        setQuantumJobs(newJobs);
        // Persistir nomes das equipes para este job
        const names = teamIds.map(id => selectedTeamsDetails.find(t => t.id === id)?.name || `#${id}`);
        setQuantumJobTeamNames(prev => ({ ...prev, [newJobKey]: names }));
        onQuantumJobsChange?.({ jobs: newJobs });
        onSendPayload?.({ type: 'quantum', payload: { jobs: newJobs } });
      } else {
        const newJobs = { ...classicJobs, [newJobKey]: [jobTuple] };
        setClassicJobs(newJobs);
        // Persistir nomes das equipes para este job
        const names = teamIds.map(id => selectedTeamsDetails.find(t => t.id === id)?.name || `#${id}`);
        setClassicJobTeamNames(prev => ({ ...prev, [newJobKey]: names }));
        onClassicJobsChange?.({ jobs: newJobs });
        onSendPayload?.({ type: 'classic', payload: { jobs: newJobs } });
      }

      console.log(`Job ${newJobKey} criado com tarefas:`, currentTaskIds);
      console.log(`Job ${newJobKey} criado com teamIds:`, teamIds);

      // 4. Remover apenas as tarefas que foram usadas neste job
      if (onRemoveSpecificTasks) {
        onRemoveSpecificTasks(currentTaskIds);
      }

      // 5. Remover as equipes que foram usadas neste job
      if (onRemoveSpecificTeams && currentTeamIds.length > 0) {
        onRemoveSpecificTeams(currentTeamIds);
      }

      console.log(`Operação montada com sucesso! Job ${newJobKey} criado.`);
      console.log(`Tarefas removidas da seleção: ${currentTaskIds.length}`);
      console.log(`Equipes removidas da seleção: ${currentTeamIds.length}`);

      // Notificar sucesso da montagem para atualizar a página
      if (onMountSuccess) {
        onMountSuccess();
      }

    } catch (error) {
      console.error('Erro durante a montagem da operação:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mount-operations-container">
      <button 
        type="button" 
        className="mount-operation-button" 
        onClick={handleMountJob}
        disabled={loading || !selectedTaskIds || selectedTaskIds.length === 0}
      >
        {loading ? 'Montando...' : 'Montar Operação'}
      </button>

      {/* Card de visualização amigável dos jobs montados */}
      {(() => {
        const data = optimizationType === 'quantum' ? quantumJobs : classicJobs;
        const jobTeamNames = optimizationType === 'quantum' ? quantumJobTeamNames : classicJobTeamNames;
        const hasJobs = Object.keys(data).length > 0;
        if (!hasJobs) return null;
        return (
          <div className="mount-operations-card">
            <div className="mount-operations-card-header">
              <h3 className="mount-operations-card-title">Operações montadas</h3>
              <span className="mount-operations-card-count">
                {Object.keys(data).length} job{Object.keys(data).length !== 1 ? 's' : ''}
              </span>
            </div>
            <ul className="mount-operations-job-list">
              {Object.entries(data).map(([jobKey, tuples]) => {
                // Cada job contém um array de tuplas [tasks, equipments, teams]
                return tuples.map(([taskIds, equipmentIds, teamIds], idx) => (
                  <li key={`${jobKey}-${idx}`} className="mount-operations-job-item">
                    <div className="job-item-header">
                      <span className="job-key">{jobKey}</span>
                      <span className="job-badges">
                        <span className="badge badge-tasks">{taskIds.length} tarefa{taskIds.length !== 1 ? 's' : ''}</span>
                        <span className="badge badge-equipments">{equipmentIds.length} equipamento{equipmentIds.length !== 1 ? 's' : ''}</span>
                        <span className="badge badge-teams">{teamIds.length} equipe{teamIds.length !== 1 ? 's' : ''}</span>
                      </span>
                    </div>
                    <div className="job-detail-grid">
                      <div className="job-detail">
                        <span className="detail-label">Tarefas:</span>
                        <span className="detail-values">{taskIds.length > 0 ? `#${taskIds.join(', #')}` : '—'}</span>
                      </div>
                      <div className="job-detail">
                        <span className="detail-label">Equipamentos:</span>
                        <span className="detail-values">{equipmentIds.length > 0 ? `#${equipmentIds.join(', #')}` : '—'}</span>
                      </div>
                      <div className="job-detail">
                        <span className="detail-label">Equipes:</span>
                        <span className="detail-values">
                          {teamIds.length > 0
                            ? (jobTeamNames[jobKey] && jobTeamNames[jobKey].length === teamIds.length
                                ? jobTeamNames[jobKey].join(', ')
                                : `#${teamIds.join(', #')}`)
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </li>
                ));
              })}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}

export default MountOperations;


