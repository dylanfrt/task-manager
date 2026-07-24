import { useEffect, useState } from 'react';
import Auth from './Auth';
import './App.css';

const API_URL = 'http://localhost:5000/api/tasks';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  function handleAuthenticated(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setTasks([]);
  }

  async function handleResponse(res) {
    if (res.status === 401) {
      logout();
      throw new Error('Session expirée, merci de te reconnecter.');
    }
    return res;
  }

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await handleResponse(await fetch(API_URL, { headers: authHeaders() }));
      if (!res.ok) throw new Error('Impossible de charger les tâches');
      setTasks(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTask(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await handleResponse(
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ title: trimmed }),
        })
      );
      if (!res.ok) throw new Error("Impossible d'ajouter la tâche");
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task) {
    try {
      const res = await handleResponse(
        await fetch(`${API_URL}/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ done: !task.done }),
        })
      );
      if (!res.ok) throw new Error('Impossible de mettre à jour la tâche');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    try {
      const res = await handleResponse(
        await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: authHeaders() })
      );
      if (!res.ok) throw new Error('Impossible de supprimer la tâche');
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main className="app">
      <div className="app-header">
        <h1>Gestionnaire de tâches</h1>
        <button type="button" className="link-btn" onClick={logout}>
          Déconnexion
        </button>
      </div>

      <form onSubmit={addTask} className="task-form">
        <label htmlFor="task-title">Nouvelle tâche</label>
        <div className="task-form-row">
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Préparer l'entretien"
            required
            disabled={submitting}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div aria-live="polite">
        {loading ? (
          <p>Chargement...</p>
        ) : tasks.length === 0 ? (
          <p>Aucune tâche pour le moment.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={task.done ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!task.done}
                    onChange={() => toggleTask(task)}
                    aria-label={`Marquer "${task.title}" comme ${task.done ? 'à faire' : 'terminée'}`}
                  />
                  <span>{task.title}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Supprimer la tâche : ${task.title}`}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default App;
