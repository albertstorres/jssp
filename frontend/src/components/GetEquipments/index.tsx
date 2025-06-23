import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Equipment {
  id: number;
  name: string;
  timespan: number;
  is_ocupied: boolean;
}

interface GetEquipmentProps {
  onSelectEquipment?: (equipment: Equipment, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedEquipments?: Equipment[];
  showAll?: boolean;
}

function GetEquipments({ onSelectEquipment, selectedEquipments = [], showAll = false }: GetEquipmentProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchEquipments() {
      try {
        const url = showAll
          ? 'http://localhost:8000/api/v1/equipments/'
          : 'http://localhost:8000/api/v1/equipments/?is_ocupied=false';

        const response = await api.get<Equipment[]>(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        setEquipments(response.data);
      } catch (error) {
        console.error("Erro ao buscar equipamentos:", error);
      }
    }

    if (access) {
      fetchEquipments();
    }
  }, [access, showAll]);

  const isSelected = (equipment: Equipment) =>
    selectedEquipments.some((selected) => selected.id === equipment.id);

  return (
    <div className="get-equipments-container">
      <div className="get-equipments">
        <h2 className="get-equipments-title">
          {showAll ? "Lista de Todos os Equipamentos" : "Selecione os equipamentos disponíveis:"}
        </h2>

        <ul className="equipment-list">
          {equipments.map((equipment) => (
            <li
              key={equipment.id}
              onClick={(event) => onSelectEquipment && onSelectEquipment(equipment, event)}
              className={`equipment-item ${isSelected(equipment) ? "selected" : ""}`}
              style={{ cursor: onSelectEquipment ? "pointer" : "default" }}
            >
              <div className="equipment-item-content">
                <div className="equipment-info-line">
                  <span className="equipment-info-label">Equipamento:</span>
                  <span className="equipment-value">{equipment.name}</span>
                </div>
                <div className="equipment-info-line">
                  <span className="equipment-info-label">Tempo (min):</span>
                  <span className="equipment-value">{equipment.timespan}</span>
                </div>
                <div className="equipment-info-line">
                  <span className="equipment-info-label">Ocupado:</span>
                  <span className="equipment-value">{equipment.is_ocupied ? "Sim" : "Não"}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GetEquipments;