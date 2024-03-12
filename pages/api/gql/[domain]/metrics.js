import { parse } from 'cookie';

import { ok } from 'lib/response';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, domain, type, limit } = req.query;
  const data = await getAnalyticsData({
    token: jwtToken,
    domain,
    type,
    limit,
    startDate: start_at,
    endDate: end_at,
  });
  return ok(res, data);
};

async function getAnalyticsData({ token, type, limit, domain, startDate, endDate }) {
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
        query: getQuery(type),
        variables: {
          // host: domain.replace('.dev', '.hashnode.dev'), // TODO: Remove replace, this is for testing only
          host: "iamshadmirza.hashnode.dev",
          first: parseInt(limit || 10),
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
    return dataMappers(type, response);
  } catch (error) {
    console.error(`error`, error); // TODO: remove this
  }
}

function getQuery(type) {
  switch (type) {
    case 'device':
      return `
        query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
        publication(host: $host) {
            url
            analytics {
            totalViews: views(first: $first, filter: $filter) {
                edges {
                node {
                    id
                    from
                    to
                    total
                }
                }
            }
            deviceViews: views(
                first: $first
                filter: $filter
                groupBy: { dimension: DEVICE_TYPE }
            ) {
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
            }
        }
        }
    `;
    case 'browser':
      return `
            query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: views(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    from
                                    to
                                    total
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
                    }
                }
            }
        `;
    case 'os':
      return `
            query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: views(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    from
                                    to
                                    total
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
                    }
                }
            }
        `;
    case 'country':
      return `
        query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
        publication(host: $host) {
            url
            analytics {
            totalViews: views(first: $first, filter: $filter) {
                edges {
                node {
                    id
                    from
                    to
                    total
                }
                }
            }
            countryViews: views(
                first: $first
                filter: $filter
                groupBy: { dimension: COUNTRY }
            ) {
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
            }
        }
        }
        `;
    case 'referrer':
      return `
            query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: views(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    from
                                    to
                                    total
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
                    }
                }
            }
        `;
    case 'url':
      return `
            query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: views(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    from
                                    to
                                    total
                                    }
                                }
                            }
                        pathViews: views(first: $first, filter: $filter, groupBy: {
                            dimension: PATH
                        }) {
                            edges {
                            node {
                                id
                                from
                                to
                                total
                                ... on GroupedByPathViews {
                                    id
                                    from
                                    to
                                    total
                                    path
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
    default:
      return `
                query Query($host: String, $first: Int!, $filter: PublicationViewsFilter) {
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
                        }
                    }
                }
            `;
  }
}

function dataMappers(type, data) {
  switch (type) {
    case 'device': {
      const edges = data?.data?.publication?.analytics?.deviceViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node }) => ({
        x: node.deviceType.toLowerCase(),
        y: node.total,
        z: (node.total / totalViews) * 100,
      }));
    }
    case 'browser': {
      const edges = data?.data?.publication?.analytics?.browserViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node }) => ({
        x: node.browser,
        y: node.total,
        z: (node.total / totalViews) * 100,
      }));
    }
    case 'os': {
      const edges = data?.data?.publication?.analytics?.operatingSystenViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node }) => ({
        x: node.operatingSystem,
        y: node.total,
        z: (node.total / totalViews) * 100,
      }));
    }
    case 'country': {
      const edges = data?.data?.publication?.analytics?.countryViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node }) => ({
        x: node.country,
        y: node.total,
        z: (node.total / totalViews) * 100,
      }));
    }
    case 'referrer': {
      const edges = data?.data?.publication?.analytics?.referrerViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node }) => ({
        x: node.referrerHost,
        y: node.total,
        z: (node.total / totalViews) * 100,
      }));
    }
    case 'url': {
      const edges = data?.data?.publication?.analytics?.pathViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node }) => ({
        x: node.path,
        y: node.total,
        z: (node.total / totalViews) * 100,
      }));
    }
    default: {
      return data;
    }
  }
}
