{
  description = "FLO Explorer Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {

          packages = with pkgs; [

            # Go
            go
            gopls
            gotools
            delve
            air
            golangci-lint
            sqlc
            goose

            # Frontend
            nodejs_24
            pnpm

            # Database
            postgresql
            redis

            # Infrastructure
            docker
            docker-compose

            # Event Streaming
            nats-server
            natscli

            # Reverse Proxy
            nginx

            # Utilities
            jq
            yq-go
            curl
            wget
            git
            just

            # Proto/OpenAPI
            buf
            protobuf

            # Optional debugging
            k6
            httpie
          ];

          shellHook = ''
            export GOPATH=$PWD/.gopath
            export GOBIN=$GOPATH/bin
            export PATH=$GOBIN:$PATH

            export PNPM_HOME="$PWD/.pnpm"
            export PATH="$PNPM_HOME:$PATH"

            export CGO_ENABLED=1

            echo ""
            echo "FLO Explorer Development Shell"
            echo ""
            echo "Go      : $(go version)"
            echo "Node    : $(node -v)"
            echo "pnpm    : $(pnpm -v)"
            echo ""
          '';
        };
      }
    );
}
