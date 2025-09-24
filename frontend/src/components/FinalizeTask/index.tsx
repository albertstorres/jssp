import './styles.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface FinalizeTaskProps {
  taskId: number;
  onTaskFinalized: () => void;  //Callback para sinalizar a página
}

interface TeamTask {
  id: number;
  team: number;
  task: number;
  begin: string;
  end: string;
}

interface Team {
  id: number;
  name: string;
  shift: number;
  is_ocupied: boolean;
}

interface TaskDetail {
  id: number;
  status: string;
  created_at: string;
  finished_at: string | null;
  categorie: number;
}

interface ApiError {
  response?: {
    data: {
      message?: string;
    };
    status: number;
  };
}

function FinalizeTask({ taskId, onTaskFinalized }: FinalizeTaskProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState<string>('');
  const [teamId, setTeamId] = useState<number | null>(null);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);

  // Buscar equipe ANTES de finalizar (exibir no card)
  useEffect(() => {
    async function fetchTeamForTask() {
      if (!access || !taskId) return;
      setLoadingTeam(true);
      try {
        const teamTaskUrl = `http://localhost:8000/api/v1/team_task/?task=${taskId}`;
        console.log('🔎 [FinalizeTask] Buscando team_task por tarefa...', { url: teamTaskUrl, taskId });
        const teamTaskResp = await api.get<Array<{ id: number; team: number; team_name?: string; task: number }>>(
          teamTaskUrl,
          { headers: { Authorization: `Bearer ${access}` } }
        );
        console.log('✅ [FinalizeTask] team_task resposta:', teamTaskResp.data);

        if (Array.isArray(teamTaskResp.data) && teamTaskResp.data.length > 0) {
          const tt0: any = teamTaskResp.data[0];
          const resolvedTeamId: number | undefined = (tt0 && (tt0.team ?? tt0.team_id));
          const inlineTeamName: string | undefined = tt0 && (tt0.team_name ?? tt0.teamName);
          console.log('ℹ️ [FinalizeTask] Primeiro team_task:', tt0);
          console.log('🆔 [FinalizeTask] teamId resolvido:', resolvedTeamId);
          console.log('🏷️ [FinalizeTask] team_name inline:', inlineTeamName);

          if (inlineTeamName && inlineTeamName.trim() !== '') {
            setTeamName(inlineTeamName);
            setTeamId(typeof resolvedTeamId === 'number' ? resolvedTeamId : null);
            console.log('✅ [FinalizeTask] Nome da equipe definido via team_task.team_name');
          } else if (typeof resolvedTeamId === 'number') {
            try {
              const teamDetailUrl = `http://localhost:8000/api/v1/teams/${resolvedTeamId}/`;
              console.log('🔎 [FinalizeTask] Buscando detalhes da equipe...', { url: teamDetailUrl });
              const teamResponse = await api.get<{ id: number; name: string }>(teamDetailUrl, {
                headers: { Authorization: `Bearer ${access}` },
              });
              setTeamName(teamResponse.data.name);
              setTeamId(resolvedTeamId);
              console.log('✅ [FinalizeTask] Nome da equipe definido via teams/<id>:', teamResponse.data);
            } catch (teamError) {
              console.error('❌ [FinalizeTask] Erro ao buscar equipe (via teams/<id>):', teamError);
              setTeamName('');
              setTeamId(null);
            }
          } else {
            console.warn('⚠️ [FinalizeTask] teamId não encontrado no team_task');
            setTeamName('');
            setTeamId(null);
          }
        } else {
          console.warn('⚠️ [FinalizeTask] Nenhum team_task retornado para esta tarefa');
          setTeamName('');
          setTeamId(null);
        }
      } catch (error) {
        console.error('❌ [FinalizeTask] Erro ao buscar team_task inicial:', error);
        setTeamName('');
        setTeamId(null);
      } finally {
        setLoadingTeam(false);
      }
    }

    fetchTeamForTask();
  }, [access, taskId]);

  async function handleFinalize() {
    if (!access) {
      console.error('❌ Token de acesso não disponível');
      setMessage('Erro: Token de acesso não disponível');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('🚀 === INICIANDO FINALIZAÇÃO DA TAREFA ===');
      console.log('📋 Task ID:', taskId);
      console.log('🔑 Token disponível:', !!access);

      // PASSO 1: Finalizar a tarefa
      console.log('\n📝 PASSO 1: Finalizando tarefa...');
      const taskUrl = `http://localhost:8000/api/v1/tasks/${taskId}/`;
      console.log('📡 URL da tarefa:', taskUrl);

      const taskResponse = await api.patch(
        taskUrl,
        { status: 'finished' },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      console.log('✅ Tarefa finalizada com sucesso!');
      console.log('📊 Resposta da API:', taskResponse.data);

      // PASSO 2: Buscar todas as tarefas associadas à equipe desta tarefa
      console.log('\n🔍 PASSO 2: Buscando tarefas da equipe...');
      
      // Primeiro, buscar o team_task para saber qual equipe está associada
      const teamTaskUrl = `http://localhost:8000/api/v1/team_task/?task=${taskId}`;
      console.log('📡 URL do team_task:', teamTaskUrl);

      const teamTaskResponse = await api.get<TeamTask[]>(teamTaskUrl, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      if (teamTaskResponse.data.length === 0) {
        console.log('⚠️ Nenhum team_task encontrado para esta tarefa');
        setMessage('Tarefa finalizada, mas não foi possível verificar o status da equipe');
        onTaskFinalized();
        return;
      }

      const teamTask = teamTaskResponse.data[0]; // Assumindo uma equipe por tarefa
      const teamId = teamTask.team;
      
      console.log('🏢 Equipe associada à tarefa:', teamId);
      console.log('📋 TeamTask encontrado:', teamTask);

      // PASSO 3: Buscar todas as tarefas da equipe
      console.log('\n🔍 PASSO 3: Buscando todas as tarefas da equipe...');
      
      // Buscar todas as tarefas associadas a esta equipe
      const allTeamTasksUrl = `http://localhost:8000/api/v1/team_task/?team=${teamId}`;
      console.log('📡 URL de todas as tarefas da equipe:', allTeamTasksUrl);

      const allTeamTasksResponse = await api.get<TeamTask[]>(allTeamTasksUrl, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      console.log('📊 Total de tarefas da equipe:', allTeamTasksResponse.data.length);
      console.log('📋 Todas as tarefas da equipe:', allTeamTasksResponse.data);

      // PASSO 4: Verificar status de todas as tarefas da equipe
      console.log('\n🔍 PASSO 4: Verificando status de todas as tarefas...');
      
      const allTaskIds = allTeamTasksResponse.data.map(tt => tt.task);
      console.log('📋 IDs de todas as tarefas da equipe:', allTaskIds);

      let allTasksFinished = true;
      const taskStatuses: { id: number; status: string }[] = [];

      for (const taskId of allTaskIds) {
        try {
          const taskDetailUrl = `http://localhost:8000/api/v1/tasks/${taskId}/`;
          console.log(`🔍 Verificando tarefa ${taskId}:`, taskDetailUrl);

          const taskDetailResponse = await api.get<TaskDetail>(taskDetailUrl, {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          });

          const taskStatus = taskDetailResponse.data.status;
          taskStatuses.push({ id: taskId, status: taskStatus });
          
          console.log(`📊 Tarefa ${taskId}: status = ${taskStatus}`);
          
          if (taskStatus !== 'finished') {
            allTasksFinished = false;
            console.log(`⚠️ Tarefa ${taskId} NÃO está finalizada`);
          } else {
            console.log(`✅ Tarefa ${taskId} está finalizada`);
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar tarefa ${taskId}:`, error);
          allTasksFinished = false;
        }
      }

      console.log('\n📊 RESUMO DO STATUS DAS TAREFAS:');
      taskStatuses.forEach(({ id, status }) => {
        console.log(`  Tarefa ${id}: ${status}`);
      });
      console.log('🏁 Todas as tarefas finalizadas?', allTasksFinished);

      // PASSO 5: Atualizar status da equipe se todas as tarefas estiverem finalizadas
      if (allTasksFinished) {
        console.log('\n🎯 PASSO 5: Todas as tarefas finalizadas! Atualizando status da equipe...');
        
        const teamUrl = `http://localhost:8000/api/v1/teams/${teamId}/`;
        console.log('📡 URL da equipe:', teamUrl);

        const teamUpdateResponse = await api.patch(
          teamUrl,
          { is_ocupied: false },
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        console.log('✅ Status da equipe atualizado com sucesso!');
        console.log('📊 Resposta da atualização:', teamUpdateResponse.data);
        console.log('🏢 Equipe agora está DISPONÍVEL (is_ocupied = false)');
        
        setMessage('Tarefa finalizada e equipe liberada com sucesso!');
      } else {
        console.log('\n⚠️ PASSO 5: Nem todas as tarefas estão finalizadas. Equipe permanece ocupada.');
        console.log('📊 Tarefas pendentes:', taskStatuses.filter(t => t.status !== 'finished'));
        
        setMessage('Tarefa finalizada com sucesso! Equipe ainda tem tarefas pendentes.');
      }

      // PASSO 6: Log final e callback
      console.log('\n🎉 === FINALIZAÇÃO CONCLUÍDA ===');
      console.log('📋 Tarefa finalizada:', taskId);
      console.log('🏢 Equipe verificada:', teamId);
      console.log('🔄 Status da equipe atualizado:', allTasksFinished ? 'Disponível' : 'Ocupada');
      
      onTaskFinalized(); // Dispara reload da lista

    } catch (error: unknown) {
      console.error('❌ Erro durante a finalização:', error);
      
      // Type guard para verificar se é um ApiError
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as ApiError;
        if (apiError.response) {
          console.error('📊 Resposta de erro:', apiError.response.data);
          console.error('📊 Status de erro:', apiError.response.status);
          setMessage(`Erro ${apiError.response.status}: ${apiError.response.data.message || 'Erro desconhecido'}`);
        }
      } else {
        setMessage('Erro ao finalizar a tarefa. Verifique o console para detalhes.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="finalize-task-container">
      <div className="finalize-task-team-info">
        <strong>Equipe:</strong> {teamName || (teamId ? `Equipe #${teamId}` : 'Sem equipe')}
      </div>
      <button 
        onClick={handleFinalize} 
        className="finalize-task-button"
        disabled={loading || loadingTeam}
      >
        {loading ? 'Finalizando...' : (loadingTeam ? 'Carregando equipe...' : 'Finalizar Tarefa')}
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