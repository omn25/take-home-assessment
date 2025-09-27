import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || '.png';
    const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, '');
    const filename = `${base || 'image'}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


