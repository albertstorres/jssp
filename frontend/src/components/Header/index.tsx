import './styles.css'
import Logo from '../../assets/Logo/Logo.svg'
import { useNavigate } from 'react-router-dom';
import UserName from '../UserName';

function Header() {
    const navigate = useNavigate();

    return(
        <header className='header'>
            <img 
                src={Logo} 
                alt='logo'
                className='logo'
                onClick={() => navigate('/main')}
                style={{ cursor: 'pointer' }}
            />
            <div className='board'>

            </div>
            <UserName />
        </header>
    );
}


export default Header;