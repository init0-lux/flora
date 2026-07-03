package eventbus

import (
	"context"
	"errors"
)

// no message available (consumer timeout)
var ErrNoMessage = errors.New("eventbus: no message")

type Message struct {
	Subject string
	Data    []byte
	Seq     uint64
}

// Publisher publishes events to the event bus.
type Publisher interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Close() error
}

// Subscriber consumes events from the event bus.
type Subscriber interface {
	Subscribe(ctx context.Context, subject, durable string, handler func(msg *Message) error) error
	Close() error
}
