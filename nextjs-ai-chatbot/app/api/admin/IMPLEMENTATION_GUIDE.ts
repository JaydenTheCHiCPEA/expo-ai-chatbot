/**
 * Backend API Routes for Source Material Management
 * 
 * This document describes the new API endpoints that need to be implemented
 * in the Next.js backend for managing AI source material and system prompts.
 * 
 * These are ADMIN ONLY endpoints that should require authentication.
 * 
 * Location: nextjs-ai-chatbot/app/api/admin/
 */

/**
 * POST /api/admin/source-materials
 * Create a new source material
 * 
 * Request body:
 * {
 *   "title": string,
 *   "content": string,
 *   "category": string,
 *   "priority": "low" | "medium" | "high"
 * }
 * 
 * Response: SourceMaterial
 * 
 * Implementation notes:
 * - Store in database with timestamp
 * - Validate content length (max 50000 chars)
 * - Index for fast retrieval
 * - Support categories like "documentation", "policies", "technical"
 */

/**
 * GET /api/admin/source-materials
 * List all source materials
 * 
 * Query params:
 * - category?: filter by category
 * - enabled?: filter by enabled status
 * 
 * Response: SourceMaterial[]
 */

/**
 * GET /api/admin/source-materials/:id
 * Get a specific source material
 * 
 * Response: SourceMaterial
 */

/**
 * PATCH /api/admin/source-materials/:id
 * Update source material
 * 
 * Request body: Partial<SourceMaterial>
 * 
 * Response: SourceMaterial
 */

/**
 * DELETE /api/admin/source-materials/:id
 * Delete source material
 * 
 * Response: 204 No Content
 */

/**
 * GET /api/admin/system-prompt
 * Get current system prompt configuration
 * 
 * Response:
 * {
 *   "id": string,
 *   "name": string,
 *   "instructions": string,
 *   "sourceMaterials": string[], // Array of material IDs
 *   "model": string,
 *   "temperature": number,
 *   "enabled": boolean,
 *   "createdAt": string,
 *   "updatedAt": string
 * }
 * 
 * Implementation notes:
 * - This combines hardcoded instructions with linked source materials
 * - Dynamically constructs the full prompt by:
 *   1. Loading the base instructions
 *   2. Fetching all enabled source materials
 *   3. Concatenating them in priority order
 *   4. Returning to client as the full system prompt
 */

/**
 * PATCH /api/admin/system-prompt
 * Update system prompt configuration
 * 
 * Request body: Partial<SystemPromptConfig>
 * 
 * Response: SystemPromptConfig
 * 
 * Implementation notes:
 * - Allows updating instructions without redeploying
 * - Updates model and temperature parameters
 * - Can enable/disable the prompt
 */

/**
 * POST /api/admin/system-prompt/:id/materials
 * Link source materials to a prompt
 * 
 * Request body:
 * {
 *   "materialIds": string[]
 * }
 * 
 * Response: SystemPromptConfig
 */

/**
 * GET /api/debug/ai-context
 * Debug endpoint to see current AI context
 * Returns metadata about the current prompt configuration
 * 
 * Response:
 * {
 *   "promptVersion": string,
 *   "sourceMaterialCount": number,
 *   "totalContentLength": number,
 *   "activeCategories": string[],
 *   "lastUpdated": string
 * }
 * 
 * Implementation notes:
 * - Useful for debugging prompt context
 * - Only for admin/debugging purposes
 * - Shows size of current knowledge base
 */

/**
 * POST /api/admin/source-materials/validate
 * Validate source material before saving
 * 
 * Request body:
 * {
 *   "content": string,
 *   "title": string
 * }
 * 
 * Response:
 * {
 *   "valid": boolean,
 *   "errors": string[],
 *   "warnings": string[]
 * }
 * 
 * Implementation notes:
 * - Check for max length
 * - Check for required fields
 * - Warn if content seems malformed
 */

/**
 * IMPLEMENTATION GUIDE
 * 
 * 1. Update the chat API route to use source materials:
 * 
 * app/(chat)/api/chat/route.ts:
 * - Before sending message to AI, fetch all enabled source materials
 * - Construct full system prompt with materials
 * - Pass complete prompt to AI model
 * 
 * Example:
 * ```typescript
 * const sourceMaterials = await db.sourceMaterial.findMany({
 *   where: { enabled: true },
 *   orderBy: { priority: 'desc' }
 * });
 * 
 * const fullSystemPrompt = constructPrompt(baseInstructions, sourceMaterials);
 * ```
 * 
 * 2. Database schema required:
 * 
 * Table: source_materials
 * - id: string (primary key)
 * - title: string
 * - content: string (max 50000)
 * - category: string
 * - priority: enum('low', 'medium', 'high')
 * - enabled: boolean
 * - createdAt: timestamp
 * - updatedAt: timestamp
 * - deletedAt: timestamp (soft delete)
 * 
 * Table: system_prompts
 * - id: string (primary key)
 * - name: string
 * - instructions: text
 * - model: string
 * - temperature: decimal
 * - enabled: boolean
 * - createdAt: timestamp
 * - updatedAt: timestamp
 * 
 * Table: prompt_materials (junction)
 * - promptId: string (foreign key)
 * - materialId: string (foreign key)
 * 
 * 3. Environment variables for backend:
 * 
 * Add to .env:
 * ENABLE_SOURCE_MATERIALS=true
 * MAX_MATERIAL_SIZE=50000
 * MAX_MATERIALS_PER_PROMPT=50
 */

export {};
