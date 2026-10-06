#!/bin/bash
# ==============================================================================
# PMOC Gestor 360 - Script de Backup da Base de Produção
# Executar no servidor de PRODUÇÃO (10.10.19.4)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  PMOC GESTOR 360 - EXPORTAÇÃO DA BASE DE PRODUÇÃO                    ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_CONTAINER="pmoc_gestor_db"
DB_NAME="${DB_NAME:-pmoc_db}"
DB_USER="root"
DB_PASS="${DB_ROOT_PASSWORD:-pmoc_root_password_2026}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pmoc_prod_backup_${TIMESTAMP}.sql"

# Verificar se container do banco está em execução
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo -e "${RED}[ERRO] Container ${DB_CONTAINER} não está em execução.${NC}"
    echo "Verifique se o sistema está rodando com 'docker ps'."
    exit 1
fi

echo -e "\n${YELLOW}=== Gerando dump da base de dados ($DB_NAME) sem travar tabelas... ===${NC}"
docker exec "${DB_CONTAINER}" mysqldump \
    -u "${DB_USER}" \
    -p"${DB_PASS}" \
    --default-character-set=utf8mb4 \
    --single-transaction \
    --quick \
    --databases "${DB_NAME}" > "${BACKUP_FILE}"

SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo -e "${GREEN}✓ Backup gerado com sucesso!${NC}"
echo -e "  Arquivo: ${YELLOW}${BACKUP_FILE}${NC} (Tamanho: ${SIZE})"
echo -e "\n${BLUE}======================================================================${NC}"
echo -e "Próximo passo: Copiar o arquivo para a máquina de testes (192.168.0.50):"
echo -e "${YELLOW}scp ${BACKUP_FILE} usuario@192.168.0.50:/opt/pmoc_gestor/${NC}"
echo -e "${BLUE}======================================================================${NC}\n"
