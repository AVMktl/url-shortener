import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API}/api/auth/login`, { email, password }, { withCredentials: true });
      navigate('/dashboard');
      toast.success('Logged in successfully!');
    } catch (err) {
      console.error(err);
      if(err.response?.status === 401) {
        toast.error('Invalid credentials');
        return;
      }
      toast.error('Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Login</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 mb-4 rounded bg-gray-700 text-white w-80"/>
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="p-2 mb-4 rounded bg-gray-700 text-white w-80"/>
      <button onClick={handleLogin} className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded font-bold">Login</button>
    </div>
  );
}
