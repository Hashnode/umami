import React from 'react';
import { useRouter } from 'next/router';
import Layout from 'components/layout/Layout';
import WebsiteDetails from 'components/pages/WebsiteDetails';
import useShareToken from 'hooks/useShareToken';

/**
 * TODO: fetch pub details
 */
function getPublicationDetails() {
  try {
    const publication = {
      domain: '',
      darkModeLogo: '',
      username: 'kieranroberts',
      // title: '@Kieran6dev',
      displayTitle: 'Kieran Roberts Blog | Web Development Articles',
      logo: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1629097194939/24y2YdUns.png',
      umamiShareId: 'JXR1eEYt',
      umamiWebsiteUUID: 'eafa88a0-8bfc-471f-8700-b0ef807b1483',
      isTeam: false,
      author: {
        name: 'Kieran Roberts',
        photo: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1626713536314/qNiWsm_Qo.jpeg',
      },
    };

    return publication;
  } catch (e) {
    console.log(e);
  }
}

export default function SharePage(props) {
  const { publication: rawPub } = props;
  const publication = JSON.parse(rawPub);
  const router = useRouter();
  const { id } = router.query;
  const shareId = id?.[0];
  const shareToken = useShareToken(shareId);

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
  const umamiWebsiteUUID = query?.id[1];

  if (!umamiShareId) {
    return {
      props: {},
    };
  }
  const rawPublication = getPublicationDetails(umamiShareId, umamiWebsiteUUID);

  if (!rawPublication) {
    return {
      props: {},
    };
  }
  const publicationJSON = JSON.stringify(rawPublication);

  return {
    props: {
      publication: publicationJSON,
    },
  };
};
