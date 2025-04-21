FROM python:3.10-slim

WORKDIR /app

COPY python-executor.py .

RUN pip install flask black flask-cors

EXPOSE 8082

CMD ["python", "python-executor.py"]
