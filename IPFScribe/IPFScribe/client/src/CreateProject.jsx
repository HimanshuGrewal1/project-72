// client/src/CreateProject.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UploadPDF from './components/UploadPDF';
import { checkAndSignAuthMessage } from "@lit-protocol/lit-node-client";

export default function CreateProject() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null); // State for the PDF
    const [loading, setLoading] = useState(false);
    const [authSig,setauthSig] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/');

        // const func = async()=>{

        //     const sig = await checkAndSignAuthMessage({
        //         chain: "ethereum",
        //     });
        //     setauthSig(sig);
        // }
        // func();


    }, [navigate]);

    const formSubmit = async () => {
        if (!title) {
            alert('Please enter a project title.');
            return;
        }
        setLoading(true);
        try {
            // 1. Create Project in Backend
            const response = await axios.post('http://localhost:5000/api/projects', {
                name: title,
                description: description,
                ownerId: localStorage.getItem('address')
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // 2. Handle Success
            console.log('Project created:', response.data);
            setLoading(false);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating project:', error);
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black text-gray-800">Blast Off! 🚀</h1>
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-800 text-xl font-bold">✕</button>
                </div>
                <input 
                    type="text" 
                    placeholder="Project Title" 
                    className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <button onClick={formSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform transition hover:-translate-y-1">
                    Create Project
                </button>
                {/* <UploadPDF authSig={authSig} /> */}
            </div>
        </div>
    );
}