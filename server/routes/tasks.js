const express = require('express');
const db = require('../db');

const router = express.Router();
const MAX_TITLE_LENGTH = 200;

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid id' });
    return null;
  }
  return id;
}

router.get('/', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return res.status(400).json({ error: `title must be at most ${MAX_TITLE_LENGTH} characters` });
  }
  const result = db
    .prepare('INSERT INTO tasks (title, user_id) VALUES (?, ?)')
    .run(title.trim(), req.user.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'task not found' });

  let title = existing.title;
  if (req.body.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    if (req.body.title.trim().length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: `title must be at most ${MAX_TITLE_LENGTH} characters` });
    }
    title = req.body.title.trim();
  }
  const done = typeof req.body.done === 'boolean' ? (req.body.done ? 1 : 0) : existing.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(title, done, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.status(204).send();
});

module.exports = router;
