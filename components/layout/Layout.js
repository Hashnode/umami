import React from 'react';
import Head from 'next/head';
import Header from 'components/layout/Header';
import Footer from 'components/layout/Footer';
import useLocale from 'hooks/useLocale';

export default function Layout({
  children,
  header = true,
  footer = true,
  publication,
  sharePageProps,
}) {
  const { dir } = useLocale();

  const defaultImage =
    'https://cdn.hashnode.com/res/hashnode/image/upload/v1644938661983/J7uY6EVhp.png?auto=compress';
  const { title, description, ogImage, favicon } = sharePageProps;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} key="ogTitle" />
        <meta name="description" content={description || ''} key="description" />
        <meta property="og:description" content={description || ''} key="ogDescription" />
        <meta name="image" property="og:image" content={ogImage || defaultImage} key="ogImage" />
        {favicon ? <link rel="icon" type="image/png" href={favicon} /> : null}
      </Head>

      {header && <Header publication={publication} />}
      <main className="container" dir={dir}>
        {children}
      </main>
      {footer && <Footer />}
      <div id="__modals" dir={dir} />
    </>
  );
}
