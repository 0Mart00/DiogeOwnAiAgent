# 1. Alaprendszer
FROM node:20-slim

# 2. Szükséges alapcsomagok (Git, Python ÉS C FORDÍTÓ / MAKE)
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-pip \
    build-essential \
    gcc \
    make \
    && rm -rf /var/lib/apt/lists/*

# 3. Munkakönyvtár beállítása
WORKDIR /app

# 4. Node.js csomagok telepítése
COPY package*.json ./
RUN npm install

# 5. A free-claude-code másolása és a requirements.txt telepítése
COPY free-claude-code/ ./free-claude-code/
RUN pip install --no-cache-dir -r free-claude-code/requirements.txt --break-system-packages

# 6. A teljes maradék kód bemásolása
COPY . .

# 7. Szükséges mappák létrehozása előre
RUN mkdir -p project backups

# 8. Egy indítószkript létrehozása, ami kezeli a letöltést és az indítást
RUN echo '#!/bin/sh\n\
if [ -n "$GITHUB_REPO_URL" ]; then\n\
  echo "🌐 GitHub projekt letöltése: $GITHUB_REPO_URL ..."\n\
  git clone "$GITHUB_REPO_URL" /app/project\n\
fi\n\
exec node index.js' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# 9. Szabályos, biztonságos JSON-formátumú indítás
CMD ["/app/entrypoint.sh"]
# 1. Alaprendszer
FROM node:20-slim

# 2. Szükséges alapcsomagok (Git, Python ÉS C FORDÍTÓ / MAKE)
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-pip \
    build-essential \
    gcc \
    make \
    && rm -rf /var/lib/apt/lists/*

# 3. Munkakönyvtár beállítása
WORKDIR /app

# 4. Node.js csomagok telepítése
COPY package*.json ./
RUN npm install

# 5. A free-claude-code másolása és a requirements.txt telepítése
COPY free-claude-code/ ./free-claude-code/
RUN pip install --no-cache-dir -r free-claude-code/requirements.txt --break-system-packages

# 6. A teljes maradék kód bemásolása
COPY . .

# 7. Szükséges mappák létrehozása előre
RUN mkdir -p project backups

# 8. Egy indítószkript létrehozása, ami kezeli a letöltést és az indítást
RUN echo '#!/bin/sh\n\
if [ -n "$GITHUB_REPO_URL" ]; then\n\
  echo "🌐 GitHub projekt letöltése: $GITHUB_REPO_URL ..."\n\
  git clone "$GITHUB_REPO_URL" /app/project\n\
fi\n\
exec node index.js' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# 9. Szabályos, biztonságos JSON-formátumú indítás
CMD ["/app/entrypoint.sh"]

