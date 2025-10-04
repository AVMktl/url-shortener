import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const [longUrl, setLongUrl] = useState('');
  const [expiry, setExpiry] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Utility to validate URLs
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleShorten = async () => {
    // Empty check
    if (!longUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // ✅ URL format check
    if (!isValidUrl(longUrl)) {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setLoading(true);
    setCopied(false);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API}/shorten`,
        {
          longUrl,
          expirationDate: expiry || null
        },
        { withCredentials: true }
      );

      setResult(res.data.shortUrl);
      toast.success('URL shortened successfully!');
    } catch (err) {
      const message = err.response?.data?.error || 'Network or server error';
      setResult(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2s
    });
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Shorten Your URL</h1>
      <div className="flex flex-col md:flex-row gap-2 w-full max-w-xl">
        <input
          type="text"
          placeholder="Enter long URL"
          value={longUrl}
          onChange={e => setLongUrl(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 text-white focus:outline-green-400"
        />
        <input
          type="date"
          value={expiry}
          onChange={e => setExpiry(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleShorten}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-bold disabled:opacity-50"
        >
          {loading ? 'Shortening...' : 'Shorten'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-800 rounded w-full max-w-xl flex justify-between items-center">
          <a href={result} target="_blank" rel="noopener noreferrer" className="text-green-400 underline break-all">
            {result}
          </a>
          <button
            onClick={handleCopy}
            className="ml-4 px-3 py-1 bg-green-500 hover:bg-green-600 rounded font-bold"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
