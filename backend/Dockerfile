# ==========================================================================
# FastAPI Backend Dockerfile
# ==========================================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for database..."\n\
while ! pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER; do\n\
  sleep 1\n\
done\n\
echo "Database is ready!"\n\
\n\
echo "Running database migrations..."\n\
alembic upgrade head\n\
\n\
echo "Starting FastAPI server..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run startup script
CMD ["/app/start.sh"]
