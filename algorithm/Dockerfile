FROM gradle:8.13-jdk21 AS build

# 작업 디렉토리 설정
WORKDIR /app

# Gradle 빌드 파일 복사
COPY build.gradle settings.gradle ./
COPY src ./src

# 의존성 다운로드 및 빌드
RUN gradle build --no-daemon

# 2단계: 실행 단계
FROM eclipse-temurin:21-jre

# JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app.jar"]
