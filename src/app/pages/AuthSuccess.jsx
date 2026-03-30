import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import authService from '../../appwrite/authService';
import userInfoService from '../../appwrite/userInfoService';
import { login } from '../../store/authSlice';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

/**
 * AuthSuccess Component
 * Handles the OAuth callback after successful Google authentication
 * Creates user info document with name if it doesn't exist
 * Route: /auth-success
 */
const AuthSuccess = () => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        handleGoogleAuthSuccess();
    }, []);

    const handleGoogleAuthSuccess = async () => {
        try {
            // Get the current authenticated user
            const { user, error: userError } = await authService.getUser();
            if (userError) throw new Error(userError);

            // Check if user info already exists
            const { userInfo, error: userInfoError } = await userInfoService.getUserInfo(user.$id);

            if (userInfoError) {
                // User info doesn't exist, create it
                // This happens on first-time Google login

                // Generate a unique username
                let newUsername;
                let unique = false;
                let attempts = 0;

                while (!unique && attempts < 5) {
                    newUsername = `user${user.$id.substring(0, 4)}${Math.floor(100 + Math.random() * 900)}`;
                    const { exists } = await userInfoService.checkUsernameExists({ username: newUsername });
                    if (!exists) unique = true;
                    attempts++;
                }

                if (!unique) {
                    throw new Error("Failed to generate unique username");
                }

                // Create user info with name from Google account
                const { username: createdUsername, name: storedName, error: createError } = await userInfoService.createUsername({
                    userId: user.$id,
                    username: newUsername,
                    name: user.name // Get name from Google OAuth
                });

                if (createError) throw new Error(createError);

                // Dispatch login with new user info
                dispatch(login({
                    userData: user,
                    username: createdUsername,
                    name: storedName
                }));

                // Navigate to profile
                navigate(`/profile/${createdUsername}`);
            } else {
                // User info exists, just login
                dispatch(login({
                    userData: user,
                    username: userInfo.username,
                    name: userInfo.name
                }));

                // Navigate to profile
                navigate(`/profile/${userInfo.username}`);
            }
        } catch (error) {
            console.error('Google auth error:', error);
            setError(error.message);
            // Redirect to login after error
            setTimeout(() => {
                navigate('/auth');
            }, 2500);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-4">
                        We couldn't connect to your Google account. Please try signing in with your credentials instead.
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return <Loader />;
};

export default AuthSuccess;