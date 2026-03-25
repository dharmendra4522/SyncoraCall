import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import wavingAnimation from '../../assets/waving.json'; // Reusing your animation
import { FaVideo, FaShieldAlt, FaUsers, FaArrowRight } from 'react-icons/fa';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
            {/* 🌟 Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 md:px-20 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <FaVideo size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">Syncora<span className="text-blue-500">Call</span></span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
                    <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
                    <a href="#security" className="hover:text-blue-400 transition-colors">Security</a>
                    <a href="#about" className="hover:text-blue-400 transition-colors">About</a>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/login')} className="px-5 py-2 text-sm font-bold text-slate-300 hover:text-white transition-all">
                        Login
                    </button>
                    <button onClick={() => navigate('/signup')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-black shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* 🚀 Hero Section */}
            <header className="relative px-6 py-20 md:py-32 flex flex-col md:flex-row items-center justify-between gap-12 max-w-7xl mx-auto">
                <div className="md:w-1/2 space-y-6 text-center md:text-left">
                    <div className="inline-block px-4 py-1.5 bg-blue-900/30 border border-blue-500/50 rounded-full text-blue-400 text-xs font-bold tracking-widest uppercase mb-4 animate-pulse">
                        Now with Screen Sharing 🖥️
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black leading-[1.1] bg-gradient-to-r from-white via-white to-slate-500 text-transparent bg-clip-text">
                        Connect Anyone, <br />
                        <span className="text-blue-500 italic">Seamlessly</span>.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto md:mx-0">
                        Experience high-definition video calls with low latency. Connect with your friends, colleagues, and family instantly.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-black flex items-center gap-3 transition-all transform hover:translate-y--1">
                            Join SyncoraCall <FaArrowRight />
                        </button>
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <img 
                                    key={i} 
                                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${i + 10}`} 
                                    className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800"
                                    alt="User"
                                />
                            ))}
                            <div className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold">
                                +10k
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 overflow-hidden">
                        <Lottie animationData={wavingAnimation} className="w-full h-full max-w-md mx-auto" />
                    </div>
                </div>
            </header>

            {/* 🛡️ Features Section */}
            <section id="features" className="px-6 py-20 bg-slate-900/30">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-colors">
                        <div className="bg-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                            <FaVideo className="text-blue-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">HD Video Calling</h3>
                        <p className="text-slate-400">Crystal clear video and audio quality, optimized for your connection.</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-colors">
                        <div className="bg-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                            <FaShieldAlt className="text-blue-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">End-to-End Encrypted</h3>
                        <p className="text-slate-400">Your privacy is our priority. Every call is fully secured.</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-colors">
                        <div className="bg-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                            <FaUsers className="text-blue-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Group Networking</h3>
                        <p className="text-slate-400">Host meetings and hangouts with multiple people effortlessly.</p>
                    </div>
                </div>
            </section>

            {/*  Footer */}
            <footer className="py-10 text-center border-t border-slate-900">
                <p className="text-sm text-slate-500">© 2026 SyncoraCall. Built for fast, reliable connections.</p>
            </footer>
        </div>
    );
};

export default Home;
