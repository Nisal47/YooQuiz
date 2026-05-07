import { useState, useEffect } from 'react'
import { normalizeImageUrl, isConvertedDriveUrl } from '../../utils/imageUtils'

/**
 * Image URL input with live preview and helpful error guidance.
 *
 * Props:
 *  value    {string}   Current URL (controlled)
 *  onChange {function} Called with the normalized URL whenever input changes
 */
export default function ImageUrlInput({ value = '', onChange }) {
  // 'idle' | 'loading' | 'loaded' | 'error'
  const [status, setStatus] = useState(() => value?.trim() ? 'loading' : 'idle')

  // Reset preview state whenever the URL changes
  useEffect(() => {
    setStatus(value?.trim() ? 'loading' : 'idle')
  }, [value])

  function handleChange(e) {
    const normalized = normalizeImageUrl(e.target.value)
    onChange(normalized)
  }

  function handleLoad(e) {
    // naturalWidth === 0 means the browser received HTML instead of an image
    // (e.g. Google's redirect/auth page returned with a 200 status)
    if (e.currentTarget.naturalWidth === 0) {
      setStatus('error')
    } else {
      setStatus('loaded')
    }
  }

  const isDrive = isConvertedDriveUrl(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-text-secondary">Image URL — optional</label>
        <a
          href="https://imgur.com/upload"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Upload to Imgur ↗
        </a>
      </div>

      <input
        className="input"
        value={value}
        onChange={handleChange}
        placeholder="Paste a direct image URL (from Imgur, etc.)"
      />

      {/* Tip */}
      <p className="text-xs text-text-secondary leading-relaxed">
        Use a <strong className="text-white">direct image URL</strong> — one that ends in{' '}
        <code className="text-primary">.jpg</code>,{' '}
        <code className="text-primary">.png</code>, etc.
        {' '}Free option: upload to{' '}
        <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          imgur.com
        </a>
        , then right-click the image → <em>Copy image address</em>.
      </p>

      {/* Live preview area */}
      {value?.trim() && (
        <div
          className="relative rounded-xl overflow-hidden border border-white/10 bg-surface flex items-center justify-center"
          style={{ minHeight: '80px' }}
        >
          {/* Loading */}
          {status === 'loading' && (
            <p className="text-xs text-text-secondary animate-pulse">Loading preview…</p>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="text-2xl">🚫</span>
              {isDrive ? (
                <p className="text-xs text-danger leading-relaxed">
                  Google Drive blocks direct image embedding.{' '}
                  <a
                    href="https://imgur.com/upload"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Upload to Imgur
                  </a>{' '}
                  instead — it gives a URL that works everywhere.
                </p>
              ) : (
                <p className="text-xs text-danger leading-relaxed">
                  Image didn't load. Make sure the URL is a direct image link
                  (ends in .jpg, .png, etc.), not a webpage.
                </p>
              )}
            </div>
          )}

          {/* Image — always rendered so onLoad/onError fire */}
          <img
            key={value}
            src={value.trim()}
            alt="Preview"
            className={`w-full max-h-48 object-contain transition-opacity duration-200
              ${status === 'loaded' ? 'opacity-100' : 'opacity-0 h-0'}`}
            onLoad={handleLoad}
            onError={() => setStatus('error')}
          />
        </div>
      )}
    </div>
  )
}
