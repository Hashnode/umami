import React from 'react';
import Layout from 'components/layout/Layout';
import { getAppUrl, getAutogeneratedPublicationOG, getGQLUrl } from 'utils/urls';
import dynamic from 'next/dynamic';
import { resizeImage } from 'utils/image';
const WebsiteDetails = dynamic(() => import('components/pages/WebsiteDetails'), {
  ssr: false,
});

async function getPublicationDetailsFromUmami(umamiShareId) {
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

async function getPublicationDetailsFromGQL(publicationId) {
  try {
    const baseURL = getGQLUrl();

    const response = await fetch(`${baseURL}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetPublication($publicationId: ObjectId!) {
            publication(id: $publicationId) {
              id
              title
              url
              descriptionSEO
              favicon
              ogMetaData {
                image
              }
              author {
                name
              }
              displayTitle
              preferences {
              logo
              darkMode {
                logo
                enabled
              }
            }
            }
          }
        `,
        variables: {
          publicationId,
        },
      }),
    });
    const json = await response.json();
    return json.data.publication;
  } catch (e) {
    return null;
  }
}

export default function SharePage(props) {
  const { publication, sharePageProps } = props;
  return (
    <Layout publication={publication} sharePageProps={sharePageProps}>
      <WebsiteDetails publication={publication} />
    </Layout>
  );
}

export const getServerSideProps = async ctx => {
  const { query } = ctx;
  const isPublicationId = query?.id?.length === 1;

  if (!isPublicationId) {
    const umamiShareId = query?.id[0];
    if (!umamiShareId) {
      return {
        props: {
          notFound: true,
        },
      };
    }
    const publication = await getPublicationDetailsFromUmami(umamiShareId);
    if (!publication || !publication._id) {
      return {
        notFound: true,
      };
    }
    return {
      redirect: {
        destination: `/share/${publication._id}`,
        permanent: true,
      },
    };
  }

  const publicationId = query?.id[0];
  const publication = await getPublicationDetailsFromGQL(publicationId);
  if (!publication) {
    return {
      notFound: true,
    };
  }

  const title = `Analytics for ${
    publication.displayTitle || publication.title || `${publication.author.name}'s Blog`
  }`;
  const description = publication.descriptionSEO || publication.title;
  const ogImage = publication.ogImage?.image
    ? `https://hashnode.com/utility/r?url=${encodeURIComponent(
        resizeImage(publication.ogImage.image, { w: 800, h: 420, c: 'thumb' }),
      )}`
    : getAutogeneratedPublicationOG(publication);
  const favicon = publication.favicon ? `${resizeImage(publication.favicon, {})}&fm=png` : null;

  const sharePageProps = {
    title,
    ogImage,
    description,
    favicon,
  };

  return {
    props: {
      publication,
      sharePageProps,
    },
  };
};
