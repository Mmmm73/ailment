// server/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whistleblowing',
  password: 'Melvin',
  port: 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

router.post('/logout', async (req, res) => {
  const {userJwtToken} = req.body;
  try{

    const decoded = jwt.verify(userJwtToken, 'whistleblowing');

    const userId = decoded.userId;
  
    await pool.query('UPDATE users SET userjwt = NULL WHERE  userid = $1', [userId]);
  
    res.status(200).json({message: 'Logout successful'});
  }

  catch(error){
    console.log('Error during logout:', error);
    res.status(401).json({error: 'Invalid token'});
  }

});

router.post('/signup', async (req, res) => {
  const { username, userpassword } = req.body;

  try {

    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    console.log("xxx1");

    if (existingUser.rows.length > 0) {
      console.log("xxx2");
      console.log('Username already in use');
      return res.status(400).json({ error: 'Username already in use' });
    } else {
      console.log("xxx3");
      const hashedPassword = await bcrypt.hash(userpassword, 10);

      const newUser = await pool.query(
        'INSERT INTO users (username, userpassword) VALUES ($1, $2) RETURNING userid',
        [username, hashedPassword]
      );

      const userId = newUser.rows[0].userid;
      const userJwtToken = jwt.sign({userId}, 'whistleblowing');

      await pool.query('UPDATE users SET userjwt = $1 WHERE userid = $2', [userJwtToken,userId]);

      res.status(201).json({ userJwtToken: userJwtToken });
    }
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});

router.post('/login', async (req, res) => {
  const { username, userpassword } = req.body;
  console.log('req.body', req.body.username, req.body.userpassword);

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const hashedPassword = user.rows[0].userpassword;

    const passwordMatch = await bcrypt.compare(userpassword, hashedPassword);

    const userId = user.rows[0].userid;

    if (passwordMatch) {
      const userJwtToken = jwt.sign({userId}, 'whistleblowing');

      await pool.query('UPDATE users SET userjwt = $1 WHERE userid = $2', [userJwtToken, userId]);

      return res.status(200).json({userJwtToken: userJwtToken });
    } else {
      return res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});

module.exports = router;
