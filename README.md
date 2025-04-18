# Web Code Editor for Baekjoon Algorithm

## Purpose

While solving Baekjoon algorithms, I thought it would be helpful to have a web-based code editor. So, I created a code editor optimized for Baekjoon. This web-based editor supports Java, Python, and JavaScript.

<img width="976" alt="Image" src="https://github.com/user-attachments/assets/b20f5023-3eb4-426a-91ef-c7ac8ba6c7c1" />

## Prerequisites

- Docker Compose must be installed to run the project.

## How to Run

1. Clone the repository and navigate to the project root directory.
2. You can deploy the application by running the `deploy.sh` script located at the root of the project.
3. On the first launch, select option 1 and follow the prompts for further configuration.
4. Once the application is running, access it by navigating to `http://localhost:3000` in your web browser.

## Customization

If you want to expose the editor externally, you can follow these steps:

1. **Domain Setup:** Obtain a domain and set up an NGINX reverse proxy.
2. **URL Structure:** Both the frontend (`example.com`) and server should use the same domain.
   - The executors should be accessible via a subdomain, such as `code.example.com`.
3. **Configuration:** 
   - In the server's `application.yaml`, set the `code.executor.url` value to point to your executor's URL (e.g., `https://code.example.com`).
   - In the `algorithm-front`,`javascript-executor`, create a `.env` file and set the `REACT_APP_API_URL`, `ALLOWED_ORIGIN` variable to the domain where the frontend is hosted (e.g., `https://example.com`).

