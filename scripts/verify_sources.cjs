const fs = require('fs');

let code = fs.readFileSync('src/data/sources.ts', 'utf8');
code = code.replace(/import .*/, '');
code = code.replace(/export const SOURCES:\s*Citation\[\]\s*=/, 'module.exports =');
fs.writeFileSync('scripts/sources.cjs', code);

const sources = require('./sources.cjs');
console.log(`Loaded ${sources.length} sources to verify.`);

async function checkUrl(source) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  try {
    const res = await fetch(source.url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    return {
      id: source.id,
      title: source.title,
      authors: source.authors,
      venue: source.venue,
      year: source.year,
      url: source.url,
      status: res.status,
      statusText: res.statusText,
      finalUrl: res.url,
      ok: res.ok,
      contentType: res.headers.get('content-type')
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      id: source.id,
      title: source.title,
      authors: source.authors,
      venue: source.venue,
      year: source.year,
      url: source.url,
      status: 0,
      statusText: err.name === 'AbortError' ? 'TIMEOUT (12s)' : err.message,
      finalUrl: source.url,
      ok: false
    };
  }
}

async function verifyAll() {
  console.log('Beginning live network verification for all 18 registered sources...\n');
  const results = [];
  for (const s of sources) {
    process.stdout.write(`Testing ${s.id} (${s.url})... `);
    const r = await checkUrl(s);
    console.log(`[HTTP ${r.status}] ${r.statusText} ${r.ok ? '✓ PASS' : '✗ FAIL'}`);
    results.push(r);
  }

  console.log('\n--- SOURCE VERIFICATION REGISTER (LIVE NETWORK AUDIT) ---');
  console.table(results.map(r => ({
    ID: r.id,
    Year: r.year,
    Title: r.title.slice(0, 32),
    Status: r.status,
    Result: r.ok ? 'PASS' : 'FAIL',
    Destination: r.finalUrl.slice(0, 38)
  })));

  fs.writeFileSync('scripts/source_verification_results.json', JSON.stringify(results, null, 2));
  console.log('\nWrote full verification results to scripts/source_verification_results.json');
}

verifyAll();
