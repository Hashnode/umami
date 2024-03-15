import { parse } from 'cookie';

import { ok } from 'lib/response';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, domain } = req.query;
  const data = await getAnalyticsData({ token: jwtToken, domain, startDate: start_at, endDate: end_at });
  return ok(res, data);
};

async function getAnalyticsData({ token, domain, startDate, endDate }) {
  console.log('can use start and end date', domain, startDate, endDate);
  try {
    const from = new Date(parseInt(startDate));
    const to = new Date(parseInt(endDate));
    // const pastFrom = subWeeks(from, 1);
    // const pastTo = subWeeks(to, 1);
    const data = await fetch(`https://179kej9boe.execute-api.ap-south-1.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        query,
        variables: {
          host: 'iamshadmirza.hashnode.dev',
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
    console.error(`error`, error); // TODO: remove this
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
            from
            to
            total
            ... on GroupedByDeviceTypeViews {
              id
              from
              to
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
            from
            to
            total
            ... on GroupedByBrowserViews {
              id
              from
              to
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
              from
              to
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
              from
              to
              total
              country
            }
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
              from
              to
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
            from
            to
            total
            ... on GroupedByPageViews {
              id
              from
              to
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
