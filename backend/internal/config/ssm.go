package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

// SSMClient wraps the AWS SSM client for parameter fetching
type SSMClient struct {
	client *ssm.Client
	prefix string
}

// NewSSMClient creates a new SSM client with the given configuration
// Returns nil if SSM is not enabled or AWS credentials are not configured
func NewSSMClient() *SSMClient {
	if os.Getenv("USE_AWS_SSM") != "true" {
		log.Println("SSM: Disabled (USE_AWS_SSM is not 'true')")
		return nil
	}

	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-south-1"
	}

	prefix := os.Getenv("SSM_PARAMETER_PREFIX")
	if prefix == "" {
		prefix = "/auctionapp/development"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var cfg aws.Config
	var err error

	// Check if explicit credentials are provided
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	if accessKey != "" && secretKey != "" {
		// Use explicit credentials
		cfg, err = awsconfig.LoadDefaultConfig(ctx,
			awsconfig.WithRegion(region),
			awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				accessKey,
				secretKey,
				"", // session token (optional)
			)),
		)
	} else {
		// Use default credential chain (IAM roles, env vars, shared config, etc.)
		cfg, err = awsconfig.LoadDefaultConfig(ctx,
			awsconfig.WithRegion(region),
		)
	}

	if err != nil {
		log.Printf("SSM: Failed to load AWS config: %v (falling back to env vars)", err)
		return nil
	}

	client := ssm.NewFromConfig(cfg)

	// Test connection by getting caller identity (optional)
	log.Printf("SSM: Initialized successfully (region: %s, prefix: %s)", region, prefix)

	return &SSMClient{
		client: client,
		prefix: prefix,
	}
}

// GetParameter fetches a parameter from SSM Parameter Store
// The name should be the parameter name without the prefix (e.g., "jwt-secret")
// Returns the decrypted value for SecureString parameters
func (s *SSMClient) GetParameter(name string) (string, error) {
	if s == nil || s.client == nil {
		return "", fmt.Errorf("SSM client not initialized")
	}

	paramName := fmt.Sprintf("%s/%s", s.prefix, name)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := s.client.GetParameter(ctx, &ssm.GetParameterInput{
		Name:           aws.String(paramName),
		WithDecryption: aws.Bool(true), // Decrypt SecureString parameters
	})

	if err != nil {
		return "", fmt.Errorf("failed to get SSM parameter %s: %w", paramName, err)
	}

	if result.Parameter == nil || result.Parameter.Value == nil {
		return "", fmt.Errorf("SSM parameter %s has no value", paramName)
	}

	return *result.Parameter.Value, nil
}

// GetParameterWithFallback attempts to get a parameter from SSM, falling back to a default value
func (s *SSMClient) GetParameterWithFallback(name string, fallback string) string {
	if s == nil {
		return fallback
	}

	value, err := s.GetParameter(name)
	if err != nil {
		log.Printf("SSM: Could not fetch %s, using fallback: %v", name, err)
		return fallback
	}

	return value
}

// IsEnabled returns true if the SSM client is properly initialized
func (s *SSMClient) IsEnabled() bool {
	return s != nil && s.client != nil
}
