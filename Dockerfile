# ==========================================
# Step 1: Build the Application with Maven
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Set working directory inside container
WORKDIR /app

# Copy project files to container
COPY . .

# Package the application into a JAR file (skipping unit tests for faster build)
RUN mvn clean package -DskipTests

# ==========================================
# Step 2: Create Lightweight Runtime Image
# ==========================================
FROM eclipse-temurin:21-jre-jammy

# Set working directory inside runtime container
WORKDIR /app

# Copy built JAR artifact from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose default Spring Boot application port
EXPOSE 8080

# Environment variables default fallback (can be overridden by cloud platform)
ENV PORT=8080

# Launch application
ENTRYPOINT ["java", "-jar", "app.jar"]