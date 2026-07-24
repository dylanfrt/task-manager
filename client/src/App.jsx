import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
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
    if (!trimmed) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Impossible d'ajouter la tâche");
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTask(task) {
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) throw new Error('Impossible de mettre à jour la tâche');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Impossible de supprimer la tâche');
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app">
      <h1>Gestionnaire de tâches</h1>

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
          />
          <button type="submit">Ajouter</button>
        </div>
      </form>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

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
    </main>
  );
}

export default App;
