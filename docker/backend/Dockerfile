# =================================
# OBREIRO DIGITAL - BACKEND DOCKERFILE
# =================================

FROM python:3.11-slim AS base

# Configurações do Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar e instalar requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =================================
# DEVELOPMENT STAGE
# =================================
FROM base AS development

# Copiar código fonte
COPY backend/ .

# Copiar script de inicialização para dev também
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expor porta
EXPOSE 8000

# Entry point e comando para desenvolvimento
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# =================================
# PRODUCTION STAGE
# =================================
FROM base AS production

# Copiar código fonte
COPY backend/ .

# Copiar script de inicialização
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Criar usuário não-root para produção
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expor porta
EXPOSE 8000

# Entry point e comando
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "config.wsgi:application"]