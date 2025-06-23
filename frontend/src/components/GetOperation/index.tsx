import './styles.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface OperationDetail {
  id: number;
  name: string;
  begin: string;
  end: string;
  finalized: boolean;
}

interface GetOperationProps {
  operationId: number;
}

function GetOperation({ operationId }: GetOperationProps) {
  const [operation, setOperation] = useState<OperationDetail | null>(null);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchOperation() {
      try {
        const response = await api.get<OperationDetail>(`http://localhost:8000/api/v1/operations/${operationId}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setOperation(response.data);
      } catch (error) {
        console.error('Erro ao buscar operação:', error);
      }
    }

    if (access) {
      fetchOperation();
    }
  }, [access, operationId]);

  if (!operation) return <p>Carregando detalhes...</p>;

  return (
    <div className="get-operation-container">
      <h2 className="get-operation-title">Informações da Operação</h2>
      <p><strong>ID:</strong> {operation.id}</p>
      <p><strong>Nome:</strong> {operation.name}</p>
      <p><strong>Início:</strong> {new Date(operation.begin).toLocaleString()}</p>
      <p><strong>Fim:</strong> {new Date(operation.end).toLocaleString()}</p>
      <p><strong>Finalizada:</strong> {operation.finalized ? "Sim" : "Não"}</p>
    </div>
  );
}

export default GetOperation;