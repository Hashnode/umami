import { parse } from 'cookie';
import { format } from 'date-fns';

import { ok } from 'lib/response';
import { getGQLUrl } from 'utils/urls';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, domain, groupByUnit, groupByValue } = req.query;
  const data = await getAnalyticsData({
    token: jwtToken,
    domain,
    startDate: start_at,
    endDate: end_at,
    groupByUnit,
    groupByValue,
  });
  return ok(res, data);
};

async function getAnalyticsData({ token, domain, startDate, endDate, groupByUnit }) {
  try {
    const from = new Date(parseInt(startDate)).toISOString();
    const to = new Date(parseInt(endDate)).toISOString();
    const granularity = getGroupBy(groupByUnit);
    const data = await fetch(getGQLUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        query,
        variables: {
          host: domain,
          first: 50,
          filter: {
            time: {
              absolute: {
                from,
                to,
              },
            },
          },
          visitorsFilter: {
            time: {
              absolute: {
                from,
                to,
              },
            },
          },
          groupBy: {
            granularity,
          },
          visitorsGroupBy: {
            granularity,
          },
        },
      }),
    });
    const response = await data.json();
    return mapData(response);
  } catch (error) {
    console.log('error', error);
  }
}

function getGroupBy(unit) {
  switch (unit) {
    case 'hour':
      return 'HOURLY';
    case 'day':
      return 'DAILY';
    case 'week':
      return 'WEEKLY';
    case 'month':
      return 'MONTHLY';
    case 'year':
      return 'YEARLY';
    default:
      return 'DAILY';
  }
}

const query = /* GraphQL */ `
  query Pageviews(
    $host: String
    $first: Int!
    $filter: PublicationViewsFilter
    $visitorsFilter: PublicationVisitorsFilter
    $groupBy: PublicationViewsGroupBy
    $visitorsGroupBy: PublicationVisitorsGroupBy
  ) {
    publication(host: $host) {
      url
      analytics {
        views(first: $first, filter: $filter, groupBy: $groupBy) {
          edges {
            node {
              id
              total
              ... on GroupedByTimeViews {
                id
                total
                from
                to
              }
            }
          }
        }
        visitors(first: $first, filter: $visitorsFilter, groupBy: $visitorsGroupBy) {
          edges {
            node {
              id
              total
              ... on GroupedByTimeVisitors {
                id
                total
                from
                to
              }
            }
          }
        }
      }
    }
  }
`;

const mapData = data => {
  const pageviews = data?.data?.publication?.analytics?.views?.edges.map(item => ({
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
  };
};
