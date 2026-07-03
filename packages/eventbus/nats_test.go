package eventbus

import (
	"context"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

func startEmbeddedNATSServer(t *testing.T) string {
	t.Helper()

	opts := &server.Options{
		Port:       -1,
		Host:       "127.0.0.1",
		JetStream:  true,
		NoLog:      true,
		NoSigs:     true,
		MaxPayload: 2 * 1024 * 1024,
		StoreDir:   t.TempDir(),
	}

	srv, err := server.NewServer(opts)
	if err != nil {
		t.Fatalf("nats server: %v", err)
	}

	srv.Start()
	t.Cleanup(srv.Shutdown)

	if !srv.ReadyForConnections(5 * time.Second) {
		t.Fatal("nats server not ready")
	}

	addr := srv.Addr().(*net.TCPAddr)
	return fmt.Sprintf("nats://127.0.0.1:%d", addr.Port)
}

func TestEventBus(t *testing.T) {
	url := startEmbeddedNATSServer(t)
	var pub *NatsPublisher
	var sub *NatsSubscriber

	ctx := context.Background()

	t.Cleanup(func() {
		if pub != nil {
			pub.Close()
		}
		if sub != nil {
			sub.Close()
		}
	})

	t.Run("connect", func(t *testing.T) {
		nc, err := nats.Connect(url)
		if err != nil {
			t.Fatalf("nats.Connect: %v", err)
		}
		defer nc.Close()
		if !nc.IsConnected() {
			t.Fatal("not connected")
		}
	})

	t.Run("create_publisher", func(t *testing.T) {
		var err error
		pub, err = NewNatsPublisher(url)
		if err != nil {
			t.Fatalf("NewNatsPublisher: %v", err)
		}
	})

	t.Run("publish", func(t *testing.T) {
		if err := pub.Publish(ctx, SubjectTxMempoolAdded, []byte(`{"height":1}`)); err != nil {
			t.Fatalf("Publish: %v", err)
		}
	})

	t.Run("create_subscriber", func(t *testing.T) {
		var err error
		sub, err = NewNatsSubscriber(url)
		if err != nil {
			t.Fatalf("NewNatsSubscriber: %v", err)
		}
	})

	t.Run("subscribe_and_receive", func(t *testing.T) {
		received := make(chan *Message, 1)

		err := sub.Subscribe(ctx, SubjectBlockConnected, "test-worker", func(msg *Message) error {
			received <- msg
			return nil
		})
		if err != nil {
			t.Fatalf("Subscribe: %v", err)
		}

		time.Sleep(200 * time.Millisecond)

		if err := pub.Publish(ctx, SubjectBlockConnected, []byte(`{"height":2}`)); err != nil {
			t.Fatalf("Publish: %v", err)
		}

		select {
		case msg := <-received:
			if msg.Subject != SubjectBlockConnected {
				t.Errorf("subject = %q, want %q", msg.Subject, SubjectBlockConnected)
			}
			if string(msg.Data) != `{"height":2}` {
				t.Errorf("data = %q, want %q", string(msg.Data), `{"height":2}`)
			}
			if msg.Seq < 1 {
				t.Errorf("seq = %d, want >= 1", msg.Seq)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("timed out waiting for message")
		}
	})

	t.Run("subscribe_multiple_subjects", func(t *testing.T) {
		received := make(chan *Message, 3)

		subjects := []struct {
			subject string
			payload string
		}{
			{SubjectBlockConnected, `{"block":"a"}`},
			{SubjectTxConfirmed, `{"txid":"b"}`},
			{SubjectTxMempoolAdded, `{"txid":"c"}`},
		}

		for _, s := range subjects {
			name := "test-worker-" + strings.ReplaceAll(s.subject, ".", "-")
			err := sub.Subscribe(ctx, s.subject, name, func(msg *Message) error {
				received <- msg
				return nil
			})
			if err != nil {
				t.Fatalf("Subscribe(%q): %v", s.subject, err)
			}
		}

		time.Sleep(200 * time.Millisecond)

		for _, s := range subjects {
			if err := pub.Publish(ctx, s.subject, []byte(s.payload)); err != nil {
				t.Fatalf("Publish(%q): %v", s.subject, err)
			}
		}

		for range 3 {
			select {
			case <-received:
			case <-time.After(5 * time.Second):
				t.Fatal("timed out waiting for messages")
			}
		}
	})

	t.Run("replay_after_subscribe", func(t *testing.T) {
		// Publish a message before subscribing using a fresh subject
		if err := pub.Publish(ctx, SubjectBlockDisconnected, []byte(`{"height":0}`)); err != nil {
			t.Fatalf("Publish: %v", err)
		}

		time.Sleep(100 * time.Millisecond)

		received := make(chan *Message, 1)
		err := sub.Subscribe(ctx, SubjectBlockDisconnected, "replay-worker", func(msg *Message) error {
			received <- msg
			return nil
		})
		if err != nil {
			t.Fatalf("Subscribe: %v", err)
		}

		select {
		case msg := <-received:
			if string(msg.Data) != `{"height":0}` {
				t.Errorf("data = %q, want %q", string(msg.Data), `{"height":0}`)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("timed out waiting for replayed message")
		}
	})
}
