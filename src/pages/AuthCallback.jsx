import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            login(accessToken, refreshToken);
            // Wait a moment purely for visual transition or go immediately
            navigate('/');
        } else {
            console.error('Login failed: Tokens not found in URL');
            navigate('/login');
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default AuthCallback;
