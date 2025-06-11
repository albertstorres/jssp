
function useAuth() {

    function handleAddToken(access: string){
        localStorage.setItem('access', access);
    }

    function handleClearToken(){
        localStorage.removeItem('access');
    }

    function handleGetToken():string | null{
        return localStorage.getItem('access');
    }

    return{
        handleAddToken,
        handleGetToken,
        handleClearToken
    }
}


export default useAuth;