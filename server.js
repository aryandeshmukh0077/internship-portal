const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(session({
  name: 'internship.sid',
  secret: process.env.SESSION_SECRET || 'replace-this-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/candidate/index.html'));

app.get('/api/health/db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ database: 'connected' });
  } catch (error) {
    console.error('Database connection check failed:', error.message);
    res.status(503).json({ database: 'unavailable', error: 'Check the database settings in .env.' });
  }
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in first.' });
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Please log in first.' });
    if (req.session.user.role !== role) return res.status(403).json({ error: 'You do not have permission to do that.' });
    next();
  };
}

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

app.post('/api/register', async (req, res, next) => {
  let connection;
  try {
    const name = requiredText(req.body.name, 'Name');
    const email = requiredText(req.body.email, 'Email').toLowerCase();
    const password = requiredText(req.body.password, 'Password');
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, 'candidate']
    );
    await connection.execute('INSERT INTO candidates (user_id) VALUES (?)', [userResult.insertId]);
    await connection.commit();
    req.session.user = { id: userResult.insertId, name, email, role: 'candidate' };
    res.status(201).json({ user: req.session.user });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email is already registered.' });
    if (error.message.endsWith('is required.')) return res.status(400).json({ error: error.message });
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/login', async (req, res, next) => {
  try {
    const email = requiredText(req.body.email, 'Email').toLowerCase();
    const password = requiredText(req.body.password, 'Password');
    const [users] = await db.execute('SELECT id, name, email, password, role FROM users WHERE email = ?', [email]);
    if (!users.length) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const storedPassword = users[0].password;
    const isLegacyHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
    const passwordMatches = isLegacyHash
      ? await bcrypt.compare(password, storedPassword)
      : password === storedPassword;
    if (!passwordMatches) return res.status(401).json({ error: 'Email or password is incorrect.' });
    if (isLegacyHash) {
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [password, users[0].id]);
    }
    const { id, name, role } = users[0];
    req.session.user = { id, name, email, role };
    res.json({ user: req.session.user });
  } catch (error) {
    if (error.message.endsWith('is required.')) return res.status(400).json({ error: error.message });
    next(error);
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out.' }));
});

app.get('/api/me', requireLogin, (req, res) => res.json({ user: req.session.user }));

app.get('/api/profile', requireRole('candidate'), async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id AS user_id, u.name, u.email, c.phone, c.education, c.skills, c.resume
       FROM users u JOIN candidates c ON c.user_id = u.id WHERE u.id = ?`,
      [req.session.user.id]
    );
    res.json({ profile: rows[0] });
  } catch (error) { next(error); }
});

app.put('/api/profile', requireRole('candidate'), async (req, res, next) => {
  try {
    const name = requiredText(req.body.name, 'Name');
    const email = requiredText(req.body.email, 'Email').toLowerCase();
    const phone = (req.body.phone || '').trim();
    const education = (req.body.education || '').trim();
    const skills = (req.body.skills || '').trim();
    const resume = (req.body.resume || '').trim();
    await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.session.user.id]);
    await db.execute(
      'UPDATE candidates SET phone = ?, education = ?, skills = ?, resume = ? WHERE user_id = ?',
      [phone, education, skills, resume, req.session.user.id]
    );
    req.session.user.name = name;
    req.session.user.email = email;
    res.json({ message: 'Profile saved.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email is already in use.' });
    if (error.message.endsWith('is required.')) return res.status(400).json({ error: error.message });
    next(error);
  }
});

app.get('/api/internships', async (req, res, next) => {
  try {
    const [internships] = await db.execute(
      `SELECT id, title, company, location, description, skills, stipend, duration,
              DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline, created_at
       FROM internships ORDER BY deadline ASC, id DESC`
    );
    res.json({ internships });
  } catch (error) { next(error); }
});

app.post('/api/internships', requireRole('admin'), async (req, res, next) => {
  try {
    const { title, company, location, description, skills, stipend, duration, deadline } = req.body;
    const values = [
      requiredText(title, 'Title'), requiredText(company, 'Company'), (location || '').trim(),
      (description || '').trim(), (skills || '').trim(), stipend || '', duration || '', requiredText(deadline, 'Deadline')
    ];
    const [result] = await db.execute(
      'INSERT INTO internships (title, company, location, description, skills, stipend, duration, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      values
    );
    res.status(201).json({ id: result.insertId, message: 'Internship added.' });
  } catch (error) {
    if (error.message.endsWith('is required.')) return res.status(400).json({ error: error.message });
    next(error);
  }
});

app.put('/api/internships/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { title, company, location, description, skills, stipend, duration, deadline } = req.body;
    const values = [
      requiredText(title, 'Title'), requiredText(company, 'Company'), (location || '').trim(),
      (description || '').trim(), (skills || '').trim(), stipend || '', duration || '', requiredText(deadline, 'Deadline'), req.params.id
    ];
    const [result] = await db.execute(
      'UPDATE internships SET title = ?, company = ?, location = ?, description = ?, skills = ?, stipend = ?, duration = ?, deadline = ? WHERE id = ?',
      values
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Internship not found.' });
    res.json({ message: 'Internship updated.' });
  } catch (error) {
    if (error.message.endsWith('is required.')) return res.status(400).json({ error: error.message });
    next(error);
  }
});

app.delete('/api/internships/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM internships WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Internship not found.' });
    res.json({ message: 'Internship deleted.' });
  } catch (error) { next(error); }
});

app.post('/api/applications', requireRole('candidate'), async (req, res, next) => {
  try {
    const internshipId = Number(req.body.internship_id);
    if (!Number.isInteger(internshipId) || internshipId < 1) return res.status(400).json({ error: 'Choose a valid internship.' });
    const [candidates] = await db.execute('SELECT id FROM candidates WHERE user_id = ?', [req.session.user.id]);
    const [internships] = await db.execute('SELECT id FROM internships WHERE id = ?', [internshipId]);
    if (!candidates.length || !internships.length) return res.status(404).json({ error: 'Candidate or internship not found.' });
    await db.execute('INSERT INTO applications (candidate_id, internship_id, status) VALUES (?, ?, ?)', [candidates[0].id, internshipId, 'Applied']);
    res.status(201).json({ message: 'Application submitted.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You have already applied for this internship.' });
    next(error);
  }
});

app.get('/api/applications', requireLogin, async (req, res, next) => {
  try {
    let query = `SELECT a.id, a.status, a.applied_at, i.id AS internship_id, i.title, i.company,
                        u.name AS candidate_name, u.email AS candidate_email
                 FROM applications a
                 JOIN candidates c ON c.id = a.candidate_id
                 JOIN users u ON u.id = c.user_id
                 JOIN internships i ON i.id = a.internship_id`;
    const parameters = [];
    if (req.session.user.role === 'candidate') {
      query += ' WHERE c.user_id = ?';
      parameters.push(req.session.user.id);
    } else if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to view applications.' });
    }
    query += ' ORDER BY a.applied_at DESC';
    const [applications] = await db.execute(query, parameters);
    res.json({ applications });
  } catch (error) { next(error); }
});

app.get('/api/candidates', requireRole('admin'), async (req, res, next) => {
  try {
    const [candidates] = await db.execute(
      `SELECT c.id, u.name, u.email, c.phone, c.education, c.skills, c.resume
       FROM candidates c JOIN users u ON u.id = c.user_id ORDER BY u.name`
    );
    res.json({ candidates });
  } catch (error) { next(error); }
});

app.patch('/api/applications/:id/status', requireRole('admin'), async (req, res, next) => {
  try {
    const statuses = ['Applied', 'Shortlisted', 'Rejected', 'Selected'];
    if (!statuses.includes(req.body.status)) return res.status(400).json({ error: 'Choose a valid application status.' });
    const [result] = await db.execute('UPDATE applications SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Application not found.' });
    res.json({ message: 'Application status updated.' });
  } catch (error) { next(error); }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'A server error occurred. Check the server and database settings.' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));