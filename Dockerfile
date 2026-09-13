FROM node:18-bullseye

# GCC, Make, Git ve temel C derleme araçlarını kur
RUN apt-get update && apt-get install -y \
    gcc \
    make \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install

# Tüm proje dosyalarını (server.js dahil) kopyala
COPY . .

# Portu dışa aç
EXPOSE 3000

# Sunucuyu başlat
CMD ["node", "server.js"]
