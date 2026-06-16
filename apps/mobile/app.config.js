const path = require('path');
const fs = require('fs');

// Load monorepo root .env so EXPO_PUBLIC_* vars are available to the mobile app
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...require('./app.json').expo,
});
