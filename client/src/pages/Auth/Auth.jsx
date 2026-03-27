import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import apiClient from '../../apiClient';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContextApi';

const AuthForm = ({ type }) => {
    const { updateUser } = useUser();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: 'male',
    });
    const [loading, setLoading] = useState(false);
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (type === 'signup' && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        setLoading(true);
        try {
            const endpoint = type === 'signup' ? 'auth/signup' : 'auth/login';
            const response = await apiClient.post(endpoint, formData);
            toast.success(response.data.message || 'Success!');
            
            // Set user and cookie for both signup and login
            updateUser(response.data);
            const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const expires = "expires=" + date.toUTCString();
            document.cookie = `jwt=${response.data.token}; path=/; ${expires}`;
            
            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Something went wrong!';
            toast.error(errorMessage);
            console.error("Auth Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = (e) => {
        e.preventDefault();
        if (!guestName.trim()) {
            toast.error('Please enter a name to join as guest');
            return;
        }
        
        const guestUser = {
            _id: `guest_${Math.random().toString(36).substring(7)}`,
            username: `${guestName} (Guest)`,
            profilepic: `https://api.dicebear.com/7.x/adventurer/svg?seed=${guestName}`,
            isGuest: true
        };
        
        updateUser(guestUser);
        toast.success(`Welcome, ${guestName}!`);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-800 text-white p-4">
            <div className="bg-white text-gray-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md m-2 relative overflow-hidden">
                {/* Decorative background element for the card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                
                <h2 className="text-4xl font-black text-center mb-2 tracking-tighter">
                    {isGuestMode ? 'Guest Join' : type === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-center text-gray-500 text-sm mb-8">
                    {isGuestMode ? 'Enter your name to join instantly' : 'SyncoraCall Video Meetings'}
                </p>

                {!isGuestMode ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'signup' && (
                        <>
                            <div className="flex items-center border rounded-lg p-2 bg-gray-100">
                                <FaUser className="text-blue-500 mr-2" />
                                <input
                                    type="text"
                                    name="fullname"
                                    placeholder="Full Name"
                                    className="w-full bg-transparent focus:outline-none"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex items-center border rounded-lg p-2 bg-gray-100">
                                <FaUser className="text-blue-500 mr-2" />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    className="w-full bg-transparent focus:outline-none"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div className="flex items-center border rounded-lg p-2 bg-gray-100">
                        <FaEnvelope className="text-blue-500 mr-2" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full bg-transparent focus:outline-none"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="flex items-center border rounded-lg p-2 bg-gray-100">
                        <FaLock className="text-blue-500 mr-2" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="w-full bg-transparent focus:outline-none"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {type === 'signup' && (
                        <div className="flex items-center border rounded-lg p-2 bg-gray-100">
                            <FaLock className="text-blue-500 mr-2" />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                className="w-full bg-transparent focus:outline-none"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    {type === 'signup' && (
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={formData.gender === 'male'}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                Male
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={formData.gender === 'female'}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                Female
                            </label>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : type === 'signup' ? 'Sign Up' : 'Login'}
                    </button>
                </form>
                ) : (
                    <form onSubmit={handleGuestLogin} className="space-y-6">
                        <div className="flex items-center border-2 border-gray-100 rounded-2xl p-4 bg-gray-50 focus-within:border-blue-500 transition-all">
                            <FaUser className="text-blue-500 mr-3 text-xl" />
                            <input
                                type="text"
                                placeholder="Your Display Name"
                                className="w-full bg-transparent focus:outline-none font-bold text-lg"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-black text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                        >
                            Join as Guest
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-center text-sm">
                        {isGuestMode ? (
                            <button 
                                onClick={() => setIsGuestMode(false)}
                                className="text-blue-600 font-black hover:underline"
                            >
                                Back to Login
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-gray-500 font-medium">
                                    {type === 'signup' ? (
                                        <>
                                            Already have an account?{' '}
                                            <Link to="/login" className="text-blue-600 font-black hover:underline pl-1">Login</Link>
                                        </>
                                    ) : (
                                        <>
                                            Don't have an account?{' '}
                                            <Link to="/signup" className="text-blue-600 font-black hover:underline pl-1">Register</Link>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 py-2">
                                    <div className="flex-1 h-[1px] bg-gray-100"></div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
                                    <div className="flex-1 h-[1px] bg-gray-100"></div>
                                </div>
                                <button 
                                    onClick={() => setIsGuestMode(true)}
                                    className="w-full py-3 rounded-2xl border-2 border-gray-100 font-black text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95"
                                >
                                    Join as Guest
                                </button>
                            </div>
                        )}
                    </p>
                </div>
            </div>
            <Toaster position="top-center" />
        </div>
    );
};

export default AuthForm;