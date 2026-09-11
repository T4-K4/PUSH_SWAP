FROM ubuntu:22.04

# Temel C derleme araçlarını ve Node.js'i kur
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    make \
    git \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Sunucu dosyasını kopyala
COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]