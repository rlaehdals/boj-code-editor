const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const port = 8083;

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'; // 기본값은 허용 전체

const corsOptions = {
  origin: allowedOrigin,
};

app.use(cors(corsOptions));
app.use(express.json());

// 금지된 키워드 목록
const BLACKLIST = [
  'eval',
  'exec',
  'child_process',
  'require',
  'fs',
  'process',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
];

// 코드 유효성 검사
const containsForbiddenKeyword = (code) => {
  return BLACKLIST.some(keyword => code.includes(keyword));
};

// 응답 객체
const createResponse = (stdout = '', stderr = '') => ({
  stdout,
  stderr,
});

// 코드 실행
const runCode = (code, input, callback) => {
  const tempFilePath = '/tmp/temp.js';

  const fullCode = `
    const input = ${JSON.stringify(input)};
    ${code}
  `;

  fs.writeFile(tempFilePath, fullCode, (err) => {
    if (err) {
      return callback(createResponse('', '파일 저장 중 오류 발생'));
    }

    exec(`node ${tempFilePath}`, (error, stdout, stderr) => {
      if (error) {
        return callback(createResponse('', stderr));
      }
      callback(createResponse(stdout.trim(), ''));
    });
  });
};

// 실행 라우트
app.post('/execute', (req, res) => {
  const { code = '', input = '' } = req.body;

  if (containsForbiddenKeyword(code)) {
    return res.json(createResponse('', '불법 명령어가 포함되어 있습니다.'));
  }

  runCode(code, input, (result) => {
    res.json(result);
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`JavaScript Executor 서버가 포트 ${port}에서 실행 중입니다.`);
});

