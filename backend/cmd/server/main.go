package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/auctionapp/backend/internal/config"
	"github.com/auctionapp/backend/internal/database"
	"github.com/auctionapp/backend/internal/handlers"
	"github.com/auctionapp/backend/internal/middleware"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/auctionapp/backend/internal/services"
	"github.com/auctionapp/backend/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	recovermw "github.com/gofiber/fiber/v2/middleware/recover"
	fiberws "github.com/gofiber/websocket/v2"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Redis
	redisClient, err := database.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize repositories
	repos := repository.NewRepositories(db)

	// Initialize services
	svc := services.NewServices(repos, redisClient, cfg)

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go func() {
		// Add panic recovery to hub goroutine
		defer func() {
			if r := recover(); r != nil {
				log.Printf("CRITICAL: WebSocket hub panic recovered: %v", r)
				// Try to restart the hub
				go hub.Run()
			}
		}()
		hub.Run()
	}()

	// Start database connection health monitoring
	go func() {
		// Panic recovery for health monitoring goroutine
		defer func() {
			if r := recover(); r != nil {
				log.Printf("CRITICAL: Health monitoring panic recovered: %v", r)
			}
		}()

		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// Check database connection
				ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
				if err := db.Ping(ctx); err != nil {
					log.Printf("WARNING: Database connection health check failed: %v", err)
				} else {
					// Log pool stats periodically (every 5 minutes)
					stats := db.Stat()
					if stats.AcquireCount()%100 == 0 || stats.AcquiredConns() > 20 {
						log.Printf("Database pool stats: Total=%d, Acquired=%d, Idle=%d, MaxConns=%d",
							stats.TotalConns(), stats.AcquiredConns(), stats.IdleConns(), stats.MaxConns())
					}
					// Warn if connection pool is getting exhausted
					if stats.AcquiredConns() > 20 {
						log.Printf("WARNING: Database connection pool usage high: %d/%d connections in use",
							stats.AcquiredConns(), stats.MaxConns())
					}
				}
				cancel()

				// Check Redis connection
				ctx, cancel = context.WithTimeout(context.Background(), 3*time.Second)
				if err := redisClient.Ping(ctx).Err(); err != nil {
					log.Printf("WARNING: Redis connection health check failed: %v", err)
				}
				cancel()
			}
		}
	}()

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: handlers.ErrorHandler,
		BodyLimit:    30 * 1024 * 1024, // 30MB to support 20MB file uploads with some buffer
	})

	// Middleware
	// Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))
	app.Use(recovermw.New())
	app.Use(logger.New())
	
	// Enforce Content-Type: application/json for state-changing requests (CSRF mitigation)
	// Skip for multipart/form-data (image uploads)
	app.Use(middleware.RequireJSONOrMultipart)

	// Serve static files from uploads directory
	app.Static("/uploads", "./uploads", fiber.Static{
		Compress:      true,
		Browse:        false,
		CacheDuration: 24 * 60 * 60, // 24 hours
	})

	// Initialize handlers
	h := handlers.NewHandlers(svc, hub, cfg)

	// Public routes
	api := app.Group("/api")
	api.Post("/auth/login", middleware.LoginRateLimit(redisClient), h.Login)
	api.Post("/auth/refresh", h.RefreshToken)

	// Public read-only routes (for auctions page)
	api.Get("/public/teams", h.GetTeams)
	api.Get("/public/teams/:id", h.GetTeam)
	api.Get("/public/teams/:id/squad", h.GetTeamSquad)
	api.Get("/public/players", h.GetPlayers)
	api.Get("/public/players/queue", h.GetPlayerQueue)
	api.Get("/public/auction/state", h.GetAuctionState)
	api.Get("/public/stats/top-buys", h.GetTopBuys)
	api.Get("/public/stats/recent-sales", h.GetRecentSales)
	api.Get("/public/stream-url", h.GetStreamUrl)

	// Protected routes
	protected := api.Group("", middleware.JWTAuth(cfg.JWTSecret, redisClient))
	
	// Auth
	protected.Get("/auth/me", h.GetCurrentUser)
	protected.Post("/auth/logout", h.Logout)
	protected.Post("/auth/change-password", h.ChangePassword)

	// Teams
	protected.Get("/teams", h.GetTeams)
	protected.Get("/teams/:id", h.GetTeam)
	protected.Get("/teams/:id/squad", h.GetTeamSquad)
	protected.Get("/teams/:id/retained", h.GetRetainedPlayers)
	protected.Post("/teams", middleware.RequireRole("admin", "super_admin"), h.CreateTeam)
	protected.Put("/teams/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateTeam)
	protected.Post("/teams/:id/retain", middleware.RequireRole("admin", "super_admin"), h.RetainPlayers)
	protected.Delete("/teams/:id", middleware.RequireRole("super_admin"), h.DeleteTeam)

	// Players (note: specific routes must come before parameterized routes)
	protected.Get("/players", h.GetPlayers)
	protected.Get("/players/queue", h.GetPlayerQueue)
	protected.Get("/players/:id", h.GetPlayer)
	protected.Post("/players", middleware.RequireRole("admin", "super_admin"), h.CreatePlayer)
	protected.Post("/players/import", middleware.RequireRole("admin", "super_admin"), h.ImportPlayers)
	protected.Put("/players/:id", middleware.RequireRole("admin", "super_admin"), h.UpdatePlayer)
	protected.Delete("/players/:id", middleware.RequireRole("super_admin"), h.DeletePlayer)

	// Users
	protected.Get("/users", middleware.RequireRole("admin", "super_admin"), h.GetUsers)
	protected.Get("/users/:id", middleware.RequireRole("admin", "super_admin"), h.GetUser)
	protected.Post("/users", middleware.RequireRole("admin", "super_admin"), h.CreateUser)
	protected.Put("/users/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateUser)
	protected.Delete("/users/:id", middleware.RequireRole("super_admin"), h.DeleteUser)

	// Auction
	protected.Get("/auction/state", h.GetAuctionState)
	protected.Post("/auction/start", middleware.RequireRole("host", "admin", "super_admin"), h.StartAuction)
	protected.Post("/auction/end", middleware.RequireRole("host", "admin", "super_admin"), h.EndAuction)
	protected.Post("/auction/pause", middleware.RequireRole("host", "admin", "super_admin"), h.PauseAuction)
	protected.Post("/auction/resume", middleware.RequireRole("host", "admin", "super_admin"), h.ResumeAuction)
	protected.Post("/auction/next-player", middleware.RequireRole("host", "admin", "super_admin"), h.NextPlayer)
	protected.Post("/auction/start-player/:playerId", middleware.RequireRole("host", "admin", "super_admin"), h.StartBidForPlayer)
	protected.Post("/auction/sell", middleware.RequireRole("host", "admin", "super_admin"), h.SellPlayer)
	protected.Post("/auction/sell-to-team/:teamId", middleware.RequireRole("host", "admin", "super_admin"), h.SellToTeam) // Manual tie-breaking
	protected.Post("/auction/unsold", middleware.RequireRole("host", "admin", "super_admin"), h.MarkUnsold)
	protected.Post("/auction/skip-player", middleware.RequireRole("host", "admin", "super_admin"), h.SkipPlayer)
	protected.Post("/auction/reset-timer", middleware.RequireRole("host", "admin", "super_admin"), h.ResetTimer)
	protected.Post("/auction/undo-bid", middleware.RequireRole("host", "admin", "super_admin"), h.UndoBid)
	protected.Post("/auction/reset", middleware.RequireRole("super_admin"), h.ResetAuction)           // Full reset
	protected.Post("/auction/reset-everything", middleware.RequireRole("super_admin"), h.ResetEverything) // Complete system reset
	protected.Post("/auction/broadcast-live", middleware.RequireRole("host", "admin", "super_admin"), h.BroadcastLive) // Go live
	protected.Post("/auction/stream-url", middleware.RequireRole("host", "admin", "super_admin"), h.SetStreamUrl) // Set YouTube stream URL
	protected.Post("/auction/toggle-bidder-bidding", middleware.RequireRole("host", "admin", "super_admin"), h.ToggleBidderBidding) // Toggle bidder bidding disabled

	// Bids
	protected.Post("/bids", middleware.RequireRole("bidder"), h.PlaceBid)
	protected.Post("/bids/for-team", middleware.RequireRole("host", "admin", "super_admin"), h.PlaceBidForTeam)
	protected.Get("/bids/history/:playerId", h.GetBidHistory)

	// Settings
	protected.Get("/settings", middleware.RequireRole("admin", "super_admin"), h.GetSettings)
	protected.Put("/settings", middleware.RequireRole("super_admin"), h.UpdateSettings)

	// Stats
	protected.Get("/stats/overview", h.GetOverviewStats)
	protected.Get("/stats/top-buys", h.GetTopBuys)
	protected.Get("/stats/recent-sales", h.GetRecentSales)

	// Uploads (admin only)
	protected.Post("/uploads/image", middleware.RequireRole("admin", "super_admin"), h.UploadImage)

	// Public WebSocket endpoint (no auth required - for public auction viewers)
	// Uses /ws-public to avoid path prefix conflict with /ws
	app.Use("/ws-public", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws-public", fiberws.New(func(c *fiberws.Conn) {
		websocket.HandlePublicWebSocket(c, hub, svc)
	}))

	// WebSocket endpoint (authenticated)
	app.Use("/ws", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws", fiberws.New(func(c *fiberws.Conn) {
		websocket.HandleWebSocket(c, hub, svc, cfg.JWTSecret)
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Start server with graceful shutdown
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	// Create a channel to listen for interrupt signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := app.Listen(":" + port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-quit
	log.Println("Shutting down server gracefully...")

	// Create shutdown context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Gracefully shutdown the server
	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	// Close database connections
	log.Println("Closing database connections...")
	db.Close()

	// Close Redis connection
	log.Println("Closing Redis connection...")
	redisClient.Close()

	log.Println("Server shutdown complete")
}
