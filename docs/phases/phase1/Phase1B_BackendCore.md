# Phase 1B: Backend Core

**Sub-Phase:** 1B  
**Estimated Time:** 3-4 hours  
**Prerequisites:** Phase 1A Complete

---

## 1. Objective

Set up FastAPI application skeleton with database connection, configuration management, and health check endpoint.

---

## 2. Deliverables

- [ ] FastAPI application with CORS
- [ ] Pydantic settings management
- [ ] SQLAlchemy async database connection
- [ ] Alembic configuration
- [ ] Base SQLAlchemy model
- [ ] Health check endpoint
- [ ] Working Swagger UI

---

## 3. Files to Create

```
backend/app/
├── main.py                    # FastAPI application
├── core/
│   ├── config.py              # Settings management
│   ├── database.py            # Database connection
│   └── __init__.py
├── models/
│   ├── base.py                # Base model class
│   └── __init__.py
└── api/
    └── v1/
        ├── __init__.py
        └── router.py          # API router aggregator

backend/
├── alembic.ini                # Alembic config
└── alembic/
    ├── env.py                 # Alembic environment
    └── script.py.mako         # Migration template
```

---

## 4. Implementation

### Step 1: Configuration Management

File: `backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "EHR System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Orthanc
    ORTHANC_URL: str = "http://localhost:8042"
    ORTHANC_USERNAME: str = "ehr"
    ORTHANC_PASSWORD: str = "ehr_password"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Global settings instance
settings = Settings()
```

### Step 2: Database Connection

File: `backend/app/core/database.py`

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session.
    
    Usage:
        @app.get("/items")
        async def read_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connection"""
    await engine.dispose()
```

### Step 3: Base Model

File: `backend/app/models/base.py`

```python
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class BaseModel(Base):
    """
    Base model class with common fields.
    All models should inherit from this.
    """
    __abstract__ = True
    
    id = Column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
```

### Step 4: FastAPI Application

File: `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📊 Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    print(f"🔒 Debug mode: {settings.DEBUG}")
    
    # Initialize database (optional - Alembic will handle this)
    # await init_db()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Electronic Health Record System API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        },
        status_code=200,
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


# Include API router (will be created in Phase 1C)
# app.include_router(api_router, prefix="/api/v1")
```

### Step 5: API Router Placeholder

File: `backend/app/api/v1/router.py`

```python
from fastapi import APIRouter

# Create API router
api_router = APIRouter()

# Routers will be included here as they are created
# Example (Phase 1C):
# from app.api.v1.auth import router as auth_router
# api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
```

### Step 6: Alembic Configuration

File: `backend/alembic.ini`

```ini
# A generic, single database configuration.

[alembic]
# path to migration scripts
script_location = alembic

# template used to generate migration file names; The default value is %%(rev)s_%%(slug)s
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s

# sys.path path, will be prepended to sys.path if present.
prepend_sys_path = .

# timezone to use when rendering the date within the migration file
# as well as the filename.
# If specified, requires the python-dateutil library that can be
# installed by adding `alembic[tz]` to the pip requirements
# string value is passed to dateutil.tz.gettz()
# leave blank for localtime
# timezone =

# max length of characters to apply to the
# "slug" field
# truncate_slug_length = 40

# set to 'true' to run the environment during
# the 'revision' command, regardless of autogenerate
# revision_environment = false

# set to 'true' to allow .pyc and .pyo files without
# a source .py file to be detected as revisions in the
# versions/ directory
# sourceless = false

# version location specification; This defaults
# to alembic/versions.  When using multiple version
# directories, initial revisions must be specified with --version-path.
# The path separator used here should be the separator specified by "version_path_separator" below.
# version_locations = %(here)s/bar:%(here)s/bat:alembic/versions

# version path separator; As mentioned above, this is the character used to split
# version_locations. The default within new alembic.ini files is "os", which uses os.pathsep.
# If this key is omitted entirely, it falls back to the legacy behavior of splitting on spaces and/or commas.
# Valid values for version_path_separator are:
#
# version_path_separator = :
# version_path_separator = ;
# version_path_separator = space
version_path_separator = os  # Use os.pathsep. Default configuration used for new projects.

# set to 'true' to search source files recursively
# in each "version_locations" directory
# new in Alembic version 1.10
# recursive_version_locations = false

# the output encoding used when revision files
# are written from script.py.mako
# output_encoding = utf-8

[post_write_hooks]
# post_write_hooks defines scripts or Python functions that are run
# on newly generated revision scripts.  See the documentation for further
# detail and examples

# format using "black" - use the console_scripts runner, against the "black" entrypoint
# hooks = black
# black.type = console_scripts
# black.entrypoint = black
# black.options = -l 79 REVISION_SCRIPT_FILENAME

# lint with attempts to fix using "ruff" - use the exec runner, execute a binary
# hooks = ruff
# ruff.type = exec
# ruff.executable = %(here)s/.venv/bin/ruff
# ruff.options = --fix REVISION_SCRIPT_FILENAME

# Logging configuration
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

File: `backend/alembic/env.py`

```python
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import asyncio

# Import settings and Base
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parents[2]))

from app.core.config import settings
from app.core.database import Base

# Import all models here so Alembic can detect them
from app.models.base import BaseModel  # noqa

# This is the Alembic Config object
config = context.config

# Override sqlalchemy.url from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

File: `backend/alembic/script.py.mako`

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

---

## 5. Verification Steps

```bash
# 1. Activate virtual environment
cd backend
source venv/bin/activate

# 2. Start the FastAPI application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# 🚀 Starting EHR System v1.0.0
# 📊 Database: localhost:5432/ehr_db
# 🔒 Debug mode: True
# INFO:     Application startup complete.
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)

# 3. Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "app": "EHR System",
#   "version": "1.0.0"
# }

# 4. Test root endpoint
curl http://localhost:8000/

# Expected response:
# {
#   "message": "Welcome to EHR System",
#   "version": "1.0.0",
#   "docs": "/docs"
# }

# 5. Access Swagger UI
# Open browser: http://localhost:8000/docs
# Should see FastAPI Swagger interface

# 6. Test Alembic
alembic current
# Should show: (no migrations yet)

alembic history
# Should show: (empty)
```

---

## 6. Expected Swagger UI

When you open http://localhost:8000/docs, you should see:

```
EHR System - v1.0.0

Electronic Health Record System API

Endpoints:

Health
  GET /health - Health check endpoint

Root
  GET / - Root endpoint
```

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| ModuleNotFoundError: No module named 'app' | Run from backend/ directory |
| Database connection error | Verify PostgreSQL is running: `docker ps` |
| Port 8000 in use | Change port: `uvicorn app.main:app --port 8001` |
| Import errors | Ensure __init__.py in all folders |

---

## 8. Next Sub-Phase

Once verified, proceed to **Phase 1C: Authentication Backend**

---

## 9. Checklist

- [ ] config.py created with settings
- [ ] database.py created with async connection
- [ ] Base model created
- [ ] main.py created with FastAPI app
- [ ] Alembic configured
- [ ] Server starts without errors
- [ ] /health endpoint returns 200
- [ ] /docs shows Swagger UI
- [ ] CORS configured
- [ ] Database connection pool works

---

*End of Phase 1B*
