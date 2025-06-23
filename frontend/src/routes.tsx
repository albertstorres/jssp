import { Navigate, Outlet, Route, Routes} from 'react-router-dom';

import useAuth from './hooks/useAuth';

import Main from './pages/Main';
import SignIn from './pages/SignIn';

import CreateCategory from './pages/CreateCategory';
import CreateEquipment from './pages/CreateEquipment';
import CreateOperation from './pages/CreateOperation';
import CreateTask from './pages/CreateTask';
import CreateTeam from './pages/CreateTeam';
import CreateWorker from './pages/CreateWorker';

import ListCategories from './pages/ListCategories';
import ListEquipments from './pages/ListEquipments';
import ListOperations from './pages/ListOperations';
import ListTasks from './pages/ListTasks';
import ListTeams from './pages/ListTeams';
import ListWorkers from './pages/ListWorkes';

import MenuCategories from './pages/MenuCategories';
import MenuEquipments from './pages/MenuEquipments';
import MenuOperations from './pages/MenuOperations';
import MenuTasks from './pages/MenuTasks';
import MenuTeams from './pages/MenuTeams';
import MenuWorkers from './pages/MenuWorkers';


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
                <Route path={'/menuCategories'} element={<MenuCategories />} />
                <Route path={'/menuEquipments'} element={<MenuEquipments />} />
                <Route path={'/menuOperations'} element={<MenuOperations />} />
                <Route path={'/menuTasks'} element={<MenuTasks />} />
                <Route path={'/menuTeams'} element={<MenuTeams />} />
                <Route path={'/menuWorkers'} element={<MenuWorkers />} />
                <Route path={'/createCategory'} element={<CreateCategory />} />
                <Route path={'/createTeam'} element={<CreateTeam />} />
                <Route path={'/createOperation'} element={<CreateOperation />} />
                <Route path={'/createTask'} element={<CreateTask />} />
                <Route path={'/createEquipment'} element={<CreateEquipment />} />
                <Route path={'/createWorker'} element={<CreateWorker />} />
                <Route path={'/listCategories'} element={<ListCategories />} />
                <Route path={'/listEquipments'} element={<ListEquipments />} />
                <Route path={'/listOperations'} element={<ListOperations />} />
                <Route path={'/listTasks'} element={<ListTasks />} />
                <Route path={'/listTeams'} element={<ListTeams />} />
                <Route path={'/listWorkers'} element={<ListWorkers />} />
            </Route>
        </Routes>
    );
}


export default MainRoutes;