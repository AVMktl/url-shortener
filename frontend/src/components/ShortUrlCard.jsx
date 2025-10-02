import React from 'react';

export default function ShortUrlCard({ data }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.shortUrl);
    alert('Copied to clipboard!');
  };

  return (
    <div className="mt-4 p-4 border rounded shadow bg-gray-50">
      <p><strong>Short URL:</strong> <a href={data.shortUrl} target="_blank" rel="noreferrer" className="text-blue-600">{data.shortUrl}</a></p>
      <button onClick={copyToClipboard} className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
        Copy URL
      </button>
    </div>
  );
}
