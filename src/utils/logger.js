const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/app.log');

exports.log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  fs.appendFileSync(logFile, logMessage);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage);
  }
};