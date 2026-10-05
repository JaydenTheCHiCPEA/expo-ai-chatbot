/**
 * Source Material Management for AI Context
 * 
 * Developers can use this API to manage knowledge bases and source material
 * for the AI without modifying core prompt files or redeploying
 */

import { apiClient } from "./api-client";

export interface SourceMaterial {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemPromptConfig {
  id: string;
  name: string;
  instructions: string;
  sourceMaterials: string[]; // Array of SourceMaterial IDs
  model: string;
  temperature: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add or update source material
 * Used by developers to inject knowledge into the AI system
 * 
 * @example
 * ```typescript
 * await addSourceMaterial({
 *   title: "Company Handbook",
 *   content: "Welcome to our company...",
 *   category: "internal",
 *   priority: "high"
 * });
 * ```
 */
export async function addSourceMaterial(data: {
  title: string;
  content: string;
  category: string;
  priority?: "low" | "medium" | "high";
}): Promise<SourceMaterial> {
  return apiClient.json("/api/admin/source-materials", {
    method: "POST",
    body: {
      ...data,
      priority: data.priority || "medium",
    },
  });
}

/**
 * Get all source materials
 */
export async function getSourceMaterials(): Promise<SourceMaterial[]> {
  return apiClient.json("/api/admin/source-materials");
}

/**
 * Get source material by ID
 */
export async function getSourceMaterial(
  id: string,
): Promise<SourceMaterial> {
  return apiClient.json(`/api/admin/source-materials/${id}`);
}

/**
 * Update source material
 */
export async function updateSourceMaterial(
  id: string,
  data: Partial<SourceMaterial>,
): Promise<SourceMaterial> {
  return apiClient.json(`/api/admin/source-materials/${id}`, {
    method: "PATCH",
    body: data,
  });
}

/**
 * Delete source material
 */
export async function deleteSourceMaterial(id: string): Promise<void> {
  await apiClient.fetch(`/api/admin/source-materials/${id}`, {
    method: "DELETE",
  });
}

/**
 * Get current system prompt configuration
 */
export async function getSystemPrompt(): Promise<SystemPromptConfig> {
  return apiClient.json("/api/admin/system-prompt");
}

/**
 * Update system prompt and instructions
 */
export async function updateSystemPrompt(
  data: Partial<SystemPromptConfig>,
): Promise<SystemPromptConfig> {
  return apiClient.json("/api/admin/system-prompt", {
    method: "PATCH",
    body: data,
  });
}

/**
 * Link source materials to a prompt
 */
export async function linkSourceMaterials(
  promptId: string,
  materialIds: string[],
): Promise<SystemPromptConfig> {
  return apiClient.json(`/api/admin/system-prompt/${promptId}/materials`, {
    method: "POST",
    body: { materialIds },
  });
}

/**
 * Get debug information about current AI context
 * Useful for developers to see how much knowledge the AI has access to
 */
export async function getAIContextDebugInfo(): Promise<{
  promptVersion: string;
  sourceMaterialCount: number;
  totalContentLength: number;
  activeCategories: string[];
  lastUpdated: string;
}> {
  return apiClient.json("/api/debug/ai-context");
}

/**
 * Validate new source material before saving
 */
export async function validateSourceMaterial(data: {
  content: string;
  title: string;
}): Promise<{
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}> {
  return apiClient.json("/api/admin/source-materials/validate", {
    method: "POST",
    body: data,
  });
}
