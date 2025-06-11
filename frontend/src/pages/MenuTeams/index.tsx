import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuTeams(){
    const navigate = useNavigate();
    
    return(
        <>
            <Header />
            <div className='container-menu-create-team'>
                <div className='menu-create-team'>
                    <h1 className='menu-team-title'>Menu de equipes</h1>
                    <button className='btn-green' onClick={() => navigate('/createTeam/')}>CADASTRAR EQUIPE</button>
                    <button className='btn-blue'>LISTAR EQUIPES</button>
                </div>
            </div>
        </>
    );
}


export default MenuTeams;