import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Team {
  id: number;
  name: string;
  shift: number;
  is_ocupied: boolean;
}

interface GetTeamProps {
  onSelectTeam: (team: Team) => void;
  selectedTeams: Team[];
}

function GetTeams({ onSelectTeam, selectedTeams }: GetTeamProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await api.get<Team[]>('http://localhost:8000/api/v1/teams/', {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setTeams(response.data);
      } catch (error) {
        console.error("Erro ao buscar teams:", error);
      }
    }

    if (access) {
      fetchTeams();
    }
  }, [access]);

  const isSelected = (team: Team) =>
    selectedTeams.some((selected) => selected.id === team.id);

  return (
    <div className="get-teams-container">
      <h2 className="get-teams-title">Selecione as equipes dispoiníveis:</h2>
      <ul className="team-list">
        {teams.map((team) => (
          <li
            key={team.id}
            onClick={() => onSelectTeam(team)}
            className={`team-item ${isSelected(team) ? "selected" : ""}`}
          >
            <strong>{`Equipe: ${team.name}`}</strong>

          </li>
        ))}
      </ul>
    </div>
  );
}

export default GetTeams;