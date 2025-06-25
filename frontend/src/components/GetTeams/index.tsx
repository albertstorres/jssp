import './styles.css';
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
  onSelectTeam?: (team: Team, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedTeams?: Team[];
  showAll?: boolean;
  reloadSignal?: number; // <- Novo prop para recarregar equipes externamente
}

function GetTeams({
  onSelectTeam,
  selectedTeams = [],
  showAll = false,
  reloadSignal,
}: GetTeamProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTeams() {
      try {
        const url = showAll
          ? 'http://localhost:8000/api/v1/teams/'
          : 'http://localhost:8000/api/v1/teams/?is_ocupied=false';

        const response = await api.get<Team[]>(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        const sortedTeams = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setTeams(sortedTeams);
      } catch (error) {
        console.error("Erro ao buscar equipes:", error);
      }
    }

    if (access) {
      fetchTeams();
    }
  }, [access, showAll, reloadSignal]); // <- Atualiza quando reloadSignal muda

  const isSelected = (team: Team) =>
    selectedTeams.some((selected) => selected.id === team.id);

  return (
    <div className="get-teams-container">
      <div className="get-teams">
        <h2 className="get-teams-title">
          {showAll ? "Lista de Todas as Equipes" : "Selecione as equipes disponíveis:"}
        </h2>

        <ul className="team-list">
          {teams.map((team) => (
            <li
              key={team.id}
              onClick={(event) => onSelectTeam && onSelectTeam(team, event)}
              className={`team-item ${isSelected(team) ? "selected" : ""}`}
              style={{ cursor: onSelectTeam ? "pointer" : "default" }}
            >
              <div className="team-item-content">
                <div className="team-info-line">
                  <span className="team-info-label">Equipe:</span>
                  <span className="team-value">{team.name}</span>
                </div>
                <div className="team-info-line">
                  <span className="team-info-label">Turno:</span>
                  <span className="team-value">{team.shift}</span>
                </div>
                <div className="team-info-line">
                  <span className="team-info-label">Ocupado:</span>
                  <span className="team-value">{team.is_ocupied ? "Sim" : "Não"}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GetTeams;