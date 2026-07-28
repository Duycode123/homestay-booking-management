FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src ./src
RUN cp src/main/resources/application.properties.example src/main/resources/application.properties \
    && mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre

WORKDIR /app
ENV TZ=Asia/Ho_Chi_Minh
ENV JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Ho_Chi_Minh"
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/homestay-booking-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
