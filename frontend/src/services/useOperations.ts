import { useEffect, useState } from "react";
import api from "./api";
import useAuth from "../hooks/useAuth";
import { GanttTask } from "../components/GanttChart";

interface RawOperation {
  id: number;
  name: string;
  begin: string;
  end: string;
  finalized: boolean;
  tasks: number[]; // Array de IDs das tarefas
  equipments: {
    id: number;
    name: string;
  }[];
}

interface TaskDetail {
  id: number;
  status: string;
  created_at: string;
  finished_at: string | null;
  categorie: number;
}

interface TeamInfo {
  id: number;
  name: string;
  shift: number;
  is_ocupied: boolean;
}

interface TeamTask {
  id: number;
  team: number;
  task: number;
  task_id: number;
  task_status: string;
  begin?: string;
  end?: string;
}

function useOperations() {
  const [data, setData] = useState<GanttTask[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchOperations() {
      try {
        console.log('=== INICIANDO BUSCA DE OPERAÇÕES ===');
        console.log('URL da API:', 'http://localhost:8000/api/v1/operations/?finalized=False');
        
        const response = await api.get<RawOperation[]>(
          'http://localhost:8000/api/v1/operations/?finalized=False',
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        console.log('=== RESPOSTA DA API ===');
        console.log('Status da resposta:', response.status);
        console.log('Total de operações retornadas:', response.data.length);
        console.log('Operações recebidas:', response.data);
        
        // Verificar cada operação individualmente
        response.data.forEach((operation, index) => {
          console.log(`Operação ${index + 1}:`, {
            id: operation.id,
            name: operation.name,
            finalized: operation.finalized,
            tasks_count: operation.tasks ? operation.tasks.length : 0,
            tasks_ids: operation.tasks, // IDs das tarefas
            equipments_count: operation.equipments ? operation.equipments.length : 0
          });
        });

        // Filtrar apenas operações não finalizadas
        const openOperations = response.data.filter(op => !op.finalized);
        console.log('=== OPERAÇÕES EM ABERTO ===');
        console.log('Total de operações em aberto:', openOperations.length);
        console.log('IDs das operações em aberto:', openOperations.map(op => op.id));

        if (openOperations.length === 0) {
          console.log('❌ Nenhuma operação em aberto encontrada!');
          setData([]);
          return;
        }

        // Buscar detalhes de cada tarefa para obter os tempos individuais
        const formatted: GanttTask[] = [];
        
        for (const operation of openOperations) {
          console.log(`\n=== PROCESSANDO OPERAÇÃO: ${operation.name} (ID: ${operation.id}) ===`);
          console.log(`IDs das tarefas da operação:`, operation.tasks);
          
          if (!operation.tasks || operation.tasks.length === 0) {
            console.log(`⚠️ Operação ${operation.id} não tem tarefas associadas`);
            continue;
          }
          
          for (const taskId of operation.tasks) {
            try {
              console.log(`\n--- Processando tarefa ID: ${taskId} ---`);
              
              // Buscar detalhes da tarefa individual
              const taskResponse = await api.get<TaskDetail>(
                `http://localhost:8000/api/v1/tasks/${taskId}/`,
                {
                  headers: {
                    Authorization: `Bearer ${access}`,
                  },
                }
              );

              const taskDetail = taskResponse.data;
              console.log(`Detalhes da tarefa ${taskId}:`, taskDetail);
              
              // Buscar associações team_task para esta tarefa
              let teamName = "Sem equipe";
              let begin = taskDetail.created_at;
              let end = taskDetail.finished_at || operation.end;
              
              try {
                console.log(`Buscando team_task para tarefa ${taskId}...`);
                const teamTaskResponse = await api.get<TeamTask[]>(
                  `http://localhost:8000/api/v1/team_task/?task=${taskId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${access}`,
                    },
                  }
                );

                console.log(`TeamTasks encontrados para tarefa ${taskId}:`, teamTaskResponse.data);

                if (teamTaskResponse.data && teamTaskResponse.data.length > 0) {
                  // Usar o primeiro team_task encontrado (assumindo uma equipe por tarefa)
                  const teamTask = teamTaskResponse.data[0];
                  
                  // Buscar informações da equipe
                  try {
                    console.log(`Buscando informações da equipe ${teamTask.team}...`);
                    const teamResponse = await api.get<TeamInfo>(
                      `http://localhost:8000/api/v1/teams/${teamTask.team}/`,
                      {
                        headers: {
                          Authorization: `Bearer ${access}`,
                        },
                      }
                    );
                    teamName = teamResponse.data.name;
                    console.log(`✅ Equipe encontrada para tarefa ${taskId}: ${teamName}`);
                    
                    // Se o team_task tem begin e end, usar esses tempos
                    if (teamTask.begin && teamTask.end) {
                      begin = teamTask.begin;
                      end = teamTask.end;
                      console.log(`✅ Usando tempos do team_task: ${begin} até ${end}`);
                    }
                  } catch (teamError) {
                    console.error(`❌ Erro ao buscar equipe ${teamTask.team}:`, teamError);
                    teamName = `Equipe #${teamTask.team}`;
                  }
                } else {
                  console.log(`⚠️ Nenhum team_task encontrado para tarefa ${taskId}`);
                }
              } catch (teamTaskError) {
                console.error(`❌ Erro ao buscar team_task para tarefa ${taskId}:`, teamTaskError);
              }

              const formattedTask: GanttTask = {
                operation: operation.name || `Operação #${operation.id}`,
                task: `Tarefa #${taskId}`,
                equipments: operation.equipments.length > 0
                  ? operation.equipments.map(e => e.name)
                  : ["Sem equipamento"],
                team: teamName,
                begin: begin,
                end: end,
              };

              console.log(`✅ Tarefa formatada:`, formattedTask);
              formatted.push(formattedTask);
              
            } catch (taskError) {
              console.error(`❌ Erro ao buscar detalhes da tarefa ${taskId}:`, taskError);
              
              // Fallback: usar tempos da operação se não conseguir buscar detalhes da tarefa
              const fallbackTask: GanttTask = {
                operation: operation.name || `Operação #${operation.id}`,
                task: `Tarefa #${taskId}`,
                equipments: operation.equipments.length > 0
                  ? operation.equipments.map(e => e.name)
                  : ["Sem equipamento"],
                team: "Sem equipe",
                begin: operation.begin,
                end: operation.end,
              };
              
              console.log(`⚠️ Tarefa fallback:`, fallbackTask);
              formatted.push(fallbackTask);
            }
          }
        }

        console.log('\n=== DADOS FINALIZADOS ===');
        console.log('Total de tarefas formatadas:', formatted.length);
        console.log('Dados finais:', formatted);

        setData(formatted);
      } catch (error) {
        console.error('❌ Erro ao buscar operações:', error);
      }
    }

    if (access) {
      fetchOperations();
    }
  }, [access]);

  return data;
}

export default useOperations;