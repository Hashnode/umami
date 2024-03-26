import React from 'react';
import Layout from 'components/layout/Layout';
import WebsiteDetails from 'components/pages/WebsiteDetails';
import { getAppUrl, getAutogeneratedPublicationOG, createPublicationOrigin } from 'utils/urls';
import { resizeImage } from 'utils/image';

async function getPublicationDetails(umamiShareId) {
  try {
    const baseURL = getAppUrl();
    const requestURL = '/api/publication/publication-using-umami';

    const response = await fetch(`${baseURL}${requestURL}?umamiShareId=${umamiShareId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json();
    return json.publication;
  } catch (e) {
    return null;
  }
}

export default function SharePage(props) {
  const { publication, sharePageProps } = props;
  if (typeof window === 'undefined') {
    return null;
  }
  return (
    <Layout publication={publication} sharePageProps={sharePageProps}>
      <WebsiteDetails publication={publication} />
    </Layout>
  );
}

export const getServerSideProps = async ctx => {
  const { query } = ctx;
  const umamiShareId = query?.id[0];

  if (!umamiShareId) {
    return {
      props: {
        notFound: true,
      },
    };
  }
  const publication = await getPublicationDetails(umamiShareId);

  if (!publication) {
    return {
      notFound: true,
    };
  }
  const pubUrl = createPublicationOrigin(publication);
  publication.url = pubUrl;

  const autoGeneratedOgImage = getAutogeneratedPublicationOG(publication);
  const banner = publication.ogImage
    ? `https://hashnode.com/utility/r?url=${encodeURIComponent(
        resizeImage(publication.ogImage, { w: 800, h: 420, c: 'thumb' }),
      )}`
    : autoGeneratedOgImage;

  const publicationTitle = publication
    ? `${
        publication.displayTitle || publication.title || `${publication.author?.name}'s Blog`
      } Analytics`
    : null;

  const descriptionSEO =
    publication.description ||
    publication.metaHTMLSanitized ||
    publication.title ||
    `${publication.author?.name}'s Blog`;
  const pubFavicon = publication.favicon ? `${resizeImage(publication.favicon, {})}&fm=png` : null;

  const sharePageProps = {
    title: publicationTitle,
    ogImage: banner,
    description: descriptionSEO,
    favicon: pubFavicon,
  };

  return {
    props: {
      publication,
      sharePageProps,
    },
  };
};
