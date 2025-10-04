import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API}/api/auth/register`, { email, password, name }, { withCredentials: true });
      navigate('/dashboard');
      toast.success('Registered successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Register failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Register</h1>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="p-2 mb-4 rounded bg-gray-700 text-white w-80"/>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 mb-4 rounded bg-gray-700 text-white w-80"/>
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="p-2 mb-4 rounded bg-gray-700 text-white w-80"/>
      <button onClick={handleRegister} className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded font-bold">Register</button>
    </div>
  );
}
