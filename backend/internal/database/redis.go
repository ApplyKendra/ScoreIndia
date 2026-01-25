package database

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// ConnectRedis establishes a connection to Redis
func ConnectRedis(redisURL string) (*redis.Client, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opt)

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return client, nil
}
