package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from clients
	Broadcast chan []byte

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe client access
	mu sync.RWMutex

	// Connection tracking for log deduplication
	totalConnections int64
}

// MaxConnections is the maximum number of concurrent WebSocket connections
// For 4GB RAM VPS, this provides headroom while preventing OOM
const MaxConnections = 2000

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

// Run starts the Hub event loop
func (h *Hub) Run() {
	// Panic recovery to prevent hub from crashing the entire server
	defer func() {
		if r := recover(); r != nil {
			log.Printf("CRITICAL: WebSocket hub panic recovered: %v", r)
			// Restart the hub to maintain service availability
			log.Println("Attempting to restart WebSocket hub...")
			go h.Run()
		}
	}()

	for {
		select {
		case client := <-h.register:
			func() {
				// Panic recovery for individual operations
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Error in hub register operation: %v", r)
					}
				}()
				h.mu.Lock()
				// Enforce connection limit
				if len(h.clients) >= MaxConnections {
					h.mu.Unlock()
					close(client.send)
					log.Printf("Connection rejected: max connections (%d) reached", MaxConnections)
					return
				}
				h.clients[client] = true
				h.totalConnections++
				clientCount := len(h.clients)
				h.mu.Unlock()
				
				// Log every 100th connection or when fewer than 20 clients (development)
				if h.totalConnections%100 == 1 || clientCount < 20 {
					log.Printf("Client connected: %s (role: %s, total: %d)", client.UserID, client.Role, clientCount)
				}
			}()

		case client := <-h.unregister:
			func() {
				// Panic recovery for individual operations
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Error in hub unregister operation: %v", r)
					}
				}()
				h.mu.Lock()
				if _, ok := h.clients[client]; ok {
					delete(h.clients, client)
					close(client.send)
				}
				clientCount := len(h.clients)
				h.mu.Unlock()
				
				// Log disconnects only when fewer than 20 clients (development)
				if clientCount < 20 {
					log.Printf("Client disconnected: %s (remaining: %d)", client.UserID, clientCount)
				}
			}()

		case message := <-h.Broadcast:
			func() {
				// Panic recovery for broadcast operations
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Error in hub broadcast operation: %v", r)
					}
				}()
				var toRemove []*Client
				h.mu.RLock()
				for client := range h.clients {
					select {
					case client.send <- message:
					default:
						toRemove = append(toRemove, client)
					}
				}
				h.mu.RUnlock()
				// Remove disconnected clients with write lock
				if len(toRemove) > 0 {
					h.mu.Lock()
					for _, client := range toRemove {
						if _, ok := h.clients[client]; ok {
							close(client.send)
							delete(h.clients, client)
						}
					}
					h.mu.Unlock()
				}
			}()
		}
	}
}

// BroadcastJSON broadcasts a JSON message with an event type
func (h *Hub) BroadcastJSON(event string, data interface{}) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
	}
	jsonData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}
	h.Broadcast <- jsonData
}

// BroadcastToRole broadcasts a message only to clients with a specific role
func (h *Hub) BroadcastToRole(event string, data interface{}, role string) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
	}
	jsonData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	var toRemove []*Client
	h.mu.RLock()
	for client := range h.clients {
		if client.Role == role {
			select {
			case client.send <- jsonData:
			default:
				toRemove = append(toRemove, client)
			}
		}
	}
	h.mu.RUnlock()
	// Remove disconnected clients with write lock
	if len(toRemove) > 0 {
		h.mu.Lock()
		for _, client := range toRemove {
			if _, ok := h.clients[client]; ok {
				close(client.send)
				delete(h.clients, client)
			}
		}
		h.mu.Unlock()
	}
}

// ClientCount returns the number of connected clients
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// BroadcastAll broadcasts a JSON message to ALL connected clients (including public viewers)
func (h *Hub) BroadcastAll(event string, data interface{}) {
	h.BroadcastJSON(event, data)
}
