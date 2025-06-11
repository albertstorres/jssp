import { Navigate, Outlet, Route, Routes} from 'react-router-dom';
import useAuth from './hooks/useAuth';
import Main from './pages/Main';
import SignIn from './pages/SignIn';
import CreateTeam from './pages/CreateTeam';
import MenuTeams from './pages/MenuTeams';

type Props = {
    redirectTo: string;
}

function ProtectedRoutes({redirectTo}: Props){
    const { handleGetToken } = useAuth();
    return handleGetToken() ? <Outlet /> : <Navigate to={redirectTo} />;
}

function MainRoutes(){
    return(
        <Routes>
            <Route path={'/'} element={<SignIn />} />
            <Route element={<ProtectedRoutes redirectTo='/' />}>
                <Route path={'/main'} element={<Main />} />
                <Route path={'/menuTeams'} element={<MenuTeams />} />
                <Route path={'/createTeam'} element={<CreateTeam />} />
            </Route>
        </Routes>
    );
}


export default MainRoutes;