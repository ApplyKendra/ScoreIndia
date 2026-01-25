package config

import (
	"log"
	"os"
	"strconv"
)

// DefaultJWTSecret is used to detect insecure configurations
const DefaultJWTSecret = "your-super-secret-jwt-key-change-in-production"

// Config holds all configuration for the application
type Config struct {
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
	JWTExpiry      int // in minutes
	RefreshExpiry  int // in hours
	AllowedOrigins string
	AWSAccessKey   string
	AWSSecretKey   string
	S3Bucket       string
	S3Region       string
	Port           string
	// SSM Configuration
	UseAWSSSM          bool
	SSMParameterPrefix string
	AWSRegion          string
}

// Load loads configuration from environment variables with optional SSM override
func Load() *Config {
	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY_MINUTES", "15"))
	refreshExpiry, _ := strconv.Atoi(getEnv("REFRESH_EXPIRY_HOURS", "168")) // 7 days

	// Initialize SSM client (will be nil if SSM is disabled or unavailable)
	ssmClient := NewSSMClient()

	// Helper function to get value from SSM with env fallback
	getConfigValue := func(ssmKey, envKey, defaultValue string) string {
		// Try SSM first if enabled
		if ssmClient != nil && ssmClient.IsEnabled() {
			if value, err := ssmClient.GetParameter(ssmKey); err == nil && value != "" {
				return value
			}
		}
		// Fall back to environment variable
		return getEnv(envKey, defaultValue)
	}

	cfg := &Config{
		// Secrets that can come from SSM
		DatabaseURL: getConfigValue("database-url", "DATABASE_URL", "postgres://auction:password@localhost:5432/auction?sslmode=disable"),
		RedisURL:    getConfigValue("redis-url", "REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   getConfigValue("jwt-secret", "JWT_SECRET", DefaultJWTSecret),

		// These are typically not stored in SSM (not secrets or config-specific)
		JWTExpiry:      jwtExpiry,
		RefreshExpiry:  refreshExpiry,
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"),
		AWSAccessKey:   getEnv("AWS_ACCESS_KEY", ""),
		AWSSecretKey:   getEnv("AWS_SECRET_KEY", ""),
		S3Bucket:       getEnv("S3_BUCKET", ""),
		S3Region:       getEnv("S3_REGION", "ap-south-1"),
		Port:           getEnv("PORT", "3001"),

		// SSM configuration (for reference)
		UseAWSSSM:          getEnv("USE_AWS_SSM", "false") == "true",
		SSMParameterPrefix: getEnv("SSM_PARAMETER_PREFIX", "/auctionapp/development"),
		AWSRegion:          getEnv("AWS_REGION", "ap-south-1"),
	}

	// Log SSM status
	if cfg.UseAWSSSM {
		if ssmClient != nil && ssmClient.IsEnabled() {
			log.Println("CONFIG: Using AWS SSM Parameter Store for secrets")
		} else {
			log.Println("CONFIG: AWS SSM enabled but client unavailable, using environment variables")
		}
	} else {
		log.Println("CONFIG: Using environment variables for configuration")
	}

	// Validate JWT secret for production
	if cfg.JWTSecret == DefaultJWTSecret {
		if os.Getenv("ENVIRONMENT") == "production" {
			log.Fatal("CRITICAL: You must set a secure JWT_SECRET for production!")
		}
		log.Println("WARNING: Using default JWT secret. Set JWT_SECRET env var for production.")
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

