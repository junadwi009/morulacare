FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx256m"
COPY pom.xml .
RUN mvn -B --no-transfer-progress dependency:go-offline
COPY src ./src
RUN mvn -B --no-transfer-progress verify -DargLine=-Xmx256m

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app
COPY --from=build --chown=10001:10001 /app/target/morula-care-api-0.1.0.jar /app/app.jar
USER 10001:10001
EXPOSE 8080
# Profile intentionally not set here. Pass SPRING_PROFILES_ACTIVE=demo explicitly.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "/app/app.jar"]
