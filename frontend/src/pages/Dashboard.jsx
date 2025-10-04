import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LinkCard from '../components/LinkCard';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // if no local user, try refresh; if still null, redirect to login
      (async () => {
        const u = await refreshUser();
        if (!u) navigate('/login');
      })();
      return;
    }

    const fetch = async () => {
      try {
        const res = await axios.get('/api/history'); // axios configured withCredentials
        setUrls(res.data.urls || []);
      } catch (err) {
        const msg = err.response?.data?.error || 'Could not load history';
        toast.error(msg);
        if (err.response?.status === 401) navigate('/login');
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-green-400">Your Links</h1>
      {urls.length === 0 ? (
        <div className="text-gray-400">No links yet. Create one on the home page.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urls.map(u => <LinkCard key={u.rowKey} u={u} />)}
        </div>
      )}
    </div>
  );
}
