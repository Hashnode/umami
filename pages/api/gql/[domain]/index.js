import { parse } from 'cookie';

import { ok } from 'lib/response';
import { getGQLUrl } from 'utils/urls';
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
          first: 10,
        },
        filter: {
          time: {
            absolute: {
              from,
              to,
            },
          },
        },
      }),
    });
    const response = await data.json();
    return response;
  } catch (error) {
    console.error(`error`, error);
  }
}

const query = `
query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
  publication(host: $host) {
    url
    analytics {
      views(first: $first) {
        edges {
          node {
            id
            from
            to
            total
          }
        }
      }
      deviceViews: views(first: $first, filter: $filter groupBy: {
        dimension: DEVICE_TYPE
      }) {
        edges {
          node {
            id
            total
            ... on GroupedByDeviceTypeViews {
              id
              total
              deviceType
            }
          }
        }
      }
      browserViews: views(first: $first, filter: $filter, groupBy: {
        dimension: BROWSER
      }) {
        edges {
          node {
            id
            total
            ... on GroupedByBrowserViews {
              id
              total
              browser
            }
          }
        }
      }
      operatingSystenViews: views(first: $first, filter: $filter, groupBy: {
        dimension: OPERATING_SYSTEM
      }) {
        edges {
          node {
            id
            from
            to
            total
            ... on GroupedByOperatingSystemViews {
              id
              total
              operatingSystem
            }
          }
        }
      }
      countryViews: views(first: $first, filter: $filter, groupBy: {
        dimension: COUNTRY
      }) {
        edges {
          node {
            id
            from
            to
            total
            ... on GroupedByCountryViews {
              id
              total
              country            }
          }
        }
      }
      referrerViews: views(first: $first, filter: $filter, groupBy: {
        dimension: REFERRER_HOST
      }) {
        edges {
          node {
            id
            from
            to
            total
            ... on GroupedByReferrerHostViews {
              id
              total
              referrerHost
            }
          }
        }
      }
      pageViews: views(first: $first, filter: $filter, groupBy: {
        dimension: PAGE
      }) {
        edges {
          node {
            id
            total
            ... on GroupedByPageViews {
              id
              total
              page {
                id
                title
                slug
              }
            }
          }
        }
      }
    }
  }
}`;
