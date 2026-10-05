#!/bin/bash
# ==============================================================================
# Script de Deploy e Inicialização - PMOC Gestor 360 (Rocky Linux)
# MariaDB + Node.js API (Active Directory LDAP) + Nginx
# ==============================================================================

set -e

echo "=== [1/5] Verificando requisitos no Rocky Linux ==="
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não está instalado. Instale o Docker antes de continuar."
    exit 1
fi

echo "=== [2/5] Configurando variáveis de ambiente (.env) ==="
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Arquivo .env criado a partir de .env.example."
else
    echo "Arquivo .env já existente."
fi

echo "=== [3/5] Ajustando permissões e SELinux no Rocky Linux ==="
sudo chown -R $USER:$USER /opt/pmoc_gestor 2>/dev/null || true
find /opt/pmoc_gestor -type d -exec chmod 755 {} + 2>/dev/null || true
find /opt/pmoc_gestor -type f -exec chmod 644 {} + 2>/dev/null || true
chcon -Rt container_file_t /opt/pmoc_gestor/public 2>/dev/null || true

echo "=== [4/5] Liberando porta 8081 no Firewall (Firewalld) ==="
if systemctl is-active --quiet firewalld 2>/dev/null; then
    sudo firewall-cmd --permanent --add-port=8081/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo "Porta 8081 liberada no firewalld."
fi

echo "=== [5/5] Construindo e iniciando containers Docker ==="
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
else
    docker compose down 2>/dev/null || true
    docker compose up -d --build
fi

echo ""
echo "======================================================================"
echo "  PMOC GESTOR 360 INICIADO COM SUCESSO!"
echo "  Endereço de Acesso: http://10.10.19.2:8081"
echo "  Banco de Dados: MariaDB (Container dedicado)"
echo "  Autenticação: Active Directory LDAP (BSFS.LOCAL)"
echo "======================================================================"
