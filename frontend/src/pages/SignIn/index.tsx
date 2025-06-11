import './styles.css';
import Logo from '../../assets/Logo/Logo.svg';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
//import { error } from 'console';
import useAuth from '../../hooks/useAuth';

function SignIn(){
    const navigate = useNavigate();
    const { handleGetToken, handleAddToken } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    interface AuthResponse {
        access: string;
        refresh: string;
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        try {
            if(!username || !password) {
                throw new Error ('Username ou Senha obrigatórios');
            }
            const response = await api.post<AuthResponse>('/api/v1/authentication/token/', {
                username,
                password
            });

            const  { access } = response.data;
            handleAddToken(access);
            console.log('Token salvo:', localStorage.getItem('access'));
            navigate('/main');

        }catch (error) {
            console.log(error);
        }
    }

    //useEffect(() => {
    //    const access = handleGetToken();
    //    if(access){
    //        navigate('/main');
    //        return
    //    }
    //}, []);

    return(
        <>
        <div className='container'>
            <div className='container-sign-in'>
                <div className='sign-in'>
                <img src={Logo} alt='logo'/>
                <form onSubmit={handleSubmit}>
                    <input className='input' type='text' placeholder='Digite aqui seu username' value={username} onChange={(e) => setUsername(e.target.value)} required/>
                    <input className='input' type='password' placeholder='Digite aqui sua senha' value={password} onChange={(e) => setPassword(e.target.value)} required/>
                    <span>Esqueceu sua senha?</span>
                    <button className='btn-green'>ENTRAR</button>
                </form>
            </div>
            </div>
        </div>
        </>
    );
}


export default SignIn;