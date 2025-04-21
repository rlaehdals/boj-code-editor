#!/bin/bash

# 사용자가 배포할 서비스를 입력하도록 요청
echo "Deployment Options: "
echo "1. All Services"
echo "2. Server"
echo "3. Front"
echo "4. Java Executor"
echo "5. Javascript Executor"
echo "6. Python Executor"
read -p "Select an option (1-6): " option

# docker-compose 파일로 서비스 선택
case $option in
    1)
        echo "Building and starting all services..."
        docker-compose up -d --build
        ;;
    2)
        echo "Building and starting Algorithm service..."
        docker-compose up -d --build server
        ;;
    3)
        echo "Building and starting Algorithm Front service..."
        docker-compose up -d --build front
        ;;
    4)
        echo "Building and starting Java Executor service..."
        docker-compose up -d --build java-executor
        ;;
    5)
        echo "Building and starting Javascript Executor service..."
        docker-compose up -d --build javascript-executor
        ;;
    6)
        echo "Building and starting Python Executor service..."
        docker-compose up -d --build python-executor
        ;;
    *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
esac
