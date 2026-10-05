const fs = require('fs');
const path = require('path');

const envText = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) process.env[m[1]] = m[2].replace(/\\n/g, '\n');
}

const postgres = require('postgres');

(async () => {
  try {
    const sql = postgres(process.env.POSTGRES_URL, { connection_timeout: 15 });
    const res = await sql`SELECT 1 AS ok`;
    await sql.end();
    console.log('DB: OK ->', JSON.stringify(res));
  } catch (e) {
    console.log('DB: FAIL ->', e.message);
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        max_tokens: 5,
      }),
    });
    const data = await r.json();
    if (r.ok) {
      console.log('GROQ: OK ->', JSON.stringify(data.choices?.[0]?.message?.content));
    } else {
      console.log(
        'GROQ: FAIL (',
        r.status,
        ') ->',
        JSON.stringify(data.error || data).slice(0, 300),
      );
    }
  } catch (e) {
    console.log('GROQ: NETWORK FAIL ->', e.message);
  }
try {
    const r = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY },
    });
    const data = await r.json();
    if (r.ok) {
      console.log('GROQ MODELS:');
      console.log((data.data || []).map((x) => x.id).join('\n'));
    } else {
      console.log('GROQ MODELS FAIL (', r.status, ') ->', JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    console.log('GROQ MODELS NETWORK FAIL ->', e.message);
  }
})();