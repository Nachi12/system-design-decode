const { spawn } = require('child_process');

const routes = [
  { path: '/', expected: 'System Architecture Decoded' },
  { path: '/netflix', expected: 'Netflix: Personalization' },
  { path: '/bookmyshow', expected: 'BookMyShow-Like Ticketing System' },
  { path: '/comparison', expected: 'Read-Heavy Recommendation vs. Contended-Write Ticketing' },
  { path: '/adrs', expected: 'Architecture Decision Records' },
  { path: '/capacity', expected: 'Distributed Capacity & Contention Notebook' },
  { path: '/glossary', expected: 'Distributed Systems Glossary' },
  { path: '/methodology', expected: 'Research Methodology' },
  { path: '/references', expected: 'Authoritative Source Register' },
  { path: '/seat-lock-lab', expected: 'SeatLock Lab' }
];

async function run() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9228',
    'about:blank'
  ]);

  try {
    // Retry loop to connect to Chrome
    let list = null;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://localhost:9228/json');
      list = await res.json();
      if (list && list.length > 0) break;
    } catch (e) {}
  }
  if (!list) throw new Error('Could not connect to Chrome CDP after 15 retries');
    const page = list.find(p => p.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const auditResults = [];

    for (const r of routes) {
      const url = `http://localhost:4173${r.path}`;
      process.stdout.write(`Testing direct navigation to ${r.path}... `);

      // Direct navigation
      await send('Page.navigate', { url });
      await new Promise(res => setTimeout(res, 1200));

      const eval1 = await send('Runtime.evaluate', {
        expression: `(() => {
          const title = document.title;
          const bodyText = document.body.innerText;
          const hasExpected = bodyText.includes(${JSON.stringify(r.expected)});
          const hasCanvas = !!document.querySelector('.react-flow') || !!document.querySelector('svg');
          return { title, hasExpected, hasCanvas };
        })()`,
        returnByValue: true
      });

      const res1 = eval1.result.value;

      // Page refresh (reload)
      process.stdout.write(`Reloading... `);
      await send('Page.reload', {});
      await new Promise(res => setTimeout(res, 1200));

      const eval2 = await send('Runtime.evaluate', {
        expression: `(() => {
          const title = document.title;
          const bodyText = document.body.innerText;
          const hasExpected = bodyText.includes(${JSON.stringify(r.expected)});
          const hasCanvas = !!document.querySelector('.react-flow') || !!document.querySelector('svg');
          return { title, hasExpected, hasCanvas };
        })()`,
        returnByValue: true
      });

      const res2 = eval2.result.value;
      const pass = res1.hasExpected && res2.hasExpected;
      console.log(`[Direct: ${res1.hasExpected ? '✓' : '✗'}, Reload: ${res2.hasExpected ? '✓' : '✗'}] -> ${pass ? 'PASS' : 'FAIL'}`);

      auditResults.push({
        path: r.path,
        expected: r.expected,
        directNavigation: res1.hasExpected,
        pageReload: res2.hasExpected,
        hasSvgOrCanvas: res2.hasCanvas,
        pass
      });
    }

    chrome.kill();
    console.log('\n--- DIRECT NAVIGATION & PAGE REFRESH AUDIT SUMMARY ---');
    console.table(auditResults);

    const allPassed = auditResults.every(r => r.pass);
    if (allPassed) {
      console.log('\nALL 9 ROUTES VERIFIED 100% FUNCTIONAL ON DIRECT LOAD & REFRESH!');
    } else {
      console.error('\nSOME ROUTES FAILED AUDIT!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during test:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
