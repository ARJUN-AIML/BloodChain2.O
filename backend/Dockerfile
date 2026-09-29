# ===================================================
# BloodChain Backend Service Dockerfile
# Python Runtime: 3.12-slim (Debian Bookworm)
# ===================================================

FROM python:3.12-slim

# Prevent Python from writing bytecode and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies required for PostgreSQL, C extensions, and health probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages (Docker layer cache optimization)
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy complete backend application code (including trained ML models & seed datasets)
COPY . /app/

# Ensure entrypoint is executable
RUN chmod +x /app/docker-entrypoint.sh

# Create non-root system user and configure permissions for write paths
RUN groupadd -r bloodchain && useradd -r -g bloodchain -d /app -s /sbin/nologin bloodchain && \
    mkdir -p /app/staticfiles /app/media /app/ml_models && \
    chown -R bloodchain:bloodchain /app

# Switch to non-root user for security
USER bloodchain

# Expose backend port
EXPOSE 8000

# Docker Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "config.wsgi:application"]
