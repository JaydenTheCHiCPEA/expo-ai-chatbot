import { z } from "zod";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const documentsPath = path.join(process.cwd(), "public", "documents");

// Cache for document content to avoid repeated file reads
const documentCache = new Map<string, { content: string; lastModified: number }>();

async function loadDocumentContent(filename: string): Promise<string> {
  const filePath = path.join(documentsPath, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const stats = fs.statSync(filePath);
  const lastModified = stats.mtimeMs;

  // Check cache
  const cached = documentCache.get(filename);
  if (cached && cached.lastModified === lastModified) {
    return cached.content;
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    let content = "";

    if (filename.endsWith(".pdf")) {
      const data = await pdf(fileBuffer);
      content = data.text;
    } else if (filename.endsWith(".txt")) {
      content = fileBuffer.toString("utf-8");
    } else if (filename.endsWith(".json")) {
      content = JSON.stringify(JSON.parse(fileBuffer.toString("utf-8")), null, 2);
    } else {
      // Try to read as text for other file types
      content = fileBuffer.toString("utf-8");
    }

    // Cache the content
    documentCache.set(filename, { content, lastModified });
    return content;
  } catch (error) {
    console.error(`Error loading document ${filename}:`, error);
    return "";
  }
}

function getAllDocuments(): string[] {
  if (!fs.existsSync(documentsPath)) {
    return [];
  }

  try {
    return fs.readdirSync(documentsPath).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".pdf", ".txt", ".json", ".md"].includes(ext);
    });
  } catch (error) {
    console.error("Error reading documents directory:", error);
    return [];
  }
}

function searchInDocuments(query: string, documents: string[]): string {
  const results: string[] = [];
  const queryLower = query.toLowerCase();

  for (const filename of documents) {
    const content = loadDocumentContent(filename);
    if (!content) continue;

    const contentLower = content.toLowerCase();
    
    // Find matching paragraphs/sections
    const lines = content.split(/\n\n+/);
    const matches = lines.filter((line) => {
      const lineLower = line.toLowerCase();
      return lineLower.includes(queryLower) || 
             queryLower.split(" ").some((word) => word.length > 3 && lineLower.includes(word));
    });

    if (matches.length > 0) {
      results.push(`\n--- From ${filename} ---\n${matches.slice(0, 3).join("\n\n")}`);
    }
  }

  if (results.length === 0) {
    return "No relevant information found in the documents.";
  }

  return results.join("\n\n");
}

export const searchDocuments = {
  description: "Search through source documents (PDFs, TXT, JSON, MD) in the documents folder to find relevant information",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant information in the documents"),
  }),
  execute: async ({ query }: { query: string }) => {
    const documents = getAllDocuments();
    
    if (documents.length === 0) {
      return "No documents found in the documents folder. Please add PDF, TXT, JSON, or MD files to the public/documents directory.";
    }

    const results = searchInDocuments(query, documents);
    
    return {
      results,
      availableDocuments: documents,
      documentCount: documents.length,
    };
  },
};
