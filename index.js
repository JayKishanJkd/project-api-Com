const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Replace these connection details with your PostgreSQL configuration
const pool = new Pool({
  connectionString: 'postgresql://ultv6k63uq36vroaucej:RtVoGYJLt04avjXaTrcp7v5xDW04l4@b17shpbqy6dfakrwipw9-postgresql.services.clever-cloud.com:50013/b17shpbqy6dfakrwipw9',
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await pool.connect();

    // Check if the user with the provided email already exists
    const result = await client.query('SELECT * FROM jkauth.users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      client.release();
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // If the user doesn't exist, create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query('INSERT INTO jkauth.users (email, password) VALUES ($1, $2) RETURNING *', [email, hashedPassword]);

    client.release();
    
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await pool.connect();

    // Check if the user with the provided email exists
    const result = await client.query('SELECT * FROM jkauth.users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      // If the user doesn't exist, return an error
      client.release();
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // If the user exists, check the password for login
    const storedPasswordHash = result.rows[0].password;
    const passwordMatch = await bcrypt.compare(password, storedPasswordHash);

    if (!passwordMatch) {
      // If the password doesn't match, return an error
      res.status(401).json({ error: 'Invalid credentials' });
    } else {
      // If login is successful, return a success message
      res.json({ message: 'Login successful' });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/employees', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM jkauth.employees');
    const employees = result.rows;
    client.release();

    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
