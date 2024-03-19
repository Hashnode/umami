import { parse } from 'cookie';

import { ok } from 'lib/response';
import { getGQLUrl } from 'utils/urls';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, domain, type, limit, cursor } = req.query;
  const data = await getAnalyticsData({
    token: jwtToken,
    domain,
    type,
    limit,
    cursor,
    startDate: start_at,
    endDate: end_at,
  });
  return ok(res, data);
};

async function getAnalyticsData({ token, type, limit, cursor, domain, startDate, endDate }) {
  try {
    const from = new Date(parseInt(startDate)).toISOString();
    const to = new Date(parseInt(endDate)).toISOString();
    const data = await fetch(getGQLUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        query: getQuery(type),
        variables: {
          host: domain,
          first: parseInt(limit || 5),
          after: cursor || null,
          filter: {
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
    return dataMappers(type, response);
  } catch (error) {
    throw new Error(error);
  }
}

function getQuery(type) {
  switch (type) {
    case 'device':
      return `
        query Query($host: String, $first: Int!, $after: String, $filter: PublicationVisitorsFilter) {
        publication(host: $host) {
            url
            analytics {
            totalViews: visitors(first: $first, filter: $filter) {
                edges {
                node {
                    id
                    total
                }
                }
            }
            deviceViews: visitors(
                first: $first
                after: $after
                filter: $filter
                groupBy: { dimension: DEVICE_TYPE }
            ) {
                edges {
                  cursor
                  node {
                      id
                      total
                      ... on GroupedByDeviceTypeVisitors {
                      id
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
            query Query($host: String, $first: Int!, $after: String, $filter: PublicationVisitorsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: visitors(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    total
                                    }
                                }
                            }
                        browserViews: visitors(first: $first, after: $after, filter: $filter, groupBy: {
                            dimension: BROWSER
                        }) {
                            edges {
                            cursor
                            node {
                                id
                                total
                                ... on GroupedByBrowserVisitors {
                                    id
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
            query Query($host: String, $first: Int!, $after: String, $filter: PublicationVisitorsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: visitors(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    total
                                    }
                                }
                            }
                        operatingSystenViews: visitors(first: $first, after: $after, filter: $filter, groupBy: {
                            dimension: OPERATING_SYSTEM
                        }) {
                            edges {
                            cursor
                            node {
                                id
                                total
                                ... on GroupedByOperatingSystemVisitors {
                                    id
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
        query Query($host: String, $first: Int!, $after: String, $filter: PublicationVisitorsFilter) {
        publication(host: $host) {
            url
            analytics {
            totalViews: visitors(first: $first, filter: $filter) {
                edges {
                  node {
                    id
                    total
                  }
                }
            }
            countryViews: visitors(
                first: $first
                filter: $filter
                after: $after
                groupBy: { dimension: COUNTRY }
            ) {
                edges {
                cursor
                node {
                    id
                    total
                    ... on GroupedByCountryVisitors {
                    id
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
            query Query($host: String, $first: Int!, $after: String, $filter: PublicationViewsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: views(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    total
                                    }
                                }
                            }
                        referrerViews: views(first: $first, after: $after, filter: $filter, groupBy: {
                            dimension: REFERRER_HOST
                        }) {
                            edges {
                            cursor
                            node {
                                id
                                total
                                ... on GroupedByReferrerHostViews {
                                    id
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
            query Query($host: String, $first: Int!, $after: String, $filter: PublicationViewsFilter) {
                publication(host: $host) {
                    url
                    analytics {
                        totalViews: views(first: $first, filter: $filter) {
                                edges {
                                node {
                                    id
                                    total
                                    }
                                }
                            }
                        pathViews: views(first: $first, after: $after, filter: $filter, groupBy: {
                            dimension: PATH
                        }) {
                            edges {
                            cursor
                            node {
                                id
                                total
                                ... on GroupedByPathViews {
                                    id
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
                                cursor
                                node {
                                    id
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
      return edges.map(({ node, cursor }) => ({
        x: node.deviceType.toLowerCase(),
        y: node.total,
        z: (node.total / totalViews) * 100,
        cursor,
      }));
    }
    case 'browser': {
      const edges = data?.data?.publication?.analytics?.browserViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node, cursor }) => ({
        x: node.browser,
        y: node.total,
        z: (node.total / totalViews) * 100,
        cursor,
      }));
    }
    case 'os': {
      const edges = data?.data?.publication?.analytics?.operatingSystenViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node, cursor }) => ({
        x: node.operatingSystem,
        y: node.total,
        z: (node.total / totalViews) * 100,
        cursor,
      }));
    }
    case 'country': {
      const edges = data?.data?.publication?.analytics?.countryViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node, cursor }) => ({
        x: node.country,
        y: node.total,
        z: (node.total / totalViews) * 100,
        cursor,
      }));
    }
    case 'referrer': {
      const edges = data?.data?.publication?.analytics?.referrerViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node, cursor }) => ({
        x: 'https://' + node.referrerHost,
        y: node.total,
        z: (node.total / totalViews) * 100,
        cursor,
      }));
    }
    case 'url': {
      const edges = data?.data?.publication?.analytics?.pathViews?.edges || [];
      const totalViews = data?.data?.publication?.analytics?.totalViews?.edges[0]?.node?.total;
      return edges.map(({ node, cursor }) => ({
        x: node.path,
        y: node.total,
        z: (node.total / totalViews) * 100,
        cursor,
      }));
    }
    default: {
      return data;
    }
  }
}
