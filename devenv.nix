{pkgs, ...}: let
  # CI (.github/workflows/ci.yml) and the container images (deploy/) use Node 24.
  # Keep the local shell on the same major so `npm test` / `npm run build` behave the same.
  node = pkgs.nodejs_24;
in {
  packages = [
    node
    pkgs.lefthook
    # Video inspection and frame extraction require ffmpeg / ffprobe (H.264 / AAC).
    pkgs.ffmpeg-headless
  ];

  # The project reads its settings from environment variables only (.env.example).
  # No .env auto-loading: export the settings before running project commands.

  # `npm install` is still run by hand after the first `devenv shell`; installing
  # dependencies is not a side effect of entering the shell.
  enterShell = ''
    echo "node $(node -v) / npm $(npm -v) / $(ffmpeg -version | head -1)"
    echo "Run project commands as: devenv shell -- <command>"
  '';

  # Git hooks are installed per clone by `npm install` (prepare script) or
  # `devenv shell -- npm exec lefthook install`.
}
