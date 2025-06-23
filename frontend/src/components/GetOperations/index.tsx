import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Operation {
  id: number;
  name: string;
  begin: string;
  end: string;
  finalized: boolean;
}

interface GetOperationProps {
  onSelectOperation?: (operation: Operation, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedOperations?: Operation[];
  showAll?: boolean;
}

function GetOperations({ onSelectOperation, selectedOperations = [], showAll = false }: GetOperationProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchOperations() {
      try {
        const url = showAll
          ? 'http://localhost:8000/api/v1/operations/'
          : 'http://localhost:8000/api/v1/operations/?finalized=False';

        const response = await api.get<Operation[]>(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        setOperations(response.data);
      } catch (error) {
        console.error("Erro ao buscar operações:", error);
      }
    }

    if (access) {
      fetchOperations();
    }
  }, [access, showAll]);

  const isSelected = (operation: Operation) =>
    selectedOperations.some((selected) => selected.id === operation.id);

  return (
    <div className="get-operations-container">
      <div className="get-operations">
        <h2 className="get-operations-title">
          {showAll ? "Lista de Todas as Operações" : "Operações Abertas:"}
        </h2>

        <ul className="operation-list">
          {operations.map((operation) => (
            <li
              key={operation.id}
              onClick={(event) => onSelectOperation && onSelectOperation(operation, event)}
              className={`operation-item ${isSelected(operation) ? "selected" : ""}`}
              style={{ cursor: onSelectOperation ? "pointer" : "default" }}
            >
              <div><strong>{operation.name}</strong></div>
              <div>Início: {new Date(operation.begin).toLocaleString()}</div>
              <div>Fim: {new Date(operation.end).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GetOperations;