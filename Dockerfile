FROM ubuntu:22.04

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

# Yetkisiz Linux kullanıcısı oluştur
RUN useradd -m -u 1001 cadet

WORKDIR /app

# Uygulamayı kopyala ve izinleri ayarla
COPY server.js ./
RUN chown -R cadet:cadet /app

# Yetkisiz kullanıcıya geç
USER cadet

EXPOSE 3000

CMD ["node", "server.js"]