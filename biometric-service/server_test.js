// Node.js health check for biometric service
const fetch = require('node-fetch');
const BASE = 'http://localhost:8000';

(async function(){
  try{
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.text();
    console.log('status', res.status);
    console.log(body);
  }catch(e){
    console.error('error', e);
  }
})();
