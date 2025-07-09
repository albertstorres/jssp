import './styles.css';
import Logo from '../../assets/Logo/Logo.svg';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import useAuth from '../../hooks/useAuth';

function SignIn() {
  const navigate = useNavigate();
  const { handleAddToken } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  interface AuthResponse {
    access: string;
    refresh: string;
  }

  function decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (err) {
      return null;
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      if (!username || !password) {
        throw new Error('Username ou senha obrigatórios');
      }

      const response = await api.post<AuthResponse>('/api/v1/authentication/token/', {
        username,
        password,
      });

      const { access } = response.data;
      handleAddToken(access);

      const payload = decodeJWT(access);
      const groups: string[] = payload?.groups || [];

      if (groups.includes('administrators') || groups.includes('operators')) {
        navigate('/main');
      } else if (groups.includes('workers')) {
        navigate('/mainWorker');
      } else {
        navigate('/unauthorized');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErrorMessage('Usuário ou senha inválidos');
    }
  }

  return (
    <div className='container'>
      <div className='container-sign-in'>
        <div className='sign-in'>
          <img src={Logo} alt='logo'/>
          <form onSubmit={handleSubmit}>
            <input
              className='input'
              type='text'
              placeholder='Digite aqui seu username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className='input'
              type='password'
              placeholder='Digite aqui sua senha'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span>Esqueceu sua senha?</span>
            <button className='btn-green'>ENTRAR</button>
            {errorMessage && <p className='error-message'>{errorMessage}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;