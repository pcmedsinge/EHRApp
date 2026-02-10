# ICD-10 Code Update Strategy

## Problem Statement
ICD-10 codes are updated annually (October) by WHO and local health authorities. Our application needs a strategy to keep codes current without disrupting existing diagnoses.

## Current Implementation (Phase 3C)

### What We Have
- Local PostgreSQL table: `icd10_codes`
- 89 manually seeded codes (common Indian diagnoses)
- No version tracking
- No update mechanism
- Static data

### Limitations
- ❌ No automatic updates
- ❌ No code deprecation handling
- ❌ No version history
- ❌ Manual maintenance required
- ❌ Risk of using outdated codes

## Update Sources

### 1. WHO ICD API (Recommended)
- **URL**: https://icd.who.int/icdapi
- **Access**: Free API with registration
- **Coverage**: ICD-10, ICD-11
- **Format**: JSON, XML
- **Update Frequency**: Annual (October)
- **Features**: 
  - Full code hierarchy
  - Multiple languages
  - Search capability
  - Code validation

### 2. National Health Portal India
- **Source**: NHP India / MOHFW
- **Coverage**: ICD-10 with Indian adaptations
- **Format**: May require web scraping
- **Update Frequency**: Follows WHO

### 3. Commercial Providers
- **Options**: SNOMED CT, UMLS, MediCode
- **Cost**: Licensing fees
- **Coverage**: Comprehensive
- **Support**: Professional support

## Proposed Solution: Hybrid Approach

### Phase 1: Enhanced Local Storage (IMMEDIATE)

#### 1.1 Add Version Tracking
```sql
-- Migration: Add version fields to icd10_codes table
ALTER TABLE icd10_codes ADD COLUMN valid_from DATE;
ALTER TABLE icd10_codes ADD COLUMN valid_until DATE;
ALTER TABLE icd10_codes ADD COLUMN is_deprecated BOOLEAN DEFAULT FALSE;
ALTER TABLE icd10_codes ADD COLUMN icd_version VARCHAR(20); -- e.g., "ICD-10-2024"
ALTER TABLE icd10_codes ADD COLUMN replacement_code VARCHAR(10); -- If deprecated
```

#### 1.2 Create ICD-10 Update Log Table
```sql
CREATE TABLE icd10_update_logs (
    id UUID PRIMARY KEY,
    update_date DATE NOT NULL,
    icd_version VARCHAR(20),
    codes_added INTEGER,
    codes_updated INTEGER,
    codes_deprecated INTEGER,
    source VARCHAR(100), -- 'WHO_API', 'MANUAL', 'NHP_INDIA'
    update_file TEXT, -- JSON metadata
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.3 Modify Diagnosis Validation
```python
# In diagnosis_service.py
async def validate_icd10_code(db: AsyncSession, code: str):
    """Validate ICD-10 code is current and not deprecated"""
    icd10 = await ICD10Service.get_code_details(db, code)
    
    if not icd10:
        raise HTTPException(400, f"Invalid ICD-10 code: {code}")
    
    if icd10.is_deprecated:
        warning = f"Code {code} is deprecated."
        if icd10.replacement_code:
            warning += f" Use {icd10.replacement_code} instead."
        # Log warning but allow (existing diagnoses use old codes)
        logger.warning(warning)
        return icd10, warning
    
    return icd10, None
```

### Phase 2: Manual Update System (SHORT-TERM)

#### 2.1 Update Script Template
```python
# backend/scripts/update_icd10_codes.py
"""
Manual ICD-10 code update script
Usage: python scripts/update_icd10_codes.py --file icd10_2024.json --version ICD-10-2024
"""

import asyncio
import json
from datetime import date
from app.core.database import AsyncSessionLocal
from app.models.icd10_code import ICD10Code

async def update_codes(file_path: str, version: str):
    """
    Update ICD-10 codes from JSON file
    
    File format:
    {
        "version": "ICD-10-2024",
        "release_date": "2024-10-01",
        "codes": [
            {
                "code": "U07.1",
                "description": "COVID-19",
                "category": "Emergency codes",
                "action": "add" | "update" | "deprecate",
                "replacement": "U07.2" (optional)
            }
        ]
    }
    """
    async with AsyncSessionLocal() as db:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        stats = {"added": 0, "updated": 0, "deprecated": 0}
        
        for code_data in data['codes']:
            if code_data['action'] == 'add':
                # Add new code
                new_code = ICD10Code(
                    code=code_data['code'],
                    description=code_data['description'],
                    category=code_data.get('category'),
                    icd_version=version,
                    valid_from=date.today()
                )
                db.add(new_code)
                stats['added'] += 1
                
            elif code_data['action'] == 'deprecate':
                # Mark as deprecated
                result = await db.execute(
                    select(ICD10Code).where(ICD10Code.code == code_data['code'])
                )
                code = result.scalar_one_or_none()
                if code:
                    code.is_deprecated = True
                    code.valid_until = date.today()
                    code.replacement_code = code_data.get('replacement')
                    stats['deprecated'] += 1
        
        await db.commit()
        print(f"✅ Update complete: {stats}")
```

#### 2.2 Annual Update Process
1. **October**: WHO releases new ICD-10 codes
2. **Download**: Get update file from WHO API or website
3. **Transform**: Convert to our JSON format
4. **Review**: Medical team reviews changes
5. **Test**: Apply to staging database
6. **Deploy**: Run update script in production
7. **Notify**: Alert users about new codes

### Phase 3: API Integration (LONG-TERM)

#### 3.1 WHO ICD API Integration
```python
# backend/app/services/icd_api_service.py
"""
Integration with WHO ICD API
Requires API key from https://icd.who.int/icdapi
"""

import httpx
from typing import List, Optional

class WHOICDAPIService:
    BASE_URL = "https://id.who.int/icd/release/10"
    
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._token = None
    
    async def authenticate(self):
        """Get OAuth2 token from WHO"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://icdaccessmanagement.who.int/connect/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "scope": "icdapi_access",
                    "grant_type": "client_credentials"
                }
            )
            self._token = response.json()['access_token']
    
    async def search_codes(self, query: str) -> List[dict]:
        """Search ICD-10 codes via WHO API"""
        if not self._token:
            await self.authenticate()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search",
                params={"q": query},
                headers={"Authorization": f"Bearer {self._token}"}
            )
            return response.json()
    
    async def get_code_details(self, code: str) -> dict:
        """Get full details for a code"""
        if not self._token:
            await self.authenticate()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/{code}",
                headers={"Authorization": f"Bearer {self._token}"}
            )
            return response.json()
    
    async def sync_latest_codes(self):
        """Sync all updates from WHO API"""
        # Download full code list
        # Compare with local database
        # Update differences
        pass
```

#### 3.2 Scheduled Update Job
```python
# backend/app/tasks/icd_sync.py
"""
Celery/APScheduler task for automatic ICD-10 sync
Runs monthly to check for updates
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler

async def sync_icd10_codes():
    """
    Monthly task to sync ICD-10 codes
    - Check WHO API for updates
    - Download new codes
    - Update local database
    - Send notification to admins
    """
    api = WHOICDAPIService(
        client_id=settings.WHO_API_CLIENT_ID,
        client_secret=settings.WHO_API_CLIENT_SECRET
    )
    
    try:
        updates = await api.sync_latest_codes()
        
        # Log update
        async with AsyncSessionLocal() as db:
            log = ICD10UpdateLog(
                update_date=date.today(),
                icd_version=updates['version'],
                codes_added=updates['added'],
                codes_updated=updates['updated'],
                codes_deprecated=updates['deprecated'],
                source='WHO_API'
            )
            db.add(log)
            await db.commit()
        
        # Notify admins
        await send_notification(
            "ICD-10 codes updated",
            f"Updated {updates['added']} codes from WHO API"
        )
    except Exception as e:
        logger.error(f"ICD-10 sync failed: {e}")

# Schedule job
scheduler = AsyncIOScheduler()
scheduler.add_job(
    sync_icd10_codes,
    'cron',
    day=1,  # First day of month
    hour=2  # 2 AM
)
```

### Phase 4: Advanced Features

#### 4.1 Code Validation Endpoint
```python
@router.get("/validate/{code}")
async def validate_code(
    code: str,
    date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate if ICD-10 code is valid for a specific date
    Useful for historical diagnoses
    """
    result = await ICD10Service.validate_code_for_date(db, code, date or date.today())
    return {
        "code": code,
        "valid": result.is_valid,
        "deprecated": result.is_deprecated,
        "replacement": result.replacement_code,
        "message": result.message
    }
```

#### 4.2 Code Migration Tool
```python
@router.post("/migrate-deprecated")
async def migrate_deprecated_codes(
    dry_run: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Migrate all diagnoses using deprecated codes to new codes
    dry_run=True: Show what would change
    dry_run=False: Actually update
    """
    deprecated_codes = await db.execute(
        select(ICD10Code).where(ICD10Code.is_deprecated == True)
    )
    
    migrations = []
    for code in deprecated_codes.scalars():
        if code.replacement_code:
            diagnoses = await db.execute(
                select(Diagnosis).where(Diagnosis.icd10_code == code.code)
            )
            for diagnosis in diagnoses.scalars():
                migrations.append({
                    "diagnosis_id": diagnosis.id,
                    "old_code": code.code,
                    "new_code": code.replacement_code
                })
                
                if not dry_run:
                    diagnosis.icd10_code = code.replacement_code
                    diagnosis.notes = f"[Migrated from {code.code}] " + (diagnosis.notes or "")
    
    if not dry_run:
        await db.commit()
    
    return {"migrations": migrations, "dry_run": dry_run}
```

## Implementation Roadmap

### Immediate (Phase 3C - Current)
- [x] Basic local storage
- [x] 89 common codes seeded
- [x] Search functionality

### Short-term (1-2 months)
- [ ] Add version tracking fields (migration)
- [ ] Create update log table
- [ ] Implement manual update script
- [ ] Add deprecation warnings in UI
- [ ] Load full ICD-10 dataset (~14,000 codes)

### Medium-term (3-6 months)
- [ ] WHO API integration
- [ ] Admin dashboard for code management
- [ ] Code validation endpoint
- [ ] Deprecation migration tool
- [ ] Historical code lookup

### Long-term (6-12 months)
- [ ] Automatic scheduled sync
- [ ] Multi-version support
- [ ] ICD-11 preparation
- [ ] AI-powered code suggestion
- [ ] Integration with national registries

## Configuration

### Environment Variables
```env
# WHO ICD API (optional)
WHO_API_CLIENT_ID=your_client_id
WHO_API_CLIENT_SECRET=your_secret
WHO_API_ENABLED=false  # Enable when ready

# Update schedule
ICD10_AUTO_UPDATE=false  # Enable automatic updates
ICD10_UPDATE_SCHEDULE="0 2 1 * *"  # Cron: 2 AM, 1st of month
ICD10_UPDATE_NOTIFICATION_EMAIL=admin@hospital.in
```

## Best Practices

### 1. Never Delete Old Codes
- Mark as deprecated, don't delete
- Existing diagnoses reference old codes
- Historical data integrity is critical

### 2. Version Everything
- Track when codes were added/changed
- Allow historical lookups
- Audit trail for compliance

### 3. Notify Users
- Alert when using deprecated codes
- Suggest replacements
- Admin notifications on updates

### 4. Test Updates
- Always test on staging first
- Review medical accuracy
- Check for breaking changes

### 5. Maintain Audit Trail
- Log all code updates
- Track who made changes
- Document rationale

## Security Considerations

1. **API Key Management**: Store WHO API credentials securely (vault/secrets manager)
2. **Update Authorization**: Only admins can trigger updates
3. **Backup Before Update**: Always backup database before code updates
4. **Rate Limiting**: Respect WHO API rate limits
5. **Data Validation**: Validate all data from external sources

## Compliance

### India-Specific Requirements
- **ABDM Compliance**: Align with Ayushman Bharat Digital Mission standards
- **NHA Guidelines**: Follow National Health Authority recommendations
- **NABH Standards**: Meet hospital accreditation requirements
- **CGHS Coding**: Support Central Government Health Scheme codes

## Conclusion

**Recommendation for Your Project:**

1. **Now (Phase 3C)**: Continue with local storage (89 codes is fine for MVP)
2. **Next Sprint**: Add version tracking fields and deprecation handling
3. **3 Months**: Implement manual update script and load full dataset
4. **6 Months**: WHO API integration for automatic updates

The current implementation is **sufficient for initial deployment** but should be enhanced with version tracking within 2-3 months.

---

**Date**: February 4, 2026  
**Status**: Enhancement Plan - Not Yet Implemented  
**Priority**: Medium (Short-term enhancement)
