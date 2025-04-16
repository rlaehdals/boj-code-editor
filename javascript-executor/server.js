const express = require('express');
const fs = require('fs');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const port = 8083;

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const corsOptions = {
  origin: allowedOrigin,
};

app.use(cors(corsOptions));
app.use(express.json());

const BLACKLIST = [
  'eval', 'exec', 'child_process', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval',
  'fs.writeFile', 'fs.writeFileSync', 'fs.appendFile', 'fs.appendFileSync',
  'fs.open', 'fs.openSync', 'fs.unlink', 'fs.unlinkSync', 'fs.rmdir',
  'fs.rmdirSync', 'fs.mkdir', 'fs.mkdirSync', 'fs.rename', 'fs.renameSync',
  'fs.copyFile', 'fs.copyFileSync', 'fs.chmod', 'fs.chmodSync',
  'fs.chown', 'fs.chownSync',
  'process.exit', 'process.kill', 'process.env', 'process.chdir',
  'process.cwd', 'process.umask',
  'require("http")', 'require("https")', 'require("net")', 'require("dgram")',
  'require(\'http\')', 'require(\'https\')', 'require(\'net\')', 'require(\'dgram\')',
  'require("crypto")', 'require("os")', 'require(\'crypto\')', 'require(\'os\')',
  'import http', 'import https', 'import net', 'import dgram',
  'import crypto', 'import os',
  'process.stdout.write', 'process.stderr.write', '__dirname', '__filename',
];

const containsForbiddenKeyword = (code) => {
  if (BLACKLIST.some(keyword => code.includes(keyword))) return true;

  const fsReassignPattern = /const\s+(\w+)\s*=\s*(?:require\(['"]fs['"]\)|fs);/g;
  let match;
  const fsAliases = ['fs'];

  while ((match = fsReassignPattern.exec(code)) !== null) {
    fsAliases.push(match[1]);
  }

  for (const alias of fsAliases) {
    const dangerousMethods = [
      'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync',
      'unlink', 'unlinkSync', 'rmdir', 'rmdirSync', 'mkdir', 'mkdirSync',
      'rename', 'renameSync', 'copyFile', 'copyFileSync', 'chmod', 'chmodSync'
    ];
    for (const method of dangerousMethods) {
      if (code.includes(`${alias}.${method}`)) {
        return true;
      }
    }
  }

  const readFilePattern = /readFileSync\s*\(\s*(['"`])([^'"`]+)(['"`])/g;
  while ((match = readFilePattern.exec(code)) !== null) {
    const path = match[2];
    const allowedPaths = ['/dev/stdin', 'process.stdin', './input.txt', '/tmp/input.txt'];
    if (!allowedPaths.some(allowed => path.includes(allowed))) {
      return true;
    }
  }

  return false;
};

const createResponse = (stdout = '', stderr = '') => ({
  stdout,
  stderr,
});

const runCode = (code, input, callback) => {
  const tempFilePath = '/tmp/temp.js';
  const tempInputPath = '/tmp/input.txt';

  fs.writeFile(tempInputPath, input, (err) => {
    if (err) {
      return callback(createResponse('', 'Execution Error'));
    }

    const processStdinMock = `
      const fs_original = require('fs');
      const originalReadFileSync = fs_original.readFileSync;
      
      fs_original.readFileSync = function(path, options) {
        if (path === '/dev/stdin') {
          return fs_original.readFileSync('${tempInputPath.replace(/\\/g, '\\\\')}', options);
        }
        return originalReadFileSync(path, options);
      };
      
      const inputContent = fs_original.readFileSync('${tempInputPath.replace(/\\/g, '\\\\')}', 'utf8');
      process.stdin.push(inputContent);
      process.stdin.push(null);
    `;

    fs.writeFile(tempFilePath, processStdinMock + '\n' + code, (err) => {
      if (err) {
        return callback(createResponse('', 'Execution Error'));
      }

      const child = spawn('node', [
        '--no-warnings',
        '--no-deprecation',
        '--max-old-space-size=256',
        tempFilePath
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { PATH: process.env.PATH },
        timeout: 5000,
      });

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        if (stdout.length < 102400) {
          stdout += data.toString();
        }
      });

      child.stderr.on('data', (data) => {
        const errMsg = data.toString();

        if (errMsg.includes('heap out of memory')) {
          stderr = 'Memory limit might have been exceeded.';
          child.kill();
        }else{
          stderr = errMsg;
        }
      });

      const timeoutId = setTimeout(() => {
        child.kill();
        callback(createResponse('', 'Execution timed out.'));
      }, 10000);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        try {
          fs.unlinkSync(tempFilePath);
          fs.unlinkSync(tempInputPath);
        } catch (err) {
          console.error('Execution Error');
        }

        if (code !== 0 && stderr) {
          return callback(createResponse('', stderr));
        }
        callback(createResponse(stdout.trim(), ''));
      });
    });
  });
};

app.post('/execute', (req, res) => {
  const { code = '', input = '' } = req.body;

  if (containsForbiddenKeyword(code)) {
    return res.json(createResponse('', 'Forbidden API usage detected.'));
  }

  runCode(code, input, (result) => {
    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`JavaScript Executor server port: ${port}`);
});
