import { readFileSync } from 'fs';
import { TRACKER_PATH } from '../types';

export function startDashboard(port: number = 3737) {
  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);
      
      if (url.pathname === '/') {
        return new Response(Bun.file('./dashboard/index.html'), {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      if (url.pathname === '/api/tracker') {
        try {
          const data = readFileSync(TRACKER_PATH, 'utf-8');
          return new Response(data, {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return Response.json({ error: 'Failed to load tracker data' }, { status: 500 });
        }
      }
      
      return new Response('Not found', { status: 404 });
    },
  });
  
  console.log(`\n📊 Dashboard running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop\n');
  
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down dashboard...');
    server.stop();
    process.exit(0);
  });
}
