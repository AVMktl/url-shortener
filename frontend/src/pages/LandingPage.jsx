import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [longUrl, setLongUrl] = useState('');
  const [expiry, setExpiry] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const API_URL =
    process.env.REACT_APP_API ||
    'https://urlshortenerapp1-hdanbrangkbddxb0.westeurope-01.azurewebsites.net';

  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleShorten = async () => {
    if (!longUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (!isValidUrl(longUrl)) {
      toast.error('Enter a valid URL (http:// or https://)');
      return;
    }

    setLoading(true);
    setCopied(false);

    try {
      const res = await axios.post(
        `${API_URL}/shorten`,
        {
          longUrl,
          expirationDate: expiry || null,
          alias: alias?.trim() || undefined,
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
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20 px-4 text-gray-200">
      <h1 className="text-4xl font-bold mb-6 text-green-400">
        Shorten Your URL
      </h1>

      <div className="w-full max-w-2xl space-y-3">
        {/* Main URL input - always full width */}
        <input
          type="text"
          placeholder="Enter long URL"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        {/* Secondary inputs in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isLoggedIn && (
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className={`p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400 ${
              !isLoggedIn ? 'md:col-span-2' : ''
            }`}
          />
          <motion.button
            onClick={handleShorten}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 px-4 py-3 rounded font-bold disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {loading ? 'Shortening...' : 'Shorten'}
          </motion.button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 p-4 bg-gray-800 rounded w-full max-w-2xl flex justify-between items-center shadow-sm"
        >
          <a
            href={result}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 underline break-all"
          >
            {result}
          </a>
          <motion.button
            onClick={handleCopy}
            className="ml-4 px-3 py-1 bg-green-500 hover:bg-green-600 rounded font-bold whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </motion.div>
      )}

      {!isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-16 text-center border-t border-gray-700 pt-8"
        >
          <h2 className="text-2xl font-semibold text-green-400 mb-3">
            Unlock more features
          </h2>
          <p className="text-gray-400 mb-6">
            Sign in to get analytics, geo insights, QR codes, and a personal
            dashboard for your links.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold px-5 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <LogIn size={18} /> Sign in
          </Link>
        </motion.div>
      )}
    </div>
  );
}