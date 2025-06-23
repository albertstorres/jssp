import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

interface OperationRow {
  operation: string;
  task: string;
  equipment: string;
  team: string;
  begin: string;
  end: string;
}

interface RawOperation {
  id: number;
  name: string;
  begin: string;
  end: string;
  finalized: boolean;
  tasks: {
    id: number;
    team_info?: {
      id: number;
      name: string;
    };
    equipment_info?: {
      id: number;
      name: string;
    };
  }[];
}

function GetOperations() {
  const [data, setData] = useState<OperationRow[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchOperations() {
      try {
        const response = await api.get<RawOperation[]>(
          'http://localhost:8000/api/v1/operations/?finalized=False',
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        const formatted: OperationRow[] = response.data.flatMap((operation) =>
          operation.tasks.map((task) => ({
            operation: operation.name || `Operação #${operation.id}`,
            task: `Tarefa #${task.id}`,
            equipment: task.equipment_info?.name || "Sem equipamento",
            team: task.team_info?.name || "Sem equipe",
            begin: operation.begin,
            end: operation.end,
          }))
        );

        setData(formatted);

      } catch (error) {
        console.error('Erro ao buscar operações:', error);
      }
    }

    if (access) {
      fetchOperations();
    }
  }, [access]);
  
  return data;
}

export default GetOperations;