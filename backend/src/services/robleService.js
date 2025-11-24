const axios = require('axios');

const ROBLE_AUTH_BASE_URL = process.env.ROBLE_AUTH_BASE_URL || 'https://roble-api.openlab.uninorte.edu.co/auth';
const ROBLE_DB_NAME = process.env.ROBLE_DB_NAME;

function getAuthEndpoint() {
  if (!ROBLE_DB_NAME) {
    throw new Error('ROBLE_DB_NAME no está configurado en las variables de entorno');
  }
  return `${ROBLE_AUTH_BASE_URL.replace(/\/$/, '')}/${ROBLE_DB_NAME}`;
}

/**
 * Autentica un usuario en Roble Auth mediante email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function authenticateRoble(email, password) {
  try {
    const baseUrl = getAuthEndpoint();
    const response = await axios.post(`${baseUrl}/login`, { email, password });
    const { accessToken, refreshToken } = response.data;

    let userInfo = { email };
    try {
      const verifyResponse = await axios.get(`${baseUrl}/verify-token`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = verifyResponse.data || {};
      userInfo = data.user || data || { email };
      if (!userInfo.email) {
        userInfo.email = email;
      }
    } catch (verifyError) {
      console.warn('No se pudo obtener la información del usuario desde Roble:', verifyError.message);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: userInfo.id,
        username: userInfo.username || (userInfo.email ? userInfo.email.split('@')[0] : email.split('@')[0]),
        email: userInfo.email,
        name: userInfo.name
      }
    };
  } catch (error) {
    console.error('Error en autenticación Roble:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  authenticateRoble
};

