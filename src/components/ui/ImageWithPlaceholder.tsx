import { useState } from 'react';
import { SkeletonPlaceholder } from '@carbon/react';
import { hasLoaded, markLoaded } from '../../utils/imageLoadCache';

const IMAGE_LOADED_CLASS = 'image-loaded';

export interface ImageWithPlaceholderProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Use 'eager' for above-the-fold images (e.g. dashboard covers, visible cards). Default 'lazy' for off-screen. */
  loading?: 'lazy' | 'eager';
  /** Width/height for placeholder and image container. */
  width?: number | string;
  height?: number | string;
  /** Object fit for the img. */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

export function ImageWithPlaceholder({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
  width,
  height,
  objectFit = 'cover',
}: ImageWithPlaceholderProps) {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => hasLoaded(src));

  const handleLoad = () => {
    markLoaded(src);
    setIsLoaded(true);
  };

  const handleError = () => setError(true);

  if (!src?.trim() || error) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ?? '100%',
    height: height ?? '100%',
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden
        >
          <SkeletonPlaceholder
            style={{
              width: width ?? '100%',
              height: height ?? '100%',
              minWidth: typeof width === 'number' ? width : 48,
              minHeight: typeof height === 'number' ? height : 48,
            }}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: width ?? '100%',
          height: height ?? '100%',
          objectFit,
          display: 'block',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.2s cubic-bezier(0.2, 0, 0.38, 0.9)',
        }}
        className={isLoaded ? IMAGE_LOADED_CLASS : undefined}
      />
    </div>
  );
}

export default ImageWithPlaceholder;
