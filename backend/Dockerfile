FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src ./src
COPY database/Homestay_Database.sql /tmp/schema-base-postgresql.sql
RUN cp src/main/resources/application.properties.example src/main/resources/application.properties \
    && mkdir -p src/main/resources/db/migration \
    && sed '/^BEGIN;$/d; /^COMMIT;$/d' /tmp/schema-base-postgresql.sql > src/main/resources/db/migration/V1__canonical_schema.sql \
    && cp src/main/resources/schema-postgresql.sql src/main/resources/db/migration/V2__runtime_additions.sql \
    && mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/homestay-booking-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000
ENTRYPOINT ["java", "-jar", "app.jar"]
