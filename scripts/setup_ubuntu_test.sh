#!/bin/bash
# ==============================================================================
# PMOC Gestor 360 - Script de Instalação e Deploy no Ubuntu (Base de Testes)
# Servidor Alvo: Ubuntu Linux (IP: 192.168.0.50)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  PMOC GESTOR 360 - INSTALAÇÃO DE BASE DE TESTES (UBUNTU LINUX)       ${NC}"
echo -e "${BLUE}  IP do Servidor de Testes: 192.168.0.50                              ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Verificar privilégios sudo
if [ "$EUID" -ne 0 ] && ! command -v sudo &> /dev/null; then
    echo -e "${RED}[ERRO] Este script requer privilégios de sudo/root para instalar dependências.${NC}"
    exit 1
fi

SUDO_CMD=""
if [ "$EUID" -ne 0 ]; then
    SUDO_CMD="sudo"
fi

# 2. Instalar Docker e Docker Compose no Ubuntu se não estiverem presentes
echo -e "\n${YELLOW}=== [1/5] Verificando Docker e Docker Compose no Ubuntu ===${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "Docker não encontrado. Instalando Docker via apt..."
    $SUDO_CMD apt-get update -y
    $SUDO_CMD apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Instalar docker e plugins oficiais
    $SUDO_CMD install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO_CMD gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        $SUDO_CMD chmod a+r /etc/apt/keyrings/docker.gpg
    fi
    
    UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME} stable" | \
      $SUDO_CMD tee /etc/apt/sources.list.d/docker.list > /dev/null
      
    $SUDO_CMD apt-get update -y
    $SUDO_CMD apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    $SUDO_CMD systemctl enable docker
    $SUDO_CMD systemctl start docker
    echo -e "${GREEN}Docker e Docker Compose instalados com sucesso!${NC}"
else
    echo -e "${GREEN}Docker já está instalado: $(docker --version)${NC}"
fi

# Garantir que o docker compose ou docker-compose esteja disponível
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Instalando utilitário Docker Compose...${NC}"
    $SUDO_CMD apt-get update -y 2>/dev/null || true
    if $SUDO_CMD apt-get install -y docker-compose-v2 2>/dev/null; then
        echo -e "${GREEN}docker-compose-v2 instalado via apt!${NC}"
    else
        echo -e "Baixando binário oficial do Docker Compose..."
        $SUDO_CMD curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
        $SUDO_CMD chmod +x /usr/local/bin/docker-compose
        $SUDO_CMD ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose 2>/dev/null || true
        $SUDO_CMD mkdir -p /usr/local/lib/docker/cli-plugins 2>/dev/null || true
        $SUDO_CMD ln -sf /usr/local/bin/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose 2>/dev/null || true
        echo -e "${GREEN}Docker Compose instalado com sucesso!${NC}"
    fi
fi

# Adicionar usuário atual ao grupo docker para não precisar de sudo no futuro
if [ -n "$SUDO_USER" ]; then
    $SUDO_CMD usermod -aG docker "$SUDO_USER" 2>/dev/null || true
elif [ "$USER" != "root" ]; then
    $SUDO_CMD usermod -aG docker "$USER" 2>/dev/null || true
fi

# 3. Configuração do arquivo .env
echo -e "\n${YELLOW}=== [2/5] Configurando variáveis de ambiente (.env) ===${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}Arquivo .env criado a partir de .env.example.${NC}"
else
    echo -e "${GREEN}Arquivo .env já existente preservado.${NC}"
fi

# Garantir porta padrão 8081 se não definida
if ! grep -q "^APP_PORT=" .env; then
    echo "APP_PORT=8081" >> .env
fi

# 4. Ajustar permissões da pasta
echo -e "\n${YELLOW}=== [3/5] Ajustando permissões de diretórios ===${NC}"
PROJECT_DIR="$(pwd)"
chmod -R 755 "$PROJECT_DIR" 2>/dev/null || true
echo -e "${GREEN}Permissões ajustadas para $PROJECT_DIR.${NC}"

# 5. Configurar Firewall UFW (Padrão do Ubuntu)
echo -e "\n${YELLOW}=== [4/5] Verificando Firewall (UFW) ===${NC}"
PORT=$(grep "^APP_PORT=" .env | cut -d '=' -f2 | tr -d ' ' || echo "8081")
[ -z "$PORT" ] && PORT="8081"

if command -v ufw &> /dev/null; then
    if $SUDO_CMD ufw status | grep -q "Status: active"; then
        $SUDO_CMD ufw allow "${PORT}/tcp" comment "PMOC Gestor Testes"
        echo -e "${GREEN}Porta ${PORT}/tcp liberada no UFW.${NC}"
    else
        echo "UFW não está ativo ou não bloqueia portas locais."
    fi
else
    echo "UFW não instalado, prosseguindo..."
fi

# 6. Construir e subir containers
echo -e "\n${YELLOW}=== [5/5] Construindo e iniciando containers Docker (Testes) ===${NC}"
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERRO] Plugin do docker compose não localizado.${NC}"
    exit 1
fi

$DOCKER_COMPOSE_CMD down 2>/dev/null || true
$DOCKER_COMPOSE_CMD up -d --build

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}  BASE DE TESTES PMOC GESTOR 360 INICIADA COM SUCESSO!                ${NC}"
echo -e "  Acesse no navegador: ${YELLOW}http://192.168.0.50:${PORT}${NC}"
echo -e "  Container DB:        ${GREEN}pmoc_gestor_db (MariaDB 10.11)${NC}"
echo -e "  Container Backend:   ${GREEN}pmoc_gestor_api (Node.js)${NC}"
echo -e "  Container Frontend:  ${GREEN}pmoc_gestor_web (Nginx)${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Para importar os dados reais da produção, utilize o script:"
echo -e "  ${YELLOW}./scripts/restore_test.sh <arquivo_backup.sql>${NC}\n"
