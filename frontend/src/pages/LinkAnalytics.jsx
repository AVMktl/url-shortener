import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function LinkAnalytics() {
  const { alias } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`/api/stats/${alias}`);
        // backend returns clicksByDay (object) and clicksOverTime etc.
        const data = res.data;
        setStats(data);
      } catch (err) {
        const msg = err.response?.data?.error || 'Could not load stats';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [alias]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!stats) return <div className="p-8">No stats available.</div>;

  // convert clicksByDay object to array sorted by date
  const series = Object.entries(stats.clicksByDay || {})
    .map(([d, v]) => ({ date: dayjs(d).format('YYYY-MM-DD'), clicks: v }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-green-400">Analytics — {stats.alias}</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded">
          <div className="text-sm text-gray-300">Total clicks</div>
          <div className="text-3xl font-bold">{stats.totalClicks || 0}</div>
          <div className="mt-2 text-sm text-gray-400">Last click: {stats.lastClick ? new Date(stats.lastClick).toLocaleString() : '—'}</div>
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <div className="text-sm text-gray-300">Top referrers</div>
          <ul className="mt-2">
            {Object.entries(stats.topReferrers || {}).slice(0, 5).map(([r, c]) => (
              <li key={r} className="text-sm text-gray-200">
                <span className="text-green-300">{c}</span> — <span className="break-words">{r}</span>
              </li>
            ))}
            {Object.keys(stats.topReferrers || {}).length === 0 && <li className="text-gray-400">No referrers</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded">
        <h3 className="text-lg font-semibold mb-2">Clicks over time</h3>
        {series.length === 0 ? (
          <div className="text-gray-400">No click data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#4ade80" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded">
          <h4 className="text-sm text-gray-300 mb-2">Top user agents</h4>
          <ul>
            {Object.entries(stats.topUserAgents || {}).slice(0, 10).map(([ua, n]) => (
              <li key={ua} className="text-sm text-gray-200 break-words">{n} — {ua}</li>
            ))}
            {Object.keys(stats.topUserAgents || {}).length === 0 && <li className="text-gray-400">No data</li>}
          </ul>
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <h4 className="text-sm text-gray-300 mb-2">Recent clicks</h4>
          <ul className="text-sm">
            { (stats.clicksOverTime || []).slice(0, 10).map((c, i) => (
              <li key={i} className="text-gray-200">{new Date(c.clickedAt).toLocaleString()} — {c.ip || '—'} — {c.referrer || '—'}</li>
            )) }
            { (stats.clicksOverTime || []).length === 0 && <li className="text-gray-400">No clicks</li> }
          </ul>
        </div>
      </div>
    </div>
  );
}
