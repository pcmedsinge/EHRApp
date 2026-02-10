/**
 * Settings Service
 * ================
 * 
 * Purpose:
 *   API client for system settings and feature flags.
 * 
 * Module: src/services/settingsService.ts
 * Phase: 2C (Frontend - Visit Service)
 * 
 * References:
 *   - Feature Flags: docs/phases/phase2/diagrams/feature-flags.md
 *   - Backend API: app/api/v1/settings/router.py
 * 
 * Used By:
 *   - src/hooks/useSettings.ts
 *   - src/contexts/FeatureFlagsContext.tsx
 */

import api from './api';
import type { FeatureFlags } from '@/types';

// =============================================================================
// SETTINGS SERVICE CLASS
// =============================================================================

class SettingsService {
  /**
   * Get feature flags for frontend
   */
  async getFeatureFlags(): Promise<FeatureFlags> {
    const response = await api.get<FeatureFlags>('/settings/features');
    return response.data;
  }

  /**
   * Get all system settings (admin only)
   */
  async getAllSettings(): Promise<Record<string, string>> {
    const response = await api.get<Array<{ key: string; value: string }>>('/settings/');
    const settings: Record<string, string> = {};
    response.data.forEach(s => {
      settings[s.key] = s.value;
    });
    return settings;
  }

  /**
   * Update a setting (admin only)
   */
  async updateSetting(key: string, value: string): Promise<void> {
    await api.put(`/settings/${key}`, { value });
  }
}

// Export singleton instance
const settingsService = new SettingsService();
export default settingsService;
