#!/bin/bash
# ==============================================================================
# PMOC Gestor 360 - Script de Restauração / Importação na Base de Testes
# Executar no servidor de TESTES (192.168.0.50)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  PMOC GESTOR 360 - RESTAURAÇÃO DE DADOS NA BASE DE TESTES (UBUNTU)   ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_CONTAINER="pmoc_gestor_db"
API_CONTAINER="pmoc_gestor_api"
DB_NAME="${DB_NAME:-pmoc_db}"
DB_USER="root"
DB_PASS="${DB_ROOT_PASSWORD:-pmoc_root_password_2026}"

# Determinar arquivo de backup a ser importado
BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
    # Procurar o arquivo de backup mais recente no diretório atual
    BACKUP_FILE=$(ls -t pmoc_prod_backup_*.sql 2>/dev/null | head -n 1 || true)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}[ERRO] Nenhum arquivo .sql fornecido ou encontrado.${NC}"
    echo -e "Uso: ${YELLOW}./scripts/restore_test.sh <caminho_do_arquivo.sql>${NC}"
    echo -e "Exemplo: ./scripts/restore_test.sh pmoc_prod_backup_20261006_090000.sql"
    exit 1
fi

# Verificar se container do banco está em execução
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo -e "${RED}[ERRO] Container ${DB_CONTAINER} não está ativo.${NC}"
    echo "Execute primeiro './scripts/setup_ubuntu_test.sh' ou 'docker compose up -d'."
    exit 1
fi

echo -e "\n${YELLOW}=== Importando ${BACKUP_FILE} no banco de dados '${DB_NAME}' do container de testes... ===${NC}"

docker exec -i "${DB_CONTAINER}" mysql \
    -u "${DB_USER}" \
    -p"${DB_PASS}" \
    --default-character-set=utf8mb4 \
    "${DB_NAME}" < "${BACKUP_FILE}"

echo -e "${GREEN}✓ Importação concluída com sucesso!${NC}"

# Reiniciar a API para recarregar conexões e integridade
if docker ps --format '{{.Names}}' | grep -q "^${API_CONTAINER}$"; then
    echo -e "\n${YELLOW}=== Reiniciando API Node.js para sincronizar pools de conexão... ===${NC}"
    docker restart "${API_CONTAINER}"
    echo -e "${GREEN}✓ API reiniciada.${NC}"
fi

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}  BASE DE TESTES PRONTA E SINCRONIZADA COM DADOS DE PRODUÇÃO!        ${NC}"
echo -e "  Acesse no navegador: ${YELLOW}http://192.168.0.50:${APP_PORT:-8081}${NC}"
echo -e "${BLUE}======================================================================${NC}\n"
