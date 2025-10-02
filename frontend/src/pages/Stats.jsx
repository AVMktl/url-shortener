import React, { useState } from 'react';
import { getStats } from '../utils/api';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function Stats() {
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await getStats(alias, password);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Server error');
    }
  };

  const chartData = stats
  ? {
      labels: Object.keys(stats.clicksByDay).map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Clicks By Day',
          data: Object.values(stats.clicksByDay),
          fill: false,
          borderColor: 'blue',
          tension: 0.3
        }
      ]
    }
  : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,  // Ensures chart starts at 0
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">View Stats</h1>
      <form className="space-y-4 mb-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Get Stats
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      {stats && (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-2xl p-6 bg-white rounded-xl mb-6">
                <p className="mb-2"><strong>Long URL:</strong> <a href={stats.longUrl} target="_blank" rel="noreferrer" className="text-blue-600">{stats.longUrl}</a></p>
                <p className="mb-4"><strong>Total Clicks:</strong> {stats.totalClicks}</p>
                <div className="w-full h-96">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
