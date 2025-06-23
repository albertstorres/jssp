import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuWorkers() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Menu de Trabalhadores</h1>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/createWorker/')}>Cadastrar Trabalhador</button>
          <button className="bottom-button" onClick={() => navigate('/listWorkers/')}>Listar Trabalhadores</button>
          <button className="bottom-button">Editar Trabalhador</button>
          <button className="bottom-button">Remover Trabalhador</button>
        </div>
      </div>
    </>
  );
}

export default MenuWorkers;