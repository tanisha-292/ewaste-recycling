import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Analyze.css';

function Analyze() {
  const [searchParams] = useSearchParams();
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/devices')
      .then((res) => {
        setDevices(res.data);

        // Identify page theke ashle device ar weight age theke bose jabe
        const presetId = searchParams.get('deviceId');
        const presetWeight = searchParams.get('weight');
        if (presetId) {
          const selected = res.data.find((d) => d._id === presetId);
          if (selected) {
            setDeviceId(presetId);
            setWeight(presetWeight || selected.weightKg);
          }
        }
      })
      .catch(() => setError('Could not load devices'));
  }, [searchParams]);

  const handleDeviceChange = (e) => {
    const id = e.target.value;
    setDeviceId(id);
    setResult(null);

    const selected = devices.find((d) => d._id === id);
    setWeight(selected ? selected.weightKg : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post('/devices/analyze', {
        deviceId,
        weightKg: weight,
        quantity,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyze-container">
      <h2>Material Recovery and Value Estimation</h2>

      <form className="analyze-form" onSubmit={handleSubmit}>
        <label className="analyze-field grow">
          Device
          <select value={deviceId} onChange={handleDeviceChange} required>
            <option value="">Select a device</option>
            {devices.map((device) => (
              <option key={device._id} value={device._id}>
                {device.brand} {device.name} ({device.category})
              </option>
            ))}
          </select>
        </label>

        <label className="analyze-field">
          Weight per item (kg)
          <input
            type="number"
            step="any"
            min="0.001"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </label>

        <label className="analyze-field">
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Calculating...' : 'Analyze'}
        </button>
      </form>

      {error && <div className="analyze-error">{error}</div>}

      {result && (
        <>
          <h3>
            {result.device.brand} {result.device.name}
          </h3>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Weight</div>
              <div className="summary-number">{result.totalWeightKg} kg</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Recoverable Material</div>
              <div className="summary-number">
                {result.totalRecoverableKg} kg
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Estimated Recycling Value</div>
              <div className="summary-number">
                ${result.estimatedValueUSD.toLocaleString()}
              </div>
            </div>
          </div>

          <h3>Recoverable Materials</h3>
          <div className="analyze-table-wrapper">
            <table className="analyze-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Share of weight</th>
                  <th>Recovery rate</th>
                  <th>Recoverable amount</th>
                  <th>Reference price</th>
                  <th>Estimated value</th>
                </tr>
              </thead>
              <tbody>
                {result.materials.map((m) => (
                  <tr key={m.name}>
                    <td>
                      {m.name} {m.symbol && `(${m.symbol})`}
                    </td>
                    <td>{m.percentage}%</td>
                    <td>{m.recoveryRate}%</td>
                    <td>{m.recoverableGrams.toLocaleString()} g</td>
                    <td>${m.pricePerKg.toLocaleString()} / kg</td>
                    <td>${m.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="analyze-note">
            Values are estimates based on average material composition and
            reference prices. Real values depend on device condition and
            market prices.
          </p>
        </>
      )}
    </div>
  );
}

export default Analyze;