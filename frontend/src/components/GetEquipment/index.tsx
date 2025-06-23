import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface EquipmentDetail {
  id: number;
  name: string;
  is_ocupied: boolean;
}

interface GetEquipmentProps {
  equipmentId: number;
}

function GetEquipment({ equipmentId }: GetEquipmentProps) {
  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await api.get<EquipmentDetail>(`/api/v1/equipments/${equipmentId}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setEquipment(response.data);
      } catch (err) {
        setError('Erro ao buscar detalhes do equipamento.');
      }
    }

    if (access && equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId, access]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!equipment) {
    return <div className="empty-message">Carregando informações do equipamento...</div>;
  }

  return (
    <div className="get-equipment-container">
      <h2>Detalhes do Equipamento</h2>
      <ul>
        <li><strong>ID:</strong> {equipment.id}</li>
        <li><strong>Nome:</strong> {equipment.name}</li>
        <li><strong>Ocupado:</strong> {equipment.is_ocupied ? 'Sim' : 'Não'}</li>
      </ul>
    </div>
  );
}

export default GetEquipment;