{
  description = "Esperanza — local development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22 # bundles corepack, which runs the pnpm pinned in package.json
            openssl # Prisma's OpenSSL probe
          ];

          shellHook = ''
            # Activate the exact pnpm from package.json's "packageManager" field via
            # corepack. `corepack enable` can't write shims on the read-only nix store,
            # so expose a tiny wrapper on PATH instead.
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
            mkdir -p "$PWD/.nix/bin"
            cat > "$PWD/.nix/bin/pnpm" <<'SH'
#!/usr/bin/env bash
exec corepack pnpm "$@"
SH
            chmod +x "$PWD/.nix/bin/pnpm"
            export PATH="$PWD/.nix/bin:$PATH"

            echo "Esperanza dev shell → node $(node -v) · pnpm $(pnpm -v 2>/dev/null || echo unavailable)"
          '' + pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
            # Prisma ships no linux-nixos prebuilt engines. The query engine is WASM
            # inside @prisma/client (engineType="client" + libsql adapter) so it needs
            # no native binary; only the schema engine (migrate / db push) needs the
            # nixpkgs build. Keep prisma-engines pinned to the same version as the
            # `prisma` npm package (nixos-unstable tracks it).
            if [ -e /etc/NIXOS ]; then
              export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
              export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
              export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.openssl pkgs.stdenv.cc.cc.lib ]}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
            fi
          '';
        };
      });
}
