# 📘 Web Code Editor for Baekjoon Algorithm

A **web-based code editor** built to improve your experience solving problems on [Baekjoon Online Judge](https://www.acmicpc.net/).  
Write, format, and test your Java, Python, or JavaScript code directly in the browser — fast, minimal, and beginner-friendly.

<img width="967" alt="Image" src="https://github.com/user-attachments/assets/61ae597c-6197-41d2-8020-eec785e91a97" />

---

## 🚀 Features

- ✍️ Supports **Java**, **Python**, and **JavaScript**
- 🧠 Toggle **autocomplete** with Ace Editor
- 🧪 Create, edit, and remove **custom test cases**
- ✅ Compare **expected vs. actual** output
- 🎯 **Code formatting** using Prettier (for JS) or remote API
- 📋 Copy code to clipboard with one click

---

## 📦 Prerequisites

- Docker & Docker Compose must be installed

---

## ⚙️ How to Run (Locally)

```bash
git clone https://github.com/rlaehdals/boj-code-editor.git
cd boj-code-editor
./deploy.sh
```

1. On the first launch, choose **Option 1** when prompted.
2. Follow the on-screen instructions to complete the setup.
3. Open your browser and go to [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy with Custom Domain

To expose the editor to the public, follow these steps:

### 1. 🛠 Domain & NGINX Setup
- Point your domain to a server with NGINX and configure a reverse proxy.
- If needed, just fill in the values for the 3 configuration files below.

### 2. 🏷 Recommended URL structure
- Frontend: `https://example.com`
- Server: `https://api.example.com`
- Executor: `https://code.example.com`

### 3. 🔧 Configuration

- **Server (`application.yaml`)**
  ```yaml
  code:
    executor:
      url: https://code.example.com
  ```
- **Frontend (`.env`)**
  ```env
  REACT_APP_API_URL=https://api.example.com
  ```
- **Executor (`docker-compose.yaml`)**
  ```
  environment:
    - ALLOWED_ORIGIN="https://api.example.com"
  ```

---

## 📁 Project Structure (Overview)

```bash
.
├── algorithm              # Springboot-based web Server
├── algorithm-front        # React-based web editor (CodeEditor.js)
├── java-executor          # Java code executor server
├── python-executor        # Python code executor server
├── javascript-executor    # JavaScript code executor server
└── deploy.sh              # One-click deploy script
```

---

## 📜 License

This project is licensed under the MIT License.
