#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const lsof = spawn('lsof', ['-ti', `:${port}`]);
    let pid = '';
    
    lsof.stdout.on('data', (data) => {
      pid += data.toString().trim();
    });
    
    lsof.on('close', (code) => {
      if (pid && code === 0) {
        console.log(`Killing process ${pid} on port ${port}`);
        spawn('kill', ['-9', pid]);
        setTimeout(resolve, 1000);
      } else {
        resolve();
      }
    });
    
    lsof.on('error', () => resolve());
  });
}

async function start() {
  console.log('🧹 Cleaning up existing processes...');
  
  // Kill processes on common ports
  await killProcessOnPort(5000);
  await killProcessOnPort(3000);
  await killProcessOnPort(8086);
  
  console.log('🚀 Starting application...');
  
  // Start the application
  const app = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  app.on('error', (err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    app.kill('SIGTERM');
    process.exit(0);
  });
}

start().catch(console.error);