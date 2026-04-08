export async function register() {
  console.log('--- Registering Next.js instrumentation ---');

  // Only execute on the Node.js runtime (server side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { spawn } = await import('child_process');
    const path = await import('path');
    
    // The ml-engine folder is now inside the root.
    const mlPath = path.resolve(process.cwd(), 'ml-engine');
    
    console.log('⚙️ Initializing ML Engine sidecar from:', mlPath);
    
    // Spawn python process for ML Engine
    // Using shell: true and -u (unbuffered) for better Windows logging
    const mlProcess = spawn('py', ['-3.12', '-u', '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: mlPath,
      stdio: 'inherit',
      shell: true
    });
    
    // Handle cleanup to prevent zombie processes
    process.on('SIGTERM', () => mlProcess.kill());
    process.on('SIGINT', () => mlProcess.kill());
    process.on('exit', () => mlProcess.kill());

    mlProcess.on('error', (err) => {
      console.error('❌ Failed to start ML Engine:', err);
    });
  }
}
