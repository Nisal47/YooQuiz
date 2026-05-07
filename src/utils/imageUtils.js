/**
 * Normalize an image URL for use in an <img> src.
 *
 * Handles Google Drive share links — converts them to the thumbnail API URL
 * which is more reliable than the deprecated uc?export=view endpoint.
 *
 * Supported Google Drive input formats:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/open?id=FILE_ID
 *
 * All converted to:
 *   https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
 */
export function normalizeImageUrl(url) {
  if (!url || !url.trim()) return url

  // https://drive.google.com/file/d/FILE_ID/...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`
  }

  // https://drive.google.com/open?id=FILE_ID  (older share format)
  const openMatch = url.match(/drive\.google\.com\/open\?(?:.*&)?id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w1000`
  }

  return url
}

/** True when the stored URL is a converted Google Drive thumbnail link. */
export function isConvertedDriveUrl(url) {
  return Boolean(url?.includes('drive.google.com/thumbnail?id='))
}
