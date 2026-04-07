import { Star, Time, Video } from '@carbon/icons-react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import CoverWithPlaceholder from '../ui/CoverWithPlaceholder';
import ImageWithPlaceholder from '../ui/ImageWithPlaceholder';
import type { Location } from '../../types';
import styles from './LocationPopup.module.scss';

const MAX_AUTHOR_LEN = 45;
const MAX_LICENSE_LEN = 25;

function getSourceLabel(sourceUrl: string): string {
  try {
    const u = new URL(sourceUrl);
    const host = u.hostname.replace(/^www\./, '');
    if (host.includes('commons.wikimedia.org')) return 'Wikimedia Commons';
    if (host.includes('wikimedia.org')) return 'Wikimedia';
    if (host.includes('wikipedia.org')) return 'Wikipedia';
    return host;
  } catch {
    return 'Source';
  }
}

function shortAuthor(author: string): string {
  const by = author.indexOf(' by ');
  if (by !== -1) {
    const after = author.slice(by + 4).trim();
    const end = after.search(/[.\n]/);
    const name = end === -1 ? after : after.slice(0, end).trim();
    return name.length <= MAX_AUTHOR_LEN ? name : name.slice(0, MAX_AUTHOR_LEN - 1) + '…';
  }
  return author.length <= MAX_AUTHOR_LEN ? author : author.slice(0, MAX_AUTHOR_LEN - 1) + '…';
}

function shortLicense(license: string): string {
  const cc = license.match(/(CC\s+(?:BY[-\s]*(?:SA|NC|ND)?\s*(?:\d+\.\d+)?(?:\s*\+\s*[A-Z]+)?))/i);
  if (cc) return cc[1].replace(/\s+/g, ' ').trim();
  return license.length <= MAX_LICENSE_LEN ? license : license.slice(0, MAX_LICENSE_LEN - 1) + '…';
}

function getYouTubeThumbnail(url: string): string | null {
  try {
    const videoId = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    )?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}

interface LocationPopupProps {
  location: Location;
  dayNumber: number;
  order: number;
  dayColor: string;
  popupImage?: string;
  popupImageAttribution?: Location['imageAttribution'];
  popupImageLoading: boolean;
}

export default function LocationPopup({
  location,
  dayNumber,
  order,
  dayColor,
  popupImage,
  popupImageAttribution,
  popupImageLoading,
}: LocationPopupProps) {
  const activeImage = location.image ?? popupImage ?? null;
  const activeAttribution = location.imageAttribution || popupImageAttribution;

  const youtubeVideos = location.media?.filter((m) => m.type === 'youtube') || [];
  const firstVideo = youtubeVideos[0];
  const videoThumbnail = firstVideo ? getYouTubeThumbnail(firstVideo.url) : null;

  let CategoryIcon: React.ElementType | null = null;
  try {
    CategoryIcon = getCategoryIcon(location.category);
  } catch {
    CategoryIcon = null;
  }

  return (
    <div className={styles.popup}>
      {/* Image header */}
      {(activeImage || popupImageLoading) && (
        <div className={styles.imageWrap}>
          <div className={styles.imageContainer}>
            {popupImageLoading && !activeImage ? (
              <div className={styles.skeleton} />
            ) : (
              <CoverWithPlaceholder
                coverUrl={activeImage}
                fallbackStyle={{ backgroundColor: 'var(--cds-layer-02, #e8e8e8)' }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
          {activeAttribution && (
            <div className={styles.attribution}>
              {activeAttribution.author && (
                <span>© {shortAuthor(activeAttribution.author)}</span>
              )}
              {activeAttribution.license && (
                <span>
                  {activeAttribution.author ? ' · ' : ''}
                  {shortLicense(activeAttribution.license)}
                </span>
              )}
              {activeAttribution.sourceUrl && (
                <a
                  href={activeAttribution.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={styles.attributionLink}
                >
                  {getSourceLabel(activeAttribution.sourceUrl)}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header: icon + name + rating */}
      <div className={styles.header}>
        {CategoryIcon && (
          <CategoryIcon size={16} className={styles.headerIcon} aria-hidden />
        )}
        <h5 className={styles.title}>{location.name}</h5>
        {location.rating && (
          <div className={styles.rating}>
            <Star size={12} aria-hidden />
            <span>{location.rating.toFixed(1)}/5</span>
          </div>
        )}
      </div>

      {/* Category */}
      <p className={styles.category}>{location.category}</p>

      {/* Opening hours */}
      {location.openingHours && (
        <p className={styles.hours}>
          <Time size={12} aria-hidden />
          <span>{location.openingHours}</span>
        </p>
      )}

      {/* Description + Wikipedia link */}
      {(location.description || location.wikipediaUrl) && (
        <div className={styles.descriptionWrap}>
          {location.description && (
            <p className={styles.descriptionText}>
              {location.description.length > 200
                ? `${location.description.slice(0, 200).trim()}…`
                : location.description}
            </p>
          )}
          {location.wikipediaUrl && (
            <a
              href={location.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={styles.wikipediaLink}
            >
              Wikipedia →
            </a>
          )}
        </div>
      )}

      {/* YouTube video thumbnail */}
      {firstVideo && videoThumbnail && (
        <a
          href={firstVideo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={styles.videoWrap}
        >
          <ImageWithPlaceholder
            src={videoThumbnail}
            alt="Video thumbnail"
            loading="lazy"
            objectFit="cover"
            style={{ width: '100%', height: '120px' }}
          />
          <div className={styles.videoPlayOverlay}>
            <Video size={20} aria-hidden />
          </div>
          {youtubeVideos.length > 1 && (
            <div className={styles.videoCount}>+{youtubeVideos.length - 1} more</div>
          )}
        </a>
      )}

      {/* Footer: day + order */}
      <div className={styles.footer}>
        <div className={styles.dayDot} style={{ backgroundColor: dayColor }} aria-hidden />
        <span>
          Day {dayNumber} · Stop {order}
        </span>
      </div>
    </div>
  );
}
