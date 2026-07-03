package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

const (
	streamName = "FLORA_EVENTS"
	pubTimeout = 5 * time.Second
)

// NatsPublisher implements Publisher using NATS JetStream.
type NatsPublisher struct {
	conn   *nats.Conn
	js     jetstream.JetStream
	stream jetstream.Stream
}

// NewNatsPublisher connects to NATS, ensures the FLORA_EVENTS stream
// exists, and returns a publisher.
func NewNatsPublisher(url string) (*NatsPublisher, error) {
	conn, err := nats.Connect(url)
	if err != nil {
		return nil, fmt.Errorf("eventbus: connect: %w", err)
	}

	js, err := jetstream.New(conn)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("eventbus: jetstream: %w", err)
	}

	stream, err := ensureStream(js)
	if err != nil {
		conn.Close()
		return nil, err
	}

	return &NatsPublisher{conn: conn, js: js, stream: stream}, nil
}

func (p *NatsPublisher) Publish(ctx context.Context, subject string, data []byte) error {
	ctx, cancel := context.WithTimeout(ctx, pubTimeout)
	defer cancel()

	_, err := p.js.Publish(ctx, subject, data)
	if err != nil {
		return fmt.Errorf("eventbus: publish %q: %w", subject, err)
	}
	return nil
}

func (p *NatsPublisher) Close() error {
	p.conn.Close()
	return nil
}

// getStream returns the underlying JetStream stream, or creates it.
// NatsSubscriber implements Subscriber using NATS JetStream.
type NatsSubscriber struct {
	conn   *nats.Conn
	js     jetstream.JetStream
	stream jetstream.Stream
}

// NewNatsSubscriber connects to NATS, ensures the FLORA_EVENTS stream
// exists, and returns a subscriber.
func NewNatsSubscriber(url string) (*NatsSubscriber, error) {
	conn, err := nats.Connect(url)
	if err != nil {
		return nil, fmt.Errorf("eventbus: connect: %w", err)
	}

	js, err := jetstream.New(conn)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("eventbus: jetstream: %w", err)
	}

	stream, err := ensureStream(js)
	if err != nil {
		conn.Close()
		return nil, err
	}

	return &NatsSubscriber{conn: conn, js: js, stream: stream}, nil
}

func (s *NatsSubscriber) Subscribe(ctx context.Context, subject, durable string, handler func(msg *Message) error) error {
	consumer, err := s.stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:       durable,
		FilterSubject: subject,
		AckPolicy:     jetstream.AckExplicitPolicy,
		MaxDeliver:    10,
	})
	if err != nil {
		return fmt.Errorf("eventbus: create consumer: %w", err)
	}

	iter, err := consumer.Messages()
	if err != nil {
		return fmt.Errorf("eventbus: consumer messages: %w", err)
	}

	go func() {
		defer iter.Stop()
		for {
			msg, err := iter.Next()
			if err != nil {
				return
			}

			meta, err := msg.Metadata()
			if err != nil {
				msg.Nak()
				continue
			}

			m := &Message{
				Subject: msg.Subject(),
				Data:    msg.Data(),
				Seq:     meta.Sequence.Stream,
			}

			if err := handler(m); err != nil {
				msg.Nak()
				continue
			}
			msg.Ack()
		}
	}()

	return nil
}

func (s *NatsSubscriber) Close() error {
	s.conn.Close()
	return nil
}

// ensureStream creates the FLORA_EVENTS stream if it does not already exist.
func ensureStream(js jetstream.JetStream) (jetstream.Stream, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stream, err := js.CreateStream(ctx, jetstream.StreamConfig{
		Name: streamName,
		Subjects: []string{
			"block.>",
			"tx.>",
		},
		Storage:    jetstream.FileStorage,
		MaxAge:     72 * time.Hour,
		MaxMsgSize: 2 * 1024 * 1024, // 2 MB
		Discard:    jetstream.DiscardOld,
	})
	if err != nil {
		// Stream may already exist; attempt to retrieve it.
		var err2 error
		stream, err2 = js.Stream(ctx, streamName)
		if err2 != nil {
			return nil, fmt.Errorf("eventbus: ensure stream - create: %w; get: %w", err, err2)
		}
		return stream, nil
	}

	return stream, nil
}
