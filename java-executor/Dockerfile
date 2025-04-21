FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml ./
COPY src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jdk

COPY --from=build /app/target/java-executor-1.0-SNAPSHOT.jar app.jar

ENTRYPOINT ["java","--add-exports=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED", "--add-exports=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED","--add-exports=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED","--add-exports=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED","--add-exports=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED","--add-exports=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED", "-jar", "/app.jar"]