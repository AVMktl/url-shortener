import React from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function LinkCard({ u }) {
  const shortUrl = `${process.env.REACT_APP_BASE_URL || window.location.origin}/${u.rowKey}`;

  function copy() {
    navigator.clipboard.writeText(shortUrl)
      .then(() => toast.success('Copied short URL'))
      .catch(() => toast.error('Copy failed'));
  }

  return (
    <div className="p-4 bg-gray-800 rounded shadow flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-300">Alias</div>
          <div className="font-mono text-lg text-green-300">{u.rowKey}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">Clicks</div>
          <div className="font-bold">{u.totalClicks || 0}</div>
        </div>
      </div>

      <div className="text-sm break-words">
        <div className="text-gray-300">Destination</div>
        <a href={u.longUrl} className="text-green-400 underline break-all">{u.longUrl}</a>
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={copy} className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm">Copy</button>
        <Link to={`/dashboard/${u.rowKey}`} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm">View stats</Link>
      </div>
    </div>
  );
}
