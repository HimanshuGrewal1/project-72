import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [userAddress, setUserAddress] = useState('');
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem('token');
            const address = localStorage.getItem('address');

            if (token && address) {
                try {
                    const response = await fetch(`http://localhost:5000/api/projects/user/${address}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    setProjects(data);
                } catch (error) {
                    console.error('Error fetching projects:', error);
                }
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/');
        
        const address = localStorage.getItem('address');
        if (address) setUserAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('address');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
            <nav className="flex justify-between items-center max-w-6xl mx-auto mb-12 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                    <span>📚</span> ZK-Librarian
                </h1>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-4 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-bold text-slate-700 font-mono">{userAddress}</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Your Vaults</h2>
                        <p className="text-slate-500 mt-1">Manage your zero-knowledge research graphs.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/create-project')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        <span className="text-lg">+</span> New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <div className="text-5xl mb-4">🗂️</div>
                        <h3 className="text-xl font-bold text-slate-700">No projects yet</h3>
                        <p className="text-slate-500 mt-2">Create your first encrypted knowledge graph to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div 
                                key={project._id}
                                onClick={() => navigate(`/project/${project._id}`)}
                                className="group cursor-pointer bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px]"
                            >
                                <div>
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                        {project.emoji || '📁'}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                        {project.name}
                                    </h3>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {project.status || 'Active'}
                                    </span>
                                    <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                        →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}