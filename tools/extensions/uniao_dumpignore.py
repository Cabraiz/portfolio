# Lista de ignore embutida do uniao.py (formato .gitignore).

# ============================================================
# DUMPIGNORE INLINE
# ============================================================
INLINE_DUMPIGNORE_LINES = [
    # ---------- Saída deste script ----------
    "todos/",
    "paths.txt",
    "linhas.txt",
    "mirror_outputs/",

    # ---------- Segredos / ambiente ----------
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*.crt",
    "*.pfx",
    "*.p12",
    "id_rsa",
    "id_rsa.pub",
    "secrets/",
    "secret/",
    "credentials/",
    "credentials.json",
    "service-account*.json",

    # ---------- Node / Frontend / Backend JS ----------
    "node_modules/",
    ".next/",
    ".nuxt/",
    ".svelte-kit/",
    ".angular/",
    ".vite/",
    ".turbo/",
    ".parcel-cache/",
    ".yarn/cache/",
    ".yarn/unplugged/",
    ".yarn/install-state.gz",
    ".yarn/build-state.yml",
    ".pnpm-store/",
    ".pnp.cjs",
    ".pnp.data.json",

    "dist/",
    "build/",
    "out/",
    ".output/",
    "storybook-static/",
    "coverage/",
    ".cache/",

    "/reports/ts-sonar-report.json",

    # lockfiles
    "Pipfile.lock",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "npm-shrinkwrap.json",

    # ---------- Python ----------
    "__pycache__/",
    ".pytest_cache/",
    ".ruff_cache/",
    ".mypy_cache/",
    ".tox/",
    ".nox/",
    ".venv/",
    "venv/",
    ".eggs/",
    "*.egg-info/",
    ".coverage",
    "htmlcov/",
    ".hypothesis/",

    # ---------- Java / JVM ----------
    "target/",
    ".gradle/",
    ".idea/",
    "*.iml",

    # ---------- .NET ----------
    "bin/",
    "obj/",
    ".vs/",
    "*.user",
    "*.suo",

    # ---------- Flutter / Dart ----------
    ".dart_tool/",
    ".flutter-plugins",
    ".flutter-plugins-dependencies",
    ".packages",
    "build/",

    # ---------- Logs / temporários ----------
    "*.log",
    "*.tmp",
    "*.temp",
    "*.swp",
    "*.swo",

    # ---------- Artefatos comuns grandes ----------
    "*.map",
    "*.min.js",
    "*.min.css",

    "*.zip",
    "*.tar",
    "*.gz",
    "*.tgz",
    "*.7z",
    "*.rar",
    "*.iso",
    "*.dmg",

    # ---------- Mídia ----------
    "*.svg",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.webp",
    "*.bmp",
    "*.tif",
    "*.tiff",
    "*.ico",
    "*.heic",

    "*.mp4",
    "*.mov",
    "*.mkv",
    "*.avi",
    "*.wmv",
    "*.flv",
    "*.webm",
    "*.m4v",

    "*.mp3",
    "*.wav",
    "*.flac",
    "*.aac",
    "*.ogg",
    "*.m4a",
    "*.wma",

    # ---------- Banco local / dumps ----------
    "*.sqlite",
    "*.sqlite3",
    "*.db",
    "*.dump",

    # ---------- OS ----------
    "Thumbs.db",
    ".DS_Store",

    # ---------- Git ----------
    ".git/",

    # ---------- Legacy ----------
    "*.legacy*/",
    "*.legacy*",

    # ---------- Pastas antigas ----------
    "*.old/",
]
