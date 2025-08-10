import './styles.css';
import Header from '../../components/Header';
import GanttChart from '../../components/GanttChart';
import { useNavigate } from 'react-router-dom';
import useOperations from '../../services/useOperations';
import { ReactComponent as IconTeam } from '../../assets/Icon/IconTeam.svg';
import { ReactComponent as IconEquipment } from '../../assets/Icon/IconEquipment.svg';
import { ReactComponent as IconTask } from '../../assets/Icon/IconTask.svg';
import { ReactComponent as IconOperation } from '../../assets/Icon/IconOperation.svg';
import { ReactComponent as IconWorker } from '../../assets/Icon/IconWorker.svg';
import { ReactComponent as IconCategory } from '../../assets/Icon/IconCategory.svg';

function Main() {
  const navigate = useNavigate();
  const operations = useOperations();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Personalização de Ordens de serviço</h1>
        </div>

        {/* NOVO CONTAINER LAYOUT */}
        <div className="main-content">
          <div className="left-box">
            
          </div>

          <div className="right-box">
            <div className="box-header">
              <span className="title-left">Alocação de campo</span>
            </div>

            {operations.length > 0 ? (
              <GanttChart data={operations} />
            ) : (
              <p>Carregando operações...</p>
            )}
          </div>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/menuTeams/')}>
            <span className="bottom-button-icon">
              <IconTeam />
            </span>
            <span className="bottom-button-text">Menu Equipes</span>
          </button>

          <button className="bottom-button" onClick={() => navigate('/menuEquipments/')}>
            <span className="bottom-button-icon">
              <IconEquipment />
            </span>
            <span className="bottom-button-text">Menu Equipamentos</span>
          </button>

          <button className="bottom-button" onClick={() => navigate('/menuTasks/')}>
            <span className="bottom-button-icon">
              <IconTask />
            </span>
            <span className="bottom-button-text">Menu Tarefas</span>
          </button>

          <button className="bottom-button" onClick={() => navigate('/menuOperations/')}>
            <span className="bottom-button-icon">
              <IconOperation />
            </span>
            <span className="bottom-button-text">Menu Operações</span>
          </button>

          <button className="bottom-button" onClick={() => navigate('/menuWorkers/')}>
            <span className="bottom-button-icon">
              <IconWorker />
            </span>
            <span className="bottom-button-text">Menu Trabalhadores</span>
          </button>

          <button className="bottom-button" onClick={() => navigate('/menuCategories/')}>
            <span className="bottom-button-icon">
              <IconCategory />
            </span>
            <span className="bottom-button-text">Menu Categorias</span>
          </button>

        </div>
      </div>
    </>
  );
}

export default Main