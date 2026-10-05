const fs = require('fs');
const envText = fs.readFileSync('.env', 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) process.env[m[1]] = m[2].replace(/\\n/g, '\n');
}
const postgres = require('postgres');

(async () => {
  const sql = postgres(process.env.POSTGRES_URL, { connection_timeout: 15 });
  try {
    const chats = await sql`
      SELECT id, title FROM "Chat"
      WHERE "userId" = '00000000-0000-4000-8000-000000000001'
        AND (title ILIKE 'What time does Manning%'
          OR title ILIKE 'Say hello%'
          OR title ILIKE 'What sports does%'
          OR id IN ('33333333-3333-4333-8333-333333333333','0e04dc4b-b0ff-46f6-b0c2-b007dae9de6a','139d8c3c-81da-4a7f-8915-ea23dd6182e6','1300aa59-c19f-448f-9586-6869c10e7c78'))
    `;
    console.log('Test chats found:', chats.length);
    for (const c of chats) {
      await sql`DELETE FROM "Message" WHERE "chatId" = ${c.id}`;
      await sql`DELETE FROM "Chat" WHERE id = ${c.id}`;
    }
    const remaining = await sql`SELECT COUNT(*)::int AS n FROM "Chat" WHERE "userId" = '00000000-0000-4000-8000-000000000001'`;
    console.log('Remaining anonymous chats:', remaining[0].n);
  } catch (e) {
    console.log('Cleanup error:', e.message);
  } finally {
    await sql.end();
  }
})();