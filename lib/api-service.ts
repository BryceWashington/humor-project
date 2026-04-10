export interface CaptionRecord {
  id: string;
  content: string;
  created_datetime_utc: string;
  // ... any other fields
}

export interface UploadResponse {
  imageId: string;
  timestamp: string;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  cdnUrl: string;
}

const BASE_URL = 'https://api.almostcrackd.ai';

export async function generateCaptions(
  imageId: string,
  token: string,
  humorFlavorId?: string | number
): Promise<CaptionRecord[]> {
  const body: any = { imageId };
  if (humorFlavorId) {
    body.humorFlavorId = humorFlavorId;
  }

  const step4Res = await fetch(`${BASE_URL}/pipeline/generate-captions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!step4Res.ok) throw new Error('Failed to generate captions');
  return (await step4Res.json()) as CaptionRecord[];
}

export async function uploadImagePipeline(
  file: File,
  token: string,
  onProgress: (message: string) => void,
  humorFlavorId?: string | number
): Promise<{ captions: CaptionRecord[]; imageId: string }> {
  try {
    // Step 1: Generate Presigned URL
    onProgress('Uploading image...');
    const step1Res = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contentType: file.type }),
    });

    if (!step1Res.ok) throw new Error('Failed to generate presigned URL');
    const { presignedUrl, cdnUrl } = (await step1Res.json()) as PresignedUrlResponse;

    // Step 2: Upload Image Bytes (Direct to S3)
    const step2Res = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!step2Res.ok) throw new Error('Failed to upload image bytes');

    // Step 3: Register Image URL in the Pipeline
    onProgress('Generating captions... Please wait');
    const step3Res = await fetch(`${BASE_URL}/pipeline/upload-image-from-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: cdnUrl,
        isCommonUse: false,
      }),
    });

    if (!step3Res.ok) throw new Error('Failed to register image URL');
    const { imageId } = (await step3Res.json()) as UploadResponse;

    // Step 4: Generate Captions
    const captions = await generateCaptions(imageId, token, humorFlavorId);

    return { captions, imageId };
  } catch (error) {
    console.error('Upload pipeline failed:', error);
    throw error;
  }
}
