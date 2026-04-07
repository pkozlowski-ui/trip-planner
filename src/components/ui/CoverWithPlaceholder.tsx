import { useState, useEffect, useRef } from 'react';
import { SkeletonPlaceholder } from '@carbon/react';
import { hasLoaded, markLoaded } from '../../utils/imageLoadCache';

const COVER_LOADED_CLASS = 'cover-image-loaded';

export interface CoverWithPlaceholderProps {
  /** Image URL for the cover. When empty, only fallback is shown. */
  coverUrl: string | null | undefined;
  /** Fallback style when no cover or while loading (e.g. gradient). */
  fallbackStyle?: React.CSSProperties;
  /** CSS class for the root element (e.g. trip-plan-card__media). */
  className?: string;
  /** Optional style for the root container (e.g. width/height for fixed-size). */
  style?: React.CSSProperties;
  /** Aspect ratio or height (e.g. paddingBottom 62% for card). Applied to container. */
  aspectRatio?: string;
}

export function CoverWithPlaceholder({
  coverUrl,
  fallbackStyle,
  className,
  style: styleProp,
  aspectRatio,
}: CoverWithPlaceholderProps) {
  const url = coverUrl?.trim();
  const [isLoaded, setIsLoaded] = useState(() => (url ? hasLoaded(url) : true));
  const preloadRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) return;
    if (hasLoaded(url)) {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    const img = new Image();
    preloadRef.current = img;
    img.onload = () => {
      if (preloadRef.current !== img) return;
      markLoaded(url);
      setIsLoaded(true);
    };
    img.src = url;
    return () => {
      preloadRef.current = null;
      img.src = '';
    };
  }, [url]);

  const showCover = !!url;
  const showSkeleton = url && !isLoaded;
  const style: React.CSSProperties = {
    ...(aspectRatio
      ? { paddingBottom: aspectRatio, height: 0, position: 'relative' as const, overflow: 'hidden' }
      : { position: 'relative' as const }),
    ...styleProp,
  };

  return (
    <div className={className} style={style} aria-hidden>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...fallbackStyle,
        }}
      />
      {showSkeleton && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SkeletonPlaceholder
            style={{
              width: '100%',
              height: '100%',
              minHeight: 80,
            }}
          />
        </div>
      )}
      {showCover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.2s cubic-bezier(0.2, 0, 0.38, 0.9)',
          }}
          className={isLoaded ? COVER_LOADED_CLASS : undefined}
        />
      )}
    </div>
  );
}

export default CoverWithPlaceholder;
