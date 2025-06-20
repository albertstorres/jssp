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
  onSelectEquipment: (equipment: Equipment) => void;
  selectedEquipments: Equipment[];
}

function GetEquipments({ onSelectEquipment, selectedEquipments }: GetEquipmentProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchEquipments() {
      try {
        const response = await api.get<Equipment[]>('http://localhost:8000/api/v1/equipments/?is_ocupied=false', {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setEquipments(response.data);
      } catch (error) {
        console.error("Erro ao buscar equipments:", error);
      }
    }

    if (access) {
      fetchEquipments();
    }
  }, [access]);

  const isSelected = (equipment: Equipment) =>
    selectedEquipments.some((selected) => selected.id === equipment.id);

  return (
    <div className="get-equipments-container">
      <h2 className="get-equipments-title">Selecione os equipamentos:</h2>
      <ul className="equipment-list">
        {equipments.map((equipment) => (
          <li
            key={equipment.name}
            onClick={() => onSelectEquipment(equipment)}
            className={`equipment-item ${isSelected(equipment) ? "selected" : ""}`}
          >
            <strong>{`Equipamento: ${equipment.name}`}</strong>

          </li>
        ))}
      </ul>
    </div>
  );
}

export default GetEquipments;