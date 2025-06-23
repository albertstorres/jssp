import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetTeams, { Team } from '../../components/GetTeams';
import GetTeam from '../../components/GetTeam';
import SetWorker from '../../components/SetWorker';

function CreateWorker() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleTeamSelect(team: Team, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedTeam(team);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleConfirmSelection() {
    setPopoverPosition(null);  // Só fecha o popover, mantém o selectedTeam
  }

  return (
    <>
      <Header />
      <div className="container-create-worker">
        <div className="create-worker">
          <h1 className="create-worker-title">Cadastro de trabalhador</h1>

          {/* Lista de equipes */}
          <GetTeams
            onSelectTeam={handleTeamSelect}
            selectedTeams={selectedTeam ? [selectedTeam] : []}
            showAll={true}
          />

          {/* Popover flutuante */}
          {selectedTeam && popoverPosition && (
            <div
              className="get-team-popover"
              style={{
                position: 'absolute',
                top: popoverPosition.y + 10,
                left: popoverPosition.x + 10,
                zIndex: 9999,
                backgroundColor: '#fff',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <button
                onClick={handleConfirmSelection}
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Selecionar
              </button>

              <GetTeam teamId={selectedTeam.id} />
            </div>
          )}

          {/* Cadastro do trabalhador */}
          <SetWorker selectedTeam={selectedTeam} />
        </div>
      </div>
    </>
  );
}

export default CreateWorker;