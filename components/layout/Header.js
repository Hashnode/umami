import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import classNames from 'classnames';
import Link from 'components/common/Link';
// import Icon from 'components/common/Icon';
import useTheme from 'hooks/useTheme';
//import LanguageButton from 'components/settings/LanguageButton';
import ThemeButton from 'components/settings/ThemeButton';
import UpdateNotice from 'components/common/UpdateNotice';
import UserButton from 'components/settings/UserButton';
import Button from 'components/common/Button';
import styles from './Header.module.css';
import useLocale from 'hooks/useLocale';
import XMark from 'assets/xmark.svg';
import Bars from 'assets/bars.svg';
import { createPublicationOrigin } from '../../utils/urls';
import { resizeImage, getBlurHash } from '../../utils/image';

export default function Header(props) {
  const { publication } = props;
  const user = useSelector(state => state.user);
  const [active, setActive] = useState(false);
  const { dir } = useLocale();
  const [theme] = useTheme();
  const isThemeDark = theme === 'dark';
  const blogURL = createPublicationOrigin(publication);

  function handleClick() {
    setActive(state => !state);
  }

  return (
    <nav className="container" dir={dir}>
      {user?.is_admin && <UpdateNotice />}
      <div className={classNames(styles.header, 'row align-items-center')}>
        <div className={styles.nav}>
          <Button
            className={styles.burger}
            icon={active ? <XMark /> : <Bars />}
            onClick={handleClick}
          />
          <div>
            {publication?.darkModeLogo && isThemeDark ? (
              <div className={styles.title}>
                <Link className={styles.logoLink} noDefaultLinkStyles href={blogURL}>
                  <Image
                    priority
                    className={styles.logo}
                    src={resizeImage(publication?.darkModeLogo, { w: 1000, h: 250, c: 'thumb' })}
                    width={1000}
                    height={250}
                    alt={publication.title || `${publication.author.name}'s Blog`}
                  />
                </Link>
              </div>
            ) : publication?.logo ? (
              <div className={styles.title}>
                <Link className={styles.logoLink} noDefaultLinkStyles href={blogURL}>
                  <Image
                    priority
                    className={styles.logo}
                    src={resizeImage(publication?.logo, { w: 1000, h: 250, c: 'thumb' })}
                    width={1000}
                    height={250}
                    alt={publication.title || `${publication.author.name}'s Blog`}
                  />
                </Link>
              </div>
            ) : (
              <div className={styles.title}>
                <Link className={styles.defaultLogoLink} href={blogURL} noDefaultLinkStyles>
                  {!publication.isTeam && publication.author.photo && (
                    <div className={styles.profilePhoto}>
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
          {user && (
            <div className={styles.items}>
              <div className={active ? classNames(styles.active) : ''}>
                <Link href="/dashboard">
                  <FormattedMessage id="label.dashboard" defaultMessage="Dashboard" />
                </Link>
                <Link href="/realtime">
                  <FormattedMessage id="label.realtime" defaultMessage="Realtime" />
                </Link>
                <Link href="/settings">
                  <FormattedMessage id="label.settings" defaultMessage="Settings" />
                </Link>
              </div>
            </div>
          )}
          <div className={styles.items}>
            <div className={active ? classNames(styles.active) : ''}>
              <div className={styles.buttons}>
                <ThemeButton />
                {/* <LanguageButton menuAlign="right" /> */}
                {user && <UserButton />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
