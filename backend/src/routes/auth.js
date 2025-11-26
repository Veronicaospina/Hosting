const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateRoble, signupDirect } = require('../services/robleService');

// Login con Roble
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const { accessToken, refreshToken, user } = await authenticateRoble(email, password);

    const sessionToken = jwt.sign(
      {
        username: user.username,
        email: user.email,
        id: user.id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token: sessionToken,
      user,
      robleTokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error.response?.data?.message) {
      return res.status(error.response.status || 500).json({ error: error.response.data.message });
    }
    next(error);
  }
});

// Registro directo con Roble
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    const result = await signupDirect(email, password, name);
    res.json(result);
  } catch (error) {
    if (error.response?.data?.message) {
      return res.status(error.response.status || 500).json({ error: error.response.data.message });
    }
    next(error);
  }
});

// Verificar token
router.get('/verify', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;

