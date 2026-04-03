import { useState, useEffect, useRef } from 'react';
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
  const [initialLoaded] = useState(() => hasLoaded(src));
  const imgRef = useRef<HTMLImageElement | null>(null);
  const skeletonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!src?.trim()) return;
    if (initialLoaded) {
      imgRef.current?.classList.add(IMAGE_LOADED_CLASS);
      if (skeletonRef.current) skeletonRef.current.style.display = 'none';
    }
  }, [src, initialLoaded]);

  const handleLoad = () => {
    markLoaded(src);
    imgRef.current?.classList.add(IMAGE_LOADED_CLASS);
    if (skeletonRef.current) skeletonRef.current.style.display = 'none';
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
      {!initialLoaded && (
        <div
          ref={skeletonRef}
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
        ref={imgRef}
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
          opacity: initialLoaded ? 1 : 0,
          transition: 'opacity 0.2s cubic-bezier(0.2, 0, 0.38, 0.9)',
        }}
        className={initialLoaded ? IMAGE_LOADED_CLASS : undefined}
      />
    </div>
  );
}

export default ImageWithPlaceholder;
