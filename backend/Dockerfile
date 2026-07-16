FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src ./src
RUN cp src/main/resources/application.properties.example src/main/resources/application.properties \
    && mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/homestay-booking-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000
ENTRYPOINT ["java", "-jar", "app.jar"]
