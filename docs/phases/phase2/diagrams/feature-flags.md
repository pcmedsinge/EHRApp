# Feature Flags System

## Overview

```mermaid
flowchart TB
    subgraph Database["Database (system_settings)"]
        Settings["key | value | category<br/>VISIT_QUEUE_ENABLED | false | features<br/>VISIT_SCHEDULING_ENABLED | false | features"]
    end

    subgraph Backend["Backend API"]
        SettingsAPI["/api/v1/settings/features"]
    end

    subgraph Frontend["Frontend"]
        FlagsHook["useFeatureFlags()"]
        subgraph Components["Conditional Rendering"]
            QueueMenu["Queue Menu Item"]
            QueuePage["Queue Page"]
            ScheduleBtn["Schedule Button"]
        end
    end

    Database --> SettingsAPI
    SettingsAPI --> FlagsHook
    FlagsHook --> Components
```

## SystemSetting Model

```mermaid
classDiagram
    class SystemSetting {
        +UUID id
        +String key
        +String value
        +String description
        +String category
        +DateTime created_at
        +DateTime updated_at
    }

    class DefaultSettings {
        <<constant>>
        VISIT_QUEUE_ENABLED: false
        VISIT_SCHEDULING_ENABLED: false
        DEFAULT_VISIT_TYPE: consultation
        DEFAULT_PRIORITY: normal
    }
```

## Feature Flag Flow

```mermaid
sequenceDiagram
    participant App as React App
    participant Hook as useFeatureFlags()
    participant Cache as React Query Cache
    participant API as /settings/features
    participant DB as Database

    App->>Hook: useFeatureFlags()
    Hook->>Cache: Check cache
    
    alt Cache Hit
        Cache-->>Hook: Cached flags
    else Cache Miss
        Hook->>API: GET /api/v1/settings/features
        API->>DB: SELECT * FROM system_settings<br/>WHERE category = 'features'
        DB-->>API: [{ key, value }, ...]
        API-->>Hook: FeatureFlagsResponse
        Hook->>Cache: Store in cache (5 min TTL)
    end

    Hook-->>App: { isQueueEnabled, isSchedulingEnabled }
```

## Conditional Rendering

```tsx
// Frontend usage pattern

function Sidebar() {
  const { isQueueEnabled } = useFeatureFlags();

  return (
    <Menu>
      <Menu.Item key="dashboard">Dashboard</Menu.Item>
      <Menu.Item key="patients">Patients</Menu.Item>
      
      <Menu.SubMenu key="visits" title="Visits">
        <Menu.Item key="visits-list">All Visits</Menu.Item>
        <Menu.Item key="visits-create">New Visit</Menu.Item>
        
        {/* Only show when Queue feature is enabled */}
        {isQueueEnabled && (
          <Menu.Item key="visits-queue">
            Today's Queue
          </Menu.Item>
        )}
      </Menu.SubMenu>
    </Menu>
  );
}
```

## Default Flags (OFF)

| Flag | Default | When Enabled |
|------|---------|--------------|
| `VISIT_QUEUE_ENABLED` | `false` | Shows queue menu, queue page, real-time updates |
| `VISIT_SCHEDULING_ENABLED` | `false` | Allows future date booking, shows calendar |

## Admin API

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant UI as Settings Page
    participant API as PUT /settings/{key}
    participant DB as Database

    Admin->>UI: Toggle "Enable Queue"
    UI->>API: PUT /api/v1/settings/VISIT_QUEUE_ENABLED<br/>{ value: "true" }
    API->>API: Verify admin role
    API->>DB: UPDATE system_settings<br/>SET value = 'true'
    DB-->>API: Updated
    API-->>UI: Success
    UI->>UI: Invalidate flags cache
    UI-->>Admin: Feature enabled!
```

## Category Groupings

| Category | Purpose | Example Keys |
|----------|---------|--------------|
| `features` | Toggle UI features | VISIT_QUEUE_ENABLED |
| `defaults` | Default values | DEFAULT_VISIT_TYPE |
| `limits` | System limits | MAX_VISITS_PER_DAY |
| `display` | UI settings | DATE_FORMAT |

## Security

- **Read**: All authenticated users can read feature flags
- **Write**: Only admin users can modify settings
- **Cache**: Frontend caches for 5 minutes to reduce API calls

---

*Last Updated: January 31, 2026*
