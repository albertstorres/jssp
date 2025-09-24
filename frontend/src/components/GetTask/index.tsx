import './styles.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface TaskDetail {
  id: number;
  status: string;
  created_at: string;
  finished_at: string | null;
  team: number;
  categorie: number;
}

interface TeamInfo {
  id: number;
  name: string;
}

interface GetTaskProps {
  taskId: number;
}

function GetTask({ taskId }: GetTaskProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [teamName, setTeamName] = useState<string>('');
  const [teamId, setTeamId] = useState<number | null>(null);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTask() {
      try {
        console.log('🔄 [GetTask] Buscando task detalhada...', { taskId });
        const response = await api.get<TaskDetail>(`http://localhost:8000/api/v1/tasks/${taskId}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setTask(response.data);
        console.log('✅ [GetTask] Task detalhada carregada:', response.data);
        console.log('🔍 [GetTask] Task tem campo team?', 'team' in response.data, response.data.team);
        // Buscar equipe via tabela auxiliar team_task
        try {
          const teamTaskUrl = `http://localhost:8000/api/v1/team_task/?task=${taskId}`;
          console.log('🔎 [GetTask] Buscando team_task por tarefa...', { url: teamTaskUrl });
          const teamTaskResp = await api.get<Array<{ id: number; team: number; task: number }>>(
            teamTaskUrl,
            { headers: { Authorization: `Bearer ${access}` } }
          );
          console.log('✅ [GetTask] team_task resposta:', teamTaskResp.data);
          console.log('🔍 [GetTask] team_task é array?', Array.isArray(teamTaskResp.data));
          console.log('🔍 [GetTask] team_task length:', teamTaskResp.data?.length);
          console.log('🔍 [GetTask] team_task primeiro item:', teamTaskResp.data?.[0]);

          if (Array.isArray(teamTaskResp.data) && teamTaskResp.data.length > 0) {
            const tt0: any = teamTaskResp.data[0];
            const teamId: number | undefined = (tt0 && (tt0.team ?? tt0.team_id));
            const inlineTeamName: string | undefined = tt0 && (tt0.team_name ?? tt0.teamName);

            console.log('ℹ️ [GetTask] Primeiro team_task:', tt0);
            console.log('🆔 [GetTask] teamId resolvido:', teamId);
            console.log('🏷️ [GetTask] team_name inline:', inlineTeamName);
            console.log('🔍 [GetTask] tt0.team:', tt0?.team);
            console.log('🔍 [GetTask] tt0.team_name:', tt0?.team_name);
            console.log('🔍 [GetTask] typeof teamId:', typeof teamId);
            console.log('🔍 [GetTask] typeof inlineTeamName:', typeof inlineTeamName);
            console.log('🔍 [GetTask] inlineTeamName trim:', inlineTeamName?.trim());

            if (inlineTeamName && typeof inlineTeamName === 'string' && inlineTeamName.trim() !== '') {
              setTeamName(inlineTeamName);
              setTeamId(typeof teamId === 'number' ? teamId : null);
              console.log('✅ [GetTask] Nome da equipe definido via team_task.team_name');
              console.log('🎯 [GetTask] FINAL: teamName =', inlineTeamName);
            } else if (typeof teamId === 'number') {
              try {
                const teamDetailUrl = `http://localhost:8000/api/v1/teams/${teamId}/`;
                console.log('🔎 [GetTask] Buscando detalhes da equipe...', { url: teamDetailUrl });
                const teamResponse = await api.get<TeamInfo>(teamDetailUrl, {
                  headers: { Authorization: `Bearer ${access}` },
                });
                setTeamName(teamResponse.data.name);
                setTeamId(teamId);
                console.log('✅ [GetTask] Nome da equipe definido via teams/<id>:', teamResponse.data);
                console.log('🎯 [GetTask] FINAL: teamName =', teamResponse.data.name);
              } catch (teamError) {
                console.error('❌ [GetTask] Erro ao buscar equipe (via teams/<id>):', teamError);
                setTeamName('');
                setTeamId(null);
                console.log('🎯 [GetTask] FINAL: teamName = "" (erro)');
              }
            } else {
              console.warn('⚠️ [GetTask] teamId não encontrado no team_task');
              setTeamName('');
              setTeamId(null);
              console.log('🎯 [GetTask] FINAL: teamName = "" (sem teamId)');
            }
          } else {
            console.warn('⚠️ [GetTask] Nenhum team_task retornado para esta tarefa');
            setTeamName('');
            setTeamId(null);
            console.log('🎯 [GetTask] FINAL: teamName = "" (sem team_task)');
          }
        } catch (ttError) {
          console.error('❌ [GetTask] Erro ao buscar team_task da tarefa:', ttError);
          setTeamName('');
          setTeamId(null);
          console.log('🎯 [GetTask] FINAL: teamName = "" (erro team_task)');
        }
      } catch (error) {
        console.error('❌ [GetTask] Erro ao buscar task:', error);
        console.log('🎯 [GetTask] FINAL: teamName = "" (erro task)');
      }
    }

    if (access) {
      fetchTask();
    }
  }, [access, taskId]);

  if (!task) return <p>Carregando detalhes...</p>;

  return (
    <div className="get-task-container">
      <h2 className="get-task-title">Informações da Tarefa</h2>
      <p><strong>ID:</strong> {task.id}</p>
      <p><strong>Status:</strong> {task.status}</p>
      <p><strong>Criada em:</strong> {new Date(task.created_at).toLocaleString()}</p>
      <p><strong>Finalizada em:</strong> {task.finished_at ? new Date(task.finished_at).toLocaleString() : "Ainda não finalizada"}</p>
      <p><strong>Equipe:</strong> {teamName || (teamId ? `Equipe #${teamId}` : 'Sem equipe')}</p>
      <p><strong>Descrição da Categoria:</strong> {task.categorie}</p>
    </div>
  );
}

export default GetTask;