import React, { useState } from 'react';
import { createShortUrl } from '../utils/api';
import ShortUrlCard from '../components/ShortUrlCard';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [shortUrlData, setShortUrlData] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await createShortUrl({ longUrl, password, alias });
      setShortUrlData(res.data);
      console.log(res);
      setLongUrl('');
      setAlias('');
      setPassword('');
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || 'Server error');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Short URL</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter long URL"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Custom alias (optional)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Set password to view stats"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Shorten
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {shortUrlData && <ShortUrlCard data={shortUrlData} />}
    </div>
  );
}
