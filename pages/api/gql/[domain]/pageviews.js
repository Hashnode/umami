import { parse } from 'cookie';
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

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
    const fromWithTimezone = zonedTimeToUtc(new Date(parseInt(startDate)), timezone);
    const from = new Date(fromWithTimezone).toISOString();
    const toWithTimezone = zonedTimeToUtc(new Date(parseInt(endDate)), timezone);
    const to = new Date(toWithTimezone).toISOString();
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
          filter: filter,
          visitorsFilter: filter,
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
