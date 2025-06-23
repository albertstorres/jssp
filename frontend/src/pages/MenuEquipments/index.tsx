import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuEquipments() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Menu de Equipamentos</h1>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/createEquipment/')}>Cadastrar Equipamento</button>
          <button className="bottom-button" onClick={() => navigate('/listEquipments/')}>Listar Equipamentos</button>
          <button className="bottom-button">Editar Equipamento</button>
          <button className="bottom-button">Remover Equipamento</button>
        </div>
      </div>
    </>
  );
}

export default MenuEquipments;