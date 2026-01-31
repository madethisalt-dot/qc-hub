import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const fileId = url.searchParams.get('id');

  if (!fileId) {
    return new Response('File ID required', { status: 400 });
  }

  try {
    const store = getStore('uploads');
    const file = await store.get(fileId, { type: 'arrayBuffer' });
    const metadata = await store.getMetadata(fileId);

    if (!file || !metadata) {
      return new Response('File not found', { status: 404 });
    }

    const contentType = (metadata as any).contentType || 'application/octet-stream';
    const filename = (metadata as any).filename || 'download';
    const size = (metadata as any).size || '';

    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': size
      }
    });
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};
