import './styles.css';
import Header from '../../components/Header';
import GanttChart from '../../components/GanttChart';
import { useNavigate } from 'react-router-dom';

function Main() {
  const navigate = useNavigate();
  const mockData = [
    {
      operation: 'Operação 1',
      task: 'Tarefa A',
      equipment: 'Escavadeira',
      team: 'Equipe A',
      begin: '2025-06-10T08:00:00',
      end: '2025-06-10T10:00:00'
    },
    {
      operation: 'Operação 1',
      task: 'Tarefa B',
      equipment: 'Caminhão',
      team: 'Equipe B',
      begin: '2025-06-10T10:00:00',
      end: '2025-06-10T12:00:00'
    },
    {
      operation: 'Operação 2',
      task: 'Tarefa C',
      equipment: 'Trator',
      team: 'Equipe C',
      begin: '2025-06-10T09:00:00',
      end: '2025-06-10T11:00:00'
    }
  ];

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Personalização de Ordens de serviço</h1>
        </div>
        <div className="boxes-container">
          <div className="box">
            <div className='button-group'>
              <button className='btn-red'>Menu Categorias</button>
              <button className='btn-light-blue'>Menu Equipamentos</button>
              <button className='btn-blue' onClick={() => navigate('/menuTeams/')}>Menu Equipes</button>
              <button className='btn-yellow'>Menu Trabalhadores</button>
            </div>
          </div>
          <div className="box right-box">
            <div className="box-header">
              <span className="title-left">Alocação de campo</span>
              <div className="dropdown-mock">zona oeste ▾</div>
            </div>
            <GanttChart data={mockData} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;