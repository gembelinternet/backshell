require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { spawn } = require('child_process');
const basicAuth = require('basic-auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const auth = (req, res, next) => {
  const user = basicAuth(req);
  if (
    user &&
    user.name === process.env.AUTH_USER &&
    user.pass === process.env.AUTH_PASS
  ) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="BackShell"');
  return res.status(401).send('Authentication required.');
};

app.use(auth);
app.use(express.static('public'));

io.on('connection', socket => {
  console.log('🔌 Client connected');

  const isWindows = process.platform === "win32";
const shell = spawn(isWindows ? "cmd.exe" : "/bin/sh", [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

  

  shell.stdout.on('data', data => {
    socket.emit('output', data.toString());
  });

  shell.stderr.on('data', data => {
    socket.emit('output', data.toString());
  });

  shell.on('close', code => {
    socket.emit('output', `Shell exited with code ${code}`);
  });

  socket.on('command', cmd => {
    shell.stdin.write(cmd + '\n');
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
    shell.kill();
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🖥️  BackShell running at http://localhost:${PORT}`);
});
