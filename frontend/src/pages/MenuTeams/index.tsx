import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuTeams() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Menu de Equipes</h1>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/createTeam/')}>Cadastrar Equipe</button>
          <button className="bottom-button" onClick={() => navigate('/listTeams/')}>Listar Equipes</button>
          <button className="bottom-button">Editar Equipe</button>
          <button className="bottom-button">Remover Equipe</button>
        </div>
      </div>
    </>
  );
}

export default MenuTeams;