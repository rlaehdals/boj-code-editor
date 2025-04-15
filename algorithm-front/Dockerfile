# Node.js v22.14.0 이미지에서 빌드
FROM node:22.14.0

# 작업 디렉토리 설정
WORKDIR /app

# 종속성 파일 복사
COPY package.json package-lock.json ./

# 종속성 설치
RUN npm install --legacy-peer-deps

# 소스 코드 복사
COPY . .

# 노드 서버 시작
CMD ["npm", "start"]