FROM maven:3.9.9-eclipse-temurin-21 AS build

# 작업 디렉토리 설정
WORKDIR /app

# Gradle 빌드 파일 복사
COPY pom.xml ./
COPY src ./src

# 의존성 다운로드 및 빌드
RUN mvn clean package -DskipTests

# 2단계: 실행 단계
FROM eclipse-temurin:21-jdk

# JAR 파일 복사
COPY --from=build /app/target/java-executor-1.0-SNAPSHOT.jar app.jar

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app.jar"]
