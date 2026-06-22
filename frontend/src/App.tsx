import { useEffect, useState } from 'react';

interface HealthResponse {
  status: string;
  db: string;
  message?: string;
}

interface ExampleItem {
  id: number;
  created_at: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json() as Promise<HealthResponse>)
      .then(setHealth)
      .catch((e: Error) => setError(e.message));

    fetch('/api/example')
      .then((r) => r.json() as Promise<ExampleItem[]>)
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, []);

  const addItem = async () => {
    const res = await fetch('/api/example', { method: 'POST' });
    const data = await res.json() as { id: number };
    setItems((prev) => [...prev, { id: data.id, created_at: new Date().toISOString() }]);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <h1>LabCMS</h1>

      <section>
        <h2>API Health</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {health ? (
          <p>Status: <strong>{health.status}</strong> | DB: <strong>{health.db}</strong></p>
        ) : (
          <p>Checking...</p>
        )}
      </section>

      <section>
        <h2>Example Records</h2>
        <button onClick={addItem}>Add Record</button>
        <ul>
          {items.map((item) => (
            <li key={item.id}>ID: {item.id} — {item.created_at}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
