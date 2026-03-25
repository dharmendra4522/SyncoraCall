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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-800 text-white">
            <div className="bg-white text-gray-900 p-8 rounded-lg shadow-white shadow-2xl w-full max-w-md m-2">
                <h2 className="text-3xl font-extrabold text-center mb-6">
                    {type === 'signup' ? 'SignUp SyncoraCall' : 'Login SyncoraCall'}
                </h2>
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
                <p className="text-center text-sm mt-6">
                    {type === 'signup' ? (
                        <>
                            Already have an account?{' '}
                            <Link to="/login">
                                <span className="underline text-blue-600 font-bold">Login</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <Link to="/signup">
                                <span className="underline text-blue-600 font-bold">Register</span>
                            </Link>
                        </>
                    )}
                </p>
            </div>
            <Toaster position="top-center" />
        </div>
    );
};

export default AuthForm;