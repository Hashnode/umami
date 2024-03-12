import { parse } from 'cookie';
import { format } from 'date-fns';

import { ok } from 'lib/response';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, domain } = req.query;
  const data = await getAnalyticsData({
    token: jwtToken,
    domain,
    startDate: start_at,
    endDate: end_at,
  });
  return ok(res, data);
};

async function getAnalyticsData({ token, domain, startDate, endDate }) {
  try {
    const from = new Date(parseInt(startDate));
    const to = new Date(parseInt(endDate));
    const data = await fetch(`https://179kej9boe.execute-api.ap-south-1.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        query,
        variables: {
          // host: domain.replace('.dev', '.hashnode.dev'),
          host: 'iamshadmirza.hashnode.dev',
          first: 10,
          filter: {
            time: {
              absolute: {
                from,
                to,
              },
            },
          },
          vistorsFilter: {
            time: {
              absolute: {
                from,
                to,
              },
            },
          },
        },
      }),
    });
    const response = await data.json();
    return mapData(response);
  } catch (error) {
    console.error(`error`, error); // TODO: remove this
  }
}

const query = `
query Query($host: String, $first: Int!, $filter: PublicationViewsFilter,  $visitorsFilter: PublicationVisitorsFilter) {
  publication(host: $host) {
    url
    analytics {
      views(first: $first, filter: $filter) {
        edges {
          node {
            id
            from
            to
            total
          }
        }
      }
      visitors(first: $first, filter: $visitorsFilter) {
        edges {
          node {
            id
            from
            to
            total
          }
        }
      }
    }
  }
}`;

const mapData = (data) => {
  const pageviews = data?.data?.publication?.analytics?.views?.edges.map((item) => ({
    t: format(new Date(item.node.to), 'yyyy-MM-dd HH:mm:ss'),
    y: item.node.total,
  }));
  const sessions = data?.data?.publication?.analytics?.visitors?.edges.map(item => ({
    t: format(new Date(item.node.to), 'yyyy-MM-dd HH:mm:ss'),
    y: item.node.total,
  }));
  return {
    pageviews,
    sessions,
  }
}
