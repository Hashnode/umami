import { parse } from 'cookie';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

import { ok } from 'lib/response';
import { getGQLUrl } from 'utils/urls';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, domain, groupByUnit, groupByValue, url, ref, tz } = req.query;
  const data = await getAnalyticsData({
    token: jwtToken,
    domain,
    startDate: start_at,
    endDate: end_at,
    groupByUnit,
    groupByValue,
    url,
    ref,
    timezone: tz,
  });
  return ok(res, data);
};

async function getAnalyticsData({
  token,
  domain,
  startDate,
  endDate,
  groupByUnit,
  url,
  ref,
  timezone,
}) {
  try {
    const from = new Date(parseInt(startDate)).toISOString();
    const to = new Date(parseInt(endDate)).toISOString();
    const granularity = getGroupBy(groupByUnit);
    const filter = {
      time: {
        absolute: {
          from,
          to,
        },
      },
    };
    if (url) {
      filter.paths = [url];
    }
    if (ref) {
      filter.referrerHosts = [ref];
    }
    const variables = {
      host: domain,
      first: 100,
      filter,
      groupBy: {
        granularity,
      },
      options: {
        responseTimezone: timezone,
      },
      visitorsFilter: filter,
      visitorsGroupBy: {
        granularity,
      },
      visitorsOptions: {
        responseTimezone: timezone,
      },
    };

    const data = await fetch(getGQLUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    const response = await data.json();
    return mapData(response, timezone);
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
    $options: PublicationViewsOptions
    $visitorsOptions: PublicationVisitorsOptions
  ) {
    publication(host: $host) {
      url
      analytics {
        views(first: $first, filter: $filter, groupBy: $groupBy, options: $options) {
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
        visitors(
          first: $first
          filter: $visitorsFilter
          groupBy: $visitorsGroupBy
          options: $visitorsOptions
        ) {
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

const mapData = (data, timezone) => {
  const pageviews = data?.data?.publication?.analytics?.views?.edges.map(item => ({
    t: format(utcToZonedTime(new Date(item.node.to), timezone), 'yyyy-MM-dd HH:mm:ss'),
    y: item.node.total,
  }));
  const sessions = data?.data?.publication?.analytics?.visitors?.edges.map(item => ({
    t: format(utcToZonedTime(new Date(item.node.to), timezone), 'yyyy-MM-dd HH:mm:ss'),
    y: item.node.total,
  }));
  return {
    pageviews,
    sessions,
  };
};
