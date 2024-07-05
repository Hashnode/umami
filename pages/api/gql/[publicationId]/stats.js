import { parse } from 'cookie';
import { differenceInDays, differenceInMinutes, sub } from 'date-fns';

import { ok } from 'lib/response';
import { getGQLUrl } from 'utils/urls';
// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  const jwtToken = parse(req.headers.cookie || '')['jwt'];
  const { start_at, end_at, publicationId, groupByUnit, groupByValue, url, ref } = req.query;
  const data = await getAnalyticsData({
    token: jwtToken,
    publicationId,
    startDate: start_at,
    endDate: end_at,
    groupByUnit,
    groupByValue,
    url,
    ref,
  });
  return ok(res, data);
};

async function getAnalyticsData({
  token,
  publicationId,
  startDate,
  endDate,
  groupByValue,
  url,
  ref,
}) {
  try {
    const from = new Date(parseInt(startDate));
    const to = new Date(parseInt(endDate));
    const differenceKeyValuePair = getDifferenceKeyValuePair(groupByValue, from, to);
    const pastFrom = sub(from, differenceKeyValuePair);
    const pastTo = from;
    const presentFilter = {
      time: {
        absolute: {
          from,
          to,
        },
      },
    };
    const pastFilter = {
      time: {
        absolute: {
          from: pastFrom,
          to: pastTo,
        },
      },
    };
    if (url) {
      presentFilter.paths = [url];
      pastFilter.paths = [url];
    }
    if (ref) {
      presentFilter.referrerHosts = [ref];
      pastFilter.referrerHosts = [ref];
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
          id: publicationId,
          first: 1,
          filter: presentFilter,
          pastFilter: pastFilter,
          visitorsFilter: presentFilter,
          visitorsPastFilter: pastFilter,
          averageVisitTimeFilter: presentFilter,
          pastAverageVisitTimeFilter: pastFilter,
        },
      }),
    });
    const response = await data.json();
    return response;
  } catch (error) {
    console.error(`error stats`, error);
  }
}

function getDifferenceKeyValuePair(unit, from, to) {
  switch (unit) {
    case '1day':
      return {
        days: 1,
      };
    case '7day':
      return {
        days: 7,
      };
    case '24hour':
      return {
        hours: 24,
      };
    case '1week':
      return {
        weeks: 1,
      };
    case '1month':
      return {
        months: 1,
      };
    case '1year':
      return {
        years: 1,
      };
    case '30day':
      return {
        days: 30,
      };
    case '90day':
      return {
        days: 90,
      };
    case 'custom':
      return {
        days: Math.abs(differenceInDays(from, to)),
      };
    default:
      return Math.abs(differenceInMinutes(from, to));
  }
}

const query = /* GraphQL */ `
  query Stats(
    $id: ObjectId
    $first: Int!
    $filter: PublicationViewsFilter
    $pastFilter: PublicationViewsFilter
    $visitorsFilter: PublicationVisitorsFilter
    $visitorsPastFilter: PublicationVisitorsFilter
    $averageVisitTimeFilter: AverageVisitTimeFilter
    $pastAverageVisitTimeFilter: AverageVisitTimeFilter
  ) {
    publication(id: $id) {
      url
      analytics {
        views(first: $first, filter: $filter) {
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
        pastViews: views(first: $first, filter: $pastFilter) {
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
        visitors(first: $first, filter: $visitorsFilter) {
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
        pastVisitors: visitors(first: $first, filter: $visitorsPastFilter) {
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
        averageVisitTimeInSeconds(filter: $averageVisitTimeFilter)
        pastAverageVisitTimeInSeconds: averageVisitTimeInSeconds(
          filter: $pastAverageVisitTimeFilter
        )
      }
    }
  }
`;
