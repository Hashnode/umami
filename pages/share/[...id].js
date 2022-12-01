import React from 'react';
import { useRouter } from 'next/router';
import Layout from 'components/layout/Layout';
import WebsiteDetails from 'components/pages/WebsiteDetails';
import useShareToken from 'hooks/useShareToken';
import { getAppUrl } from '../../utils/urls';

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
  const router = useRouter();
  const { id } = router.query;
  const shareId = id?.[0];
  const shareToken = useShareToken(shareId);
  const { publication: rawPub } = props;
  const publication = JSON.parse(rawPub);

  if (!shareToken) {
    return null;
  }
  const { websiteId } = shareToken;

  return (
    <Layout publication={publication}>
      <WebsiteDetails websiteId={websiteId} />
    </Layout>
  );
}

export const getServerSideProps = async ctx => {
  const { query } = ctx;
  const umamiShareId = query?.id[0];

  if (!umamiShareId) {
    return {
      props: {},
    };
  }
  const rawPublication = await getPublicationDetails(umamiShareId);
  const publicationJSON = JSON.stringify(rawPublication);

  return {
    props: {
      publication: publicationJSON,
    },
  };
};
