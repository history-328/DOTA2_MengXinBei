import http from 'http';

const data = {
  teams: [],
  preSeason: { rounds: [] },
  novaCup: { swissRounds: [], bracket: [] },
  superNovaCup: { bracket: [] }
};

const req = http.request('http://localhost:3000/api/tournament', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', console.error);
req.write(JSON.stringify(data));
req.end();
