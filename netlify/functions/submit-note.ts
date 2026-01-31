import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

interface Submission {
  id: string;
  title: string;
  course: string;
  notes: string;
  fileUrl?: string;
  fileName?: string;
  fileId?: string;
  tags: string[];
  rating: number;
  ratingCount: number;
  totalRating: number;
  submittedAt: string;
  approved: boolean;
  version: number;
  versionHistory?: Array<{
    version: number;
    updatedAt: string;
    changes: string;
  }>;
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data = await req.json();
    const store = getStore('submissions');
    
    const submission: Submission = {
      id: `sub_${Date.now()}`,
      title: data.title,
      course: data.course,
      notes: data.notes,
      fileUrl: data.fileUrl || '',
      fileName: data.fileName || '',
      fileId: data.fileId || '',
      tags: data.tags || [],
      rating: 0,
      ratingCount: 0,
      totalRating: 0,
      submittedAt: new Date().toISOString(),
      approved: false,
      version: 1,
      versionHistory: []
    };

    await store.setJSON(submission.id, submission);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Submission received and pending review',
      id: submission.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
