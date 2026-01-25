package websocket

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/auctionapp/backend/internal/services"
	"github.com/auctionapp/backend/internal/utils"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

// WebSocket timeout configuration
const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second
	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second
	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = 25 * time.Second
)

// Client represents a WebSocket client
type Client struct {
	conn   *websocket.Conn
	send   chan []byte
	hub    *Hub
	UserID uuid.UUID
	Role   string
	TeamID *uuid.UUID
}

// HandleWebSocket handles a new WebSocket connection
func HandleWebSocket(c *websocket.Conn, hub *Hub, svc *services.Services, jwtSecret string) {
	// Extract token from query params or cookie
	token := c.Query("token")
	if token == "" {
		token = c.Cookies("access_token")
	}
	
	if token == "" {
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"Missing token"}`))
		c.Close()
		return
	}

	// Validate token
	claims, err := utils.ValidateJWT(token, jwtSecret)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"Invalid token"}`))
		c.Close()
		return
	}

	client := &Client{
		conn:   c,
		send:   make(chan []byte, 256),
		hub:    hub,
		UserID: claims.UserID,
		Role:   claims.Role,
		TeamID: claims.TeamID,
	}

	hub.register <- client

	// Send initial state
	ctx := context.Background()
	state, err := svc.Auction.GetState(ctx)
	if err == nil {
		initialState, _ := json.Marshal(map[string]interface{}{
			"event": "auction:state",
			"data":  state,
		})
		client.send <- initialState
	}

	// Start goroutines for reading and writing
	go client.writePump()
	client.readPump(svc)
}

// HandlePublicWebSocket handles a new public WebSocket connection (no auth required)
func HandlePublicWebSocket(c *websocket.Conn, hub *Hub, svc *services.Services) {
	client := &Client{
		conn:   c,
		send:   make(chan []byte, 256),
		hub:    hub,
		UserID: uuid.Nil,
		Role:   "viewer",
		TeamID: nil,
	}

	hub.register <- client

	// Send initial state
	ctx := context.Background()
	state, err := svc.Auction.GetState(ctx)
	if err == nil {
		initialState, _ := json.Marshal(map[string]interface{}{
			"event": "auction:state",
			"data":  state,
		})
		client.send <- initialState
	}

	// Start goroutines for reading and writing
	go client.writePump()
	client.readPumpPublic()
}

// readPumpPublic pumps messages from the public WebSocket connection (read-only)
func (c *Client) readPumpPublic() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// Set read deadline and pong handler for connection health
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			// Only log truly unexpected errors, not normal disconnects
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("WebSocket unexpected error: %v", err)
			}
			// Don't log normal close events (1000, 1001, 1005)
			break
		}

		// Parse message
		var msg struct {
			Event string          `json:"event"`
			Data  json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		// Only handle ping for public clients (read-only)
		if msg.Event == "ping" {
			c.send <- []byte(`{"event":"pong"}`)
		}
	}
}

// readPump pumps messages from the WebSocket connection
func (c *Client) readPump(svc *services.Services) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// Set read deadline and pong handler for connection health
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			// Only log truly unexpected errors, not normal disconnects
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("WebSocket unexpected error: %v", err)
			}
			// Don't log normal close events (1000, 1001, 1005)
			break
		}

		// Parse message
		var msg struct {
			Event string          `json:"event"`
			Data  json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		// Handle client events
		switch msg.Event {
		case "ping":
			c.send <- []byte(`{"event":"pong"}`)

		case "bid:place":
			if c.Role != "bidder" || c.TeamID == nil {
				c.send <- []byte(`{"event":"error","data":{"message":"Not authorized to bid"}}`)
				continue
			}
			var bidData struct {
				Amount int64 `json:"amount"`
			}
			if err := json.Unmarshal(msg.Data, &bidData); err != nil {
				continue
			}
			// Place bid through service
			// This would need context - simplified here
			log.Printf("Bid placed by team %s: %d", c.TeamID.String(), bidData.Amount)

		default:
			log.Printf("Unknown event: %s", msg.Event)
		}
	}
}

// writePump pumps messages to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			// Send ping to keep connection alive
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
