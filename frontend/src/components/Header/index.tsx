import './styles.css'
import Logo from '../../assets/Logo/Logo.svg'
import UserName from '../UserName';

function Header() {
    const name = 'Albert'

    return(
        <header className='header'>
            <img src={Logo} alt='logo'className='logo'></img>
            <div className='board'>

            </div>
            <UserName name={name} />
        </header>
    );
}


export default Header;