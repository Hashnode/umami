import React from 'react';
import Head from 'next/head';
import Header from 'components/layout/Header';
import Footer from 'components/layout/Footer';
import useLocale from 'hooks/useLocale';

export default function Layout({ children, header = true, footer = true, publication }) {
  const { dir } = useLocale();
  const publicationTitle = `${
    publication.displayTitle || publication.title || publication.username
  } + Analytics`;

  return (
    <>
      <Head>
        <title>{publicationTitle}</title>
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
