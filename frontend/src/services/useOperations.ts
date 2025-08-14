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
  task: number; // ID da tarefa (não task_id)
  begin: string;
  end: string;
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

        // Coletar todos os IDs de tarefas das operações em aberto
        const allTaskIds = openOperations.flatMap(op => op.tasks);
        console.log('=== TODAS AS TAREFAS DAS OPERAÇÕES ===');
        console.log('IDs das tarefas:', allTaskIds);

        // Buscar TODOS os team_tasks de uma vez
        console.log('=== BUSCANDO TEAM_TASKS ===');
        const allTeamTasks: TeamTask[] = [];
        
        for (const taskId of allTaskIds) {
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

            if (teamTaskResponse.data && teamTaskResponse.data.length > 0) {
              console.log(`✅ TeamTasks encontrados para tarefa ${taskId}:`, teamTaskResponse.data);
              allTeamTasks.push(...teamTaskResponse.data);
            } else {
              console.log(`⚠️ Nenhum team_task encontrado para tarefa ${taskId} - tarefa sem equipe associada`);
            }
          } catch (teamTaskError) {
            console.error(`❌ Erro ao buscar team_task para tarefa ${taskId}:`, teamTaskError);
          }
        }

        console.log('=== TODOS OS TEAM_TASKS COLETADOS ===');
        console.log('Total de team_tasks:', allTeamTasks.length);
        console.log('Team_tasks:', allTeamTasks);

        // Se não há team_tasks, não há dados para mostrar
        if (allTeamTasks.length === 0) {
          console.log('❌ Nenhum team_task encontrado - não há tarefas com equipes associadas');
          setData([]);
          return;
        }

        // Agrupar team_tasks por equipe
        const teamTasksByTeam: Record<number, TeamTask[]> = {};
        allTeamTasks.forEach(teamTask => {
          if (!teamTasksByTeam[teamTask.team]) {
            teamTasksByTeam[teamTask.team] = [];
          }
          teamTasksByTeam[teamTask.team].push(teamTask);
        });

        console.log('=== TEAM_TASKS AGRUPADOS POR EQUIPE ===');
        console.log('Equipes com team_tasks:', Object.keys(teamTasksByTeam));
        Object.entries(teamTasksByTeam).forEach(([teamId, tasks]) => {
          console.log(`Equipe ${teamId}: ${tasks.length} tarefas`);
        });

        // Buscar nomes das equipes
        const teamNames: Record<number, string> = {};
        const uniqueTeamIds = Object.keys(teamTasksByTeam).map(Number);
        
        for (const teamId of uniqueTeamIds) {
          try {
            console.log(`Buscando nome da equipe ${teamId}...`);
            const teamResponse = await api.get<TeamInfo>(
              `http://localhost:8000/api/v1/teams/${teamId}/`,
              {
                headers: {
                  Authorization: `Bearer ${access}`,
                },
              }
            );
            teamNames[teamId] = teamResponse.data.name;
            console.log(`✅ Equipe ${teamId}: ${teamResponse.data.name}`);
          } catch (teamError) {
            console.error(`❌ Erro ao buscar equipe ${teamId}:`, teamError);
            teamNames[teamId] = `Equipe #${teamId}`;
          }
        }

        // Criar dados formatados para o GanttChart
        const formatted: GanttTask[] = [];
        
        console.log('\n=== INICIANDO CRIAÇÃO DOS DADOS FORMATADOS ===');
        console.log('Total de equipes para processar:', Object.keys(teamTasksByTeam).length);
        console.log('Operações em aberto disponíveis:', openOperations.map(op => ({ id: op.id, name: op.name, tasks: op.tasks })));
        
        for (const [teamId, teamTasks] of Object.entries(teamTasksByTeam)) {
          const teamName = teamNames[Number(teamId)] || `Equipe #${teamId}`;
          
          console.log(`\n=== PROCESSANDO EQUIPE: ${teamName} (ID: ${teamId}) ===`);
          console.log(`Total de tarefas da equipe:`, teamTasks.length);
          console.log(`Tarefas da equipe:`, teamTasks);
          
          // Criar uma barra para cada tarefa da equipe
          for (const teamTask of teamTasks) {
            try {
              console.log(`\n--- Processando tarefa ${teamTask.task} da equipe ${teamName} ---`);
              console.log(`TeamTask completo:`, teamTask);
              console.log(`Begin: ${teamTask.begin}, End: ${teamTask.end}`);
              
              // Buscar detalhes da tarefa para obter informações adicionais
              let taskDetail = null;
              try {
                const taskResponse = await api.get<TaskDetail>(
                  `http://localhost:8000/api/v1/tasks/${teamTask.task}/`,
                  {
                    headers: {
                      Authorization: `Bearer ${access}`,
                    },
                  }
                );
                taskDetail = taskResponse.data;
                console.log(`✅ Detalhes da tarefa ${teamTask.task}:`, taskDetail);
              } catch (taskError) {
                console.error(`❌ Erro ao buscar detalhes da tarefa ${teamTask.task}:`, taskError);
              }
              
              // Encontrar a operação que contém esta tarefa
              const operation = openOperations.find(op => op.tasks.includes(teamTask.task));
              const operationName = operation ? operation.name : `Operação #${teamTask.task}`;
              
              console.log(`✅ Operação encontrada:`, operationName);
              console.log(`🔍 Procurando operação que contenha tarefa ${teamTask.task}`);
              console.log(`📋 IDs das tarefas nas operações:`, openOperations.map(op => ({ id: op.id, tasks: op.tasks })));
              
              // Usar os tempos do team_task (que são os corretos)
              const begin = teamTask.begin;
              const end = teamTask.end;
              
              console.log(`✅ Usando tempos do team_task: ${begin} até ${end}`);
              
              // Validar se os tempos são diferentes
              if (begin === end) {
                console.log(`⚠️ ATENÇÃO: Begin e End são iguais para tarefa ${teamTask.task}`);
              }
              
              const formattedTask: GanttTask = {
                operation: operationName,
                task: `Tarefa #${teamTask.task}`,
                equipments: operation && operation.equipments.length > 0
                  ? operation.equipments.map(e => e.name)
                  : ["Sem equipamento"],
                team: teamName,
                begin: begin,
                end: end,
              };

              console.log(`✅ Tarefa formatada criada:`, formattedTask);
              formatted.push(formattedTask);
              console.log(`✅ Tarefa adicionada ao array. Total atual: ${formatted.length}`);
              
            } catch (error) {
              console.error(`❌ Erro ao processar team_task ${teamTask.id}:`, error);
            }
          }
        }

        console.log('\n=== DADOS FINALIZADOS ===');
        console.log('Total de tarefas formatadas:', formatted.length);
        console.log('Estrutura dos dados:');
        formatted.forEach((task, index) => {
          console.log(`Tarefa ${index + 1}:`, {
            team: task.team,
            task: task.task,
            operation: task.operation,
            begin: task.begin,
            end: task.end,
            equipments: task.equipments
          });
        });
        console.log('Dados finais completos:', formatted);

        // VALIDAÇÃO FINAL DOS DADOS ANTES DE ENVIAR PARA O GANTTCHART
        console.log('\n=== VALIDAÇÃO FINAL DOS DADOS ===');
        console.log('🔍 Verificando estrutura dos dados...');
        
        let dadosValidos = 0;
        let dadosInvalidos = 0;
        let problemasEncontrados: string[] = [];
        
        formatted.forEach((task, index) => {
          console.log(`\n--- Validando Tarefa ${index + 1} ---`);
          console.log(`Equipe: "${task.team}"`);
          console.log(`Tarefa: "${task.task}"`);
          console.log(`Operação: "${task.operation}"`);
          console.log(`Begin: "${task.begin}"`);
          console.log(`End: "${task.end}"`);
          console.log(`Equipamentos: [${task.equipments.join(', ')}]`);
          
          // Validações
          let tarefaValida = true;
          
          if (!task.team || task.team.trim() === '' || task.team === 'Sem equipe') {
            console.log(`❌ PROBLEMA: Nome da equipe inválido: "${task.team}"`);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Nome da equipe inválido`);
          }
          
          if (!task.task || task.task.trim() === '') {
            console.log(`❌ PROBLEMA: Nome da tarefa inválido: "${task.task}"`);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Nome da tarefa inválido`);
          }
          
          if (!task.operation || task.operation.trim() === '') {
            console.log(`❌ PROBLEMA: Nome da operação inválido: "${task.operation}"`);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Nome da operação inválido`);
          }
          
          if (!task.begin || task.begin.trim() === '') {
            console.log(`❌ PROBLEMA: Tempo de início inválido: "${task.begin}"`);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Tempo de início inválido`);
          }
          
          if (!task.end || task.end.trim() === '') {
            console.log(`❌ PROBLEMA: Tempo de fim inválido: "${task.end}"`);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Tempo de fim inválido`);
          }
          
          if (task.begin === task.end) {
            console.log(`❌ PROBLEMA: Begin e End são iguais: "${task.begin}" = "${task.end}"`);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Begin e End iguais`);
          }
          
          // Verificar se os tempos são válidos
          try {
            const beginDate = new Date(task.begin);
            const endDate = new Date(task.end);
            
            if (isNaN(beginDate.getTime())) {
              console.log(`❌ PROBLEMA: Begin não é uma data válida: "${task.begin}"`);
              tarefaValida = false;
              problemasEncontrados.push(`Tarefa ${index + 1}: Begin não é data válida`);
            }
            
            if (isNaN(endDate.getTime())) {
              console.log(`❌ PROBLEMA: End não é uma data válida: "${task.end}"`);
              tarefaValida = false;
              problemasEncontrados.push(`Tarefa ${index + 1}: End não é data válida`);
            }
            
            if (beginDate >= endDate) {
              console.log(`❌ PROBLEMA: Begin >= End: ${beginDate.toISOString()} >= ${endDate.toISOString()}`);
              tarefaValida = false;
              problemasEncontrados.push(`Tarefa ${index + 1}: Begin >= End`);
            }
            
          } catch (error) {
            console.log(`❌ PROBLEMA: Erro ao processar datas:`, error);
            tarefaValida = false;
            problemasEncontrados.push(`Tarefa ${index + 1}: Erro ao processar datas`);
          }
          
          if (tarefaValida) {
            console.log(`✅ Tarefa ${index + 1} VÁLIDA`);
            dadosValidos++;
          } else {
            console.log(`❌ Tarefa ${index + 1} INVÁLIDA`);
            dadosInvalidos++;
          }
        });
        
        console.log('\n=== RESUMO DA VALIDAÇÃO ===');
        console.log(`✅ Dados válidos: ${dadosValidos}`);
        console.log(`❌ Dados inválidos: ${dadosInvalidos}`);
        console.log(`📊 Total: ${formatted.length}`);
        
        if (problemasEncontrados.length > 0) {
          console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
          problemasEncontrados.forEach(problema => console.log(`- ${problema}`));
        } else {
          console.log('\n🎉 NENHUM PROBLEMA ENCONTRADO!');
        }
        
        // Verificar se há equipes duplicadas
        const equipesUnicas = Array.from(new Set(formatted.map(t => t.team)));
        console.log('\n=== VERIFICAÇÃO DE EQUIPES ===');
        console.log(`Equipes únicas encontradas: ${equipesUnicas.length}`);
        console.log('Lista de equipes:', equipesUnicas);
        
        // Verificar se há tarefas duplicadas por equipe
        const tarefasPorEquipe: Record<string, string[]> = {};
        formatted.forEach(task => {
          if (!tarefasPorEquipe[task.team]) {
            tarefasPorEquipe[task.team] = [];
          }
          tarefasPorEquipe[task.team].push(task.task);
        });
        
        console.log('\n=== TAREFAS POR EQUIPE ===');
        Object.entries(tarefasPorEquipe).forEach(([equipe, tarefas]) => {
          console.log(`${equipe}: ${tarefas.length} tarefas - [${tarefas.join(', ')}]`);
        });

        console.log('\n=== DADOS ENVIADOS PARA O GANTTCHART ===');
        console.log('📤 setData() será chamado com:', formatted);
        console.log('📊 Resumo dos dados:');
        formatted.forEach((task, index) => {
          console.log(`Tarefa ${index + 1}:`, {
            team: task.team,
            task: task.task,
            operation: task.operation,
            begin: task.begin,
            end: task.end,
            equipments: task.equipments
          });
        });

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