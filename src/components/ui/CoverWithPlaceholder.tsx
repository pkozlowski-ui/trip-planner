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
  const [initialLoaded] = useState(() => (url ? hasLoaded(url) : true));
  const imageLayerRef = useRef<HTMLDivElement | null>(null);
  const skeletonRef = useRef<HTMLDivElement | null>(null);
  const preloadRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) return;
    if (initialLoaded) {
      imageLayerRef.current?.classList.add(COVER_LOADED_CLASS);
      if (skeletonRef.current) skeletonRef.current.style.display = 'none';
      return;
    }
    const img = new Image();
    preloadRef.current = img;
    img.onload = () => {
      if (preloadRef.current !== img) return;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bb239023-cde3-46c7-be09-5a71c6644f5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aa31bd'},body:JSON.stringify({sessionId:'aa31bd',location:'CoverWithPlaceholder.tsx:onload',message:'Cover image loaded',data:{urlLen:url?.length},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      markLoaded(url);
      imageLayerRef.current?.classList.add(COVER_LOADED_CLASS);
      if (skeletonRef.current) skeletonRef.current.style.display = 'none';
    };
    img.onerror = () => {
      if (preloadRef.current === img && skeletonRef.current) skeletonRef.current.style.display = 'none';
    };
    img.src = url;
    return () => {
      preloadRef.current = null;
      img.src = '';
      imageLayerRef.current?.classList.remove(COVER_LOADED_CLASS);
      if (skeletonRef.current) skeletonRef.current.style.display = '';
    };
  }, [url, initialLoaded]);

  const showCover = !!url;
  const showSkeleton = url && !initialLoaded;
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
          ref={skeletonRef}
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
          ref={imageLayerRef}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: initialLoaded ? 1 : 0,
            transition: 'opacity 0.2s cubic-bezier(0.2, 0, 0.38, 0.9)',
          }}
          className={initialLoaded ? COVER_LOADED_CLASS : undefined}
        />
      )}
    </div>
  );
}

export default CoverWithPlaceholder;
