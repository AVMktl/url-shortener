import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UserUrlRow({ url }) {
  const [qr, setQr] = useState('');
  const [showQr, setShowQr] = useState(false);
  const API_URL = process.env.REACT_APP_API || 'https://urlshortenerapp1-hdanbrangkbddxb0.westeurope-01.azurewebsites.net';

  const handleQrClick = async () => {
    try {
      const res = await axios.get(`${API_URL}/qrcode/${url.rowKey}`, { withCredentials: true });
      setQr(res.data.qr);
      setShowQr(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate QR';
      toast.error(msg);
    }
  };

  return (
    <div className="flex justify-between text-sm items-center bg-grey-800 rounded">
      <button onClick={handleQrClick} className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded">
        Show QR
      </button>

      {showQr && qr && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-900 p-4 rounded flex flex-col items-center">
            <img src={qr} alt="QR Code" className="mb-2"/>
            <button onClick={() => setShowQr(false)} className="bg-red-500 px-3 py-1 rounded mt-2">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
