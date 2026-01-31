import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { submissionId, rating } = await req.json();
    
    if (!submissionId || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Invalid submission ID or rating' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const store = getStore('submissions');
    const submission = await store.get(submissionId, { type: 'json' }) as any;

    if (!submission) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    submission.totalRating = (submission.totalRating || 0) + rating;
    submission.ratingCount = (submission.ratingCount || 0) + 1;
    submission.rating = submission.totalRating / submission.ratingCount;

    await store.setJSON(submissionId, submission);

    return new Response(JSON.stringify({ 
      success: true, 
      averageRating: submission.rating.toFixed(1),
      ratingCount: submission.ratingCount
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
