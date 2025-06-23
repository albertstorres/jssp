import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetTeams, { Team } from '../../components/GetTeams';
import GetTeam from '../../components/GetTeam';

function ListTeams() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleTeamSelect(team: Team, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedTeam(team);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleClosePopover() {
    setSelectedTeam(null);
    setPopoverPosition(null);
  }

  return (
    <>
      <Header />
      <div className="list-teams-container">
        <div className="main-title">
          <h1>Lista de Equipes</h1>
        </div>

        <GetTeams
          onSelectTeam={handleTeamSelect}
          selectedTeams={selectedTeam ? [selectedTeam] : []}
          showAll={true}
        />

        {selectedTeam && popoverPosition && (
          <div
            className="get-team-popover"
            style={{
              position: 'absolute',
              top: popoverPosition.y + 10,
              left: popoverPosition.x + 10,
              zIndex: 9999,
            }}
          >
            <button
              onClick={handleClosePopover}
              style={{
                float: 'right',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999',
              }}
            >
              ✖
            </button>
            <GetTeam teamId={selectedTeam.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default ListTeams;