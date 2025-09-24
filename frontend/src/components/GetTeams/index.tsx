import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Team {
  id: number;
  name: string;
  shift: number;
  is_ocupied: boolean;
  on_mount: boolean;
}

interface GetTeamProps {
  onSelectTeam?: (team: Team, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedTeams?: Team[];
  showAll?: boolean;
  reloadSignal?: number; // Prop para recarregar equipes externamente
}

function GetTeams({
  onSelectTeam,
  selectedTeams = [],
  showAll = false,
  reloadSignal,
}: GetTeamProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTeams() {
      if (!access) return;
      
      setLoading(true);
      try {
        console.log('🔄 Buscando equipes...');
        console.log('🔍 showAll value:', showAll);
        
        // Restaurar lógica original do showAll
        const url = showAll
          ? 'http://localhost:8000/api/v1/teams/'
          : 'http://localhost:8000/api/v1/teams/?is_ocupied=false';

        console.log('📡 URL da API:', url);

        const response = await api.get<Team[]>(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        console.log('📊 Equipes recebidas da API:', response.data);
        console.log('📊 Total de equipes recebidas:', response.data.length);

        // Aplicar filtro apenas quando showAll = false
        let filteredTeams = response.data;
        if (!showAll) {
          console.log('🔍 APLICANDO FILTRO: showAll = false');
          console.log('🔍 Equipes antes do filtro:', response.data.map(t => ({ 
            id: t.id, 
            name: t.name, 
            is_ocupied: t.is_ocupied, 
            on_mount: t.on_mount 
          })));
          
          // Filtro combinado: is_ocupied = false AND on_mount = false
          filteredTeams = response.data.filter(team => {
            const status = getTeamStatus(team);
            console.log(`Equipe ${team.name}: is_ocupied=${team.is_ocupied}, on_mount=${team.on_mount} (tratado como ${status.isOnMount}), isAvailable=${status.isAvailable}`);
            return status.isAvailable;
          });
          
          console.log('✅ Equipes após filtro (is_ocupied=false AND on_mount=false):', 
            filteredTeams.map(t => ({ 
              id: t.id, 
              name: t.name, 
              is_ocupied: t.is_ocupied, 
              on_mount: t.on_mount 
            })));
          console.log('✅ Total de equipes disponíveis:', filteredTeams.length);
        } else {
          console.log('🔍 SEM FILTRO: showAll = true');
        }

        // Log detalhado de cada equipe para debug
        console.log('🔍 Detalhes de cada equipe:');
        response.data.forEach((team, index) => {
          const status = getTeamStatus(team);
          console.log(`  Equipe ${index + 1}: ID=${team.id}, Nome=${team.name}, is_ocupied=${team.is_ocupied}, on_mount=${team.on_mount}, Status=${status.statusText}`);
        });

        // Ordenar por nome
        const sortedTeams = filteredTeams.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        console.log('📋 Equipes finais ordenadas:', sortedTeams);
        setTeams(sortedTeams);
      } catch (error) {
        console.error("❌ Erro ao buscar equipes:", error);
        setTeams([]); // Limpar em caso de erro
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [access, showAll, reloadSignal]); // Atualiza quando reloadSignal muda

  const isSelected = (team: Team) =>
    selectedTeams.some((selected) => selected.id === team.id);

  // Função auxiliar para mapear o status da equipe
  const getTeamStatus = (team: Team) => {
    // Tratar undefined como false (temporário até backend ser corrigido)
    const onMount = team.on_mount ?? false;
    const isAvailable = !team.is_ocupied && !onMount;
    let statusText = "Disponível";
    let statusClass = 'available';
    
    if (team.is_ocupied) {
      statusText = "Ocupada";
      statusClass = 'occupied';
    } else if (onMount) {
      statusText = "Em montagem";
      statusClass = 'mounting';
    }
    
    return {
      isOcupied: team.is_ocupied,
      isOnMount: onMount,
      isAvailable: isAvailable,
      statusText: statusText,
      statusClass: statusClass
    };
  };

  return (
    <div className="get-teams-container">
      <div className="get-teams">
        <div className="get-teams-header">
          <h2 className="get-teams-title">
            {showAll ? "Lista de Todas as Equipes" : "Selecione as equipes disponíveis:"}
          </h2>
        </div>

        {loading && (
          <div className="loading-message">
            Carregando equipes...
          </div>
        )}

        {!loading && teams.length === 0 && (
          <div className="no-teams-message">
            {showAll ? "Nenhuma equipe encontrada." : "Nenhuma equipe disponível no momento."}
          </div>
        )}

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
                  <span className="team-info-label">Status:</span>
                  <span className={`team-value status-${getTeamStatus(team).statusClass}`}>
                    {getTeamStatus(team).statusText}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {teams.length > 0 && (
          <div className="teams-summary">
            <span className="teams-count">
              {teams.length} equipe{teams.length !== 1 ? 's' : ''} {showAll ? 'encontrada' : 'disponível'}{teams.length !== 1 ? 's' : ''}
            </span>
            <div className="teams-legend">
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

export default GetTeams;