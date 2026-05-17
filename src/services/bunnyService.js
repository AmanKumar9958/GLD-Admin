import * as tus from 'tus-js-client';
import { supabase } from '../lib/supabase'; // Adjust this path if your supabase client is located elsewhere

export async function uploadVideoToBunny(file, title, onProgress) {
  // 1. Get session for authenticated request
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('You must be logged in to upload videos.');
  }

  // 2. Request a secure upload signature from your new Edge Function
  // Ensure VITE_SUPABASE_URL is set in your Admin .env file
  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-bunny-video`;
  
  const signatureResponse = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ title })
  });

  if (!signatureResponse.ok) {
    const errorData = await signatureResponse.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create video signature (${signatureResponse.status})`);
  }

  const { videoId, libraryId, authorizationSignature, authorizationExpire } = await signatureResponse.json();

  // 3. Upload the video directly to Bunny.net using TUS protocol and secure signatures
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: 'https://video.bunnycdn.com/tusupload',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        AuthorizationSignature: authorizationSignature,
        AuthorizationExpire: authorizationExpire.toString(),
        VideoId: videoId,
        LibraryId: libraryId.toString(),
      },
      metadata: {
        filetype: file.type,
        title: title,
        collection: ''
      },
      onError: function (error) {
        console.error('TUS Upload Error:', error);
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = (bytesUploaded / bytesTotal) * 100;
        if (onProgress) {
          onProgress(Math.round(percentage));
        }
      },
      onSuccess: function () {
        resolve({ videoId });
      }
    });

    upload.start();
  });
}
