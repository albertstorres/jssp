import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Task {
  id: number;
  status: string;
  on_mount: boolean;
  team_info: {
    id: number;
    name: string;
    shift: number;
    is_ocupied: boolean;
  };
  created_at: string;
  finished_at: string | null;
  team: number;
  categorie: number;
}

interface GetTaskProps {
  onSelectTask?: (task: Task, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedTasks?: Task[];
  showAll?: boolean;
  reloadSignal?: number;
  filterStatus?: 'pending' | 'in_progress' | 'finished';
}

function GetTasks({
  onSelectTask,
  selectedTasks = [],
  showAll = false,
  reloadSignal,
  filterStatus,
}: GetTaskProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamNames, setTeamNames] = useState<Record<number, string>>({});
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTasks() {
      if (!access) return;
      
      try {
        console.log('🔄 Buscando tarefas...');
        console.log('🔍 showAll value:', showAll);
        console.log('🔍 filterStatus value:', filterStatus);
        
        // Buscar todas as tarefas primeiro
        const url = 'http://localhost:8000/api/v1/tasks/';
        console.log('📡 URL da API:', url);

        const response = await api.get<Task[]>(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        console.log('📊 Tarefas recebidas da API:', response.data);
        console.log('📊 Total de tarefas recebidas:', response.data.length);

        // Aplicar filtros baseado no contexto
        let filteredTasks = response.data;
        
        if (filterStatus) {
          // Filtro específico por status (para componentes que precisam de um status específico)
          console.log(`🔍 APLICANDO FILTRO POR STATUS: ${filterStatus}`);
          filteredTasks = response.data.filter(task => task.status === filterStatus);
          console.log(`✅ Tarefas com status ${filterStatus}:`, filteredTasks.length);
        } else if (!showAll) {
          // Filtro padrão: status=pending AND on_mount=false
          console.log('🔍 APLICANDO FILTRO PADRÃO: status=pending AND on_mount=false');
          console.log('🔍 Tarefas antes do filtro:', response.data.map(t => ({ 
            id: t.id, 
            status: t.status, 
            on_mount: t.on_mount 
          })));
          
          filteredTasks = response.data.filter(task => {
            // Tratar undefined como false (temporário até backend ser corrigido)
            const onMount = task.on_mount ?? false;
            const isAvailable = task.status === 'pending' && !onMount;
            console.log(`Tarefa ${task.id}: status=${task.status}, on_mount=${task.on_mount} (tratado como ${onMount}), isAvailable=${isAvailable}`);
            return isAvailable;
          });
          
          console.log('✅ Tarefas após filtro (status=pending AND on_mount=false):', 
            filteredTasks.map(t => ({ 
              id: t.id, 
              status: t.status, 
              on_mount: t.on_mount 
            })));
          console.log('✅ Total de tarefas disponíveis:', filteredTasks.length);
        } else {
          console.log('🔍 SEM FILTRO: showAll = true');
        }

        // Log detalhado de cada tarefa para debug
        console.log('🔍 Detalhes de cada tarefa:');
        response.data.forEach((task, index) => {
          const status = getTaskStatus(task);
          console.log(`  Tarefa ${index + 1}: ID=${task.id}, Status=${task.status}, on_mount=${task.on_mount}, StatusText=${status.statusText}`);
        });

        // Ordenar por ID
        const sortedTasks = filteredTasks.sort((a, b) => a.id - b.id);

        console.log('📋 Tarefas finais ordenadas:', sortedTasks);
        setTasks(sortedTasks);
      } catch (error) {
        console.error("❌ Erro ao buscar tarefas:", error);
        setTasks([]); // Limpar em caso de erro
      }
    }

    fetchTasks();
  }, [access, showAll, reloadSignal, filterStatus]);

  // Fallback: buscar nomes de equipes quando não vierem em team_info
  useEffect(() => {
    async function fetchMissingTeamNames() {
      if (!access) return;

      const missingIds = Array.from(
        new Set(
          tasks
            .filter(t => !!t.team && (!t.team_info?.name) && !(t.team in teamNames))
            .map(t => t.team)
        )
      );

      if (missingIds.length === 0) return;

      try {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            const response = await api.get<{ id: number; name: string }>(`http://localhost:8000/api/v1/teams/${id}/`, {
              headers: { Authorization: `Bearer ${access}` },
            });
            return response.data;
          })
        );

        setTeamNames(prev => {
          const updated = { ...prev };
          results.forEach(team => {
            if (team && team.id) updated[team.id] = team.name;
          });
          return updated;
        });
      } catch (error) {
        console.error('Erro ao buscar nomes de equipes:', error);
      }
    }

    fetchMissingTeamNames();
  }, [tasks, access, teamNames]);

  const isSelected = (task: Task) =>
    selectedTasks.some((selected) => selected.id === task.id);

  // Função auxiliar para mapear o status da tarefa
  const getTaskStatus = (task: Task) => {
    // Tratar undefined como false (temporário até backend ser corrigido)
    const onMount = task.on_mount ?? false;
    const isAvailable = task.status === 'pending' && !onMount;
    let statusText = task.status;
    let statusClass = task.status;
    
    if (onMount) {
      statusClass = 'mounting';
    }
    
    return {
      status: task.status,
      isOnMount: onMount,
      isAvailable: isAvailable,
      statusText: statusText,
      statusClass: statusClass
    };
  };

  return (
    <div className="get-tasks-container">
      <div className="get-tasks">
        <h2 className="get-tasks-title">
          {filterStatus === "in_progress"
            ? "Selecione as Tarefas em Andamento:"
            : showAll
            ? "Lista de Todas as Tarefas"
            : "Selecione as Tarefas Pendentes:"}
        </h2>

        <ul className="task-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={(event) => onSelectTask && onSelectTask(task, event)}
              className={`task-item ${isSelected(task) ? "selected" : ""}`}
              style={{ cursor: onSelectTask ? "pointer" : "default" }}
            >
              <div className="task-item-content">
                <div className="task-info-line">
                  <span className="task-info-label">Tarefa:</span>
                  <span className="task-value">{`#${task.id}`}</span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Equipe:</span>
                  <span className="task-value">{task.team_info?.name || (task.team ? teamNames[task.team] : undefined) || "Sem equipe"}</span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Status:</span>
                  <span className={`task-value status-${getTaskStatus(task).statusClass}`}>
                    {getTaskStatus(task).statusText}
                  </span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Criada em:</span>
                  <span className="task-value">
                    {new Date(task.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {tasks.length > 0 && (
          <div className="tasks-summary">
            <span className="tasks-count">
              {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} {showAll ? 'encontrada' : (filterStatus === 'in_progress' ? 'em andamento' : 'pendente')}{tasks.length !== 1 ? 's' : ''}
            </span>
            <div className="tasks-legend">
              <div className="legend-item">
                <div className="legend-color legend-available"></div>
                <span>Disponível</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-selected"></div>
                <span>Selecionada</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GetTasks;