import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_LENGTH = 100000; // max chars of extracted text to send to the model

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'csv', 'json', 'log', 'env', 'ini', 'cfg',
  'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'py', 'java', 'go', 'rs',
  'c', 'cpp', 'h', 'hpp', 'cs', 'rb', 'php', 'swift', 'kt', 'sql',
  'xml', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'yaml', 'yml',
  'toml', 'sh', 'bash', 'zsh', 'bat', 'ps1', 'svg', 'vtt', 'srt', 'njk',
]);

const uploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  content: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid upload data' },
        { status: 400 },
      );
    }

    const { filename, mimeType } = parsed.data;
    const rawBase64 = parsed.data.content;

    // Strip optional data URL prefix (e.g. "data:text/plain;base64,....")
    const base64 = rawBase64.includes(',')
      ? rawBase64.slice(rawBase64.indexOf(',') + 1)
      : rawBase64;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      return NextResponse.json(
        { error: 'Invalid file content' },
        { status: 400 },
      );
    }

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 },
      );
    }

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size should be less than 5MB' },
        { status: 400 },
      );
    }

    // Persist the file so it has a stable public URL
    const safeName = filename.replace(/[^\w.\- ]/g, '_').replace(/\s+/g, '_');
    const storedName = `${randomUUID()}-${safeName}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    try {
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, storedName), buffer);
    } catch (error) {
      console.error('Failed to store upload:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Extract text so the model can actually read documents
    const ext = safeName.split('.').pop()?.toLowerCase() ?? '';
    let text: string | null = null;

    if (TEXT_EXTENSIONS.has(ext) || (mimeType && mimeType.startsWith('text/'))) {
      text = buffer.toString('utf-8');
    } else if (mimeType === 'application/pdf' || ext === 'pdf') {
      try {
        const parsedPdf = await pdf(buffer);
        text = parsedPdf.text || '';
      } catch (error) {
        console.error('PDF text extraction failed:', error);
        text = null;
      }
    }

    if (text && text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH);
    }

    return NextResponse.json({
      filename: safeName,
      url: `/uploads/${storedName}`,
      mimeType,
      size: buffer.length,
      text,
      dataUrl:
        mimeType && mimeType.startsWith('image/')
          ? `data:${mimeType};base64,${base64}`
          : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 },
    );
  }
}
