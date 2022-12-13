import React from 'react';
import Image from 'next/image';
import Link from 'components/common/Link';
import useTheme from 'hooks/useTheme';
import styles from './BlogLogo.module.css';

import { resizeImage, getBlurHash } from 'utils/image';

const CustomLogo = ({ publication, logoSrc }) => (
  <div className={styles.title}>
    <Link className={styles.link} noDefaultLinkStyles href={publication.url}>
      <Image
        priority
        src={resizeImage(logoSrc, { w: 1000, h: 250, c: 'thumb' })}
        width={1000}
        height={250}
        alt={publication.title || `${publication.author?.name}'s Blog`}
      />
    </Link>
  </div>
);

const DefaultLogo = ({ publication }) => (
  <div className={styles.title}>
    <Link className={styles.default} href={publication.url} noDefaultLinkStyles>
      {!publication.isTeam && publication.author?.photo && (
        <div className={styles.photo}>
          <Image
            priority
            src={resizeImage(publication.author?.photo, { w: 400, h: 400, c: 'face' })}
            blurDataURL={getBlurHash(
              resizeImage(publication.author?.photo, { w: 400, h: 400, c: 'face' }),
            )}
            width={400}
            height={400}
            alt={publication.author?.name}
          />
        </div>
      )}
      {publication.title || `${publication.author?.name}'s Blog`}
    </Link>
  </div>
);

export default function BlogLogo(props) {
  const { publication } = props;
  const [theme] = useTheme();

  if (!publication) {
    return null;
  }
  const isThemeDark = theme === 'dark';
  const useDarkLogo = publication.darkModeLogo && isThemeDark;
  const useLogo = useDarkLogo || publication.logo;

  if (useLogo) {
    const logoSrc = useDarkLogo ? publication.darkModeLogo : publication.logo;
    return <CustomLogo publication={publication} logoSrc={logoSrc} />;
  }
  return <DefaultLogo publication={publication} />;
}
