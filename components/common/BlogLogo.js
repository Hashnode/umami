import React from 'react';
import Image from 'next/image';
import Link from 'components/common/Link';
import useTheme from 'hooks/useTheme';
import styles from './BlogLogo.module.css';

import { resizeImage, getBlurHash } from 'utils/image';
import { createPublicationOrigin } from 'utils/urls';

export default function BlogLogo(props) {
  const { publication } = props;
  const [theme] = useTheme();
  const isThemeDark = theme === 'dark';
  const blogURL = createPublicationOrigin(publication);

  if (!publication) {
    return null;
  }

  return (
    <div>
      {publication.darkModeLogo && isThemeDark ? (
        <div className={styles.title}>
          <Link className={styles.link} noDefaultLinkStyles href={blogURL}>
            <Image
              priority
              src={resizeImage(publication.darkModeLogo, { w: 1000, h: 250, c: 'thumb' })}
              width={1000}
              height={250}
              alt={publication.title || `${publication.author.name}'s Blog`}
            />
          </Link>
        </div>
      ) : publication.logo ? (
        <div className={styles.title}>
          <Link className={styles.link} noDefaultLinkStyles href={blogURL}>
            <Image
              priority
              src={resizeImage(publication.logo, { w: 1000, h: 250, c: 'thumb' })}
              width={1000}
              height={250}
              alt={publication.title || `${publication.author.name}'s Blog`}
            />
          </Link>
        </div>
      ) : (
        <div className={styles.title}>
          <Link className={styles.default} href={blogURL} noDefaultLinkStyles>
            {!publication.isTeam && publication.author.photo && (
              <div className={styles.photo}>
                <Image
                  priority
                  src={resizeImage(publication.author.photo, { w: 400, h: 400, c: 'face' })}
                  blurDataURL={getBlurHash(
                    resizeImage(publication.author.photo, { w: 400, h: 400, c: 'face' }),
                  )}
                  width={400}
                  height={400}
                  alt={publication.author.name}
                />
              </div>
            )}
            {publication.title || `${publication.author.name}'s Blog`}
          </Link>
        </div>
      )}
    </div>
  );
}
