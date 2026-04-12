const LIBRARY_ID = String(import.meta.env.VITE_LIBRARY_ID || '').trim()
const API_KEY = String(import.meta.env.VITE_API_KEY || '').trim()

/**
 * Uploads a video file to Bunny.net Stream
 * 1. Creates a video entry to get a GUID
 * 2. Uploads the actual binary data using a PUT request
 * 
 * @param {File} file - The video file to upload
 * @param {string} title - The title for the video entry
 * @param {function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<{ videoId: string }>}
 */
export async function uploadVideoToBunny(file, title, onProgress) {
  if (!LIBRARY_ID || !API_KEY) {
    throw new Error('Bunny.net configuration is missing in .env')
  }

  // 1. Create Video Entry
  const createResponse = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': API_KEY,
        'accept': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!createResponse.ok) {
    let errorMessage = `Failed to create video entry (${createResponse.status})`
    try {
      const errorData = await createResponse.json()
      errorMessage = errorData.message || errorMessage
      console.error('Bunny.net Error Detail:', errorData)
    } catch (e) {
      // ignore
    }
    throw new Error(errorMessage)
  }

  const createData = await createResponse.json()
  const videoId = createData.guid

  // 2. Upload Video File using XMLHttpRequest for progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.open(
      'PUT',
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`
    )
    xhr.setRequestHeader('AccessKey', API_KEY)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(Math.round(percentComplete))
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ videoId })
      } else {
        let errorMessage = `Upload failed with status ${xhr.status}`
        try {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        } catch (e) {
          // ignore parsing error
        }
        reject(new Error(errorMessage))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    
    xhr.send(file)
  })
}
