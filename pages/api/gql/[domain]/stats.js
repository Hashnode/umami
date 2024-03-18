import { parse } from 'cookie';
import { differenceInMinutes, sub, subWeeks } from 'date-fns';

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
    const from = subWeeks(new Date(parseInt(startDate)), 1);
    const to = new Date(parseInt(endDate));
    const difference = differenceInMinutes(to, from);
    const pastFrom = subWeeks(sub(from, {
      minutes: difference,
    }), 1);
    const pastTo = sub(to, {
      minutes: difference,
    });
    const data = await fetch(`https://179kej9boe.execute-api.ap-south-1.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        query,
        variables: {
          host: domain,
          first: 5,
          filter: {
            time: {
              absolute: {
                from,
                to,
              },
            },
          },
          pastFilter: {
            time: {
              absolute: {
                from: pastFrom,
                to: pastTo,
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
          visitorsPastFilter: {
            time: {
              absolute: {
                from: pastFrom,
                to: pastTo,
              },
            },
          },
          averageVisitTimeFilter: {
            time: {
              absolute: {
                from: pastFrom,
                to: pastTo,
              },
            },
          },
          pastAverageVisitTimeFilter: {
            time: {
              absolute: {
                from: '2024-02-11T06:02:24.278Z',
                to: '2024-03-12T06:02:24.278Z',
              },
            },
          },
        },
      }),
    });
    const response = await data.json();
    return response;
  } catch (error) {
    console.error(`error stats`, error); // TODO: remove this
  }
}

const query = `
  query Query(
    $host: String
    $first: Int!
    $filter: PublicationViewsFilter
    $pastFilter: PublicationViewsFilter
    $visitorsFilter: PublicationVisitorsFilter
    $visitorsPastFilter: PublicationVisitorsFilter
    $averageVisitTimeFilter: AverageVisitTimeFilter
    $pastAverageVisitTimeFilter: AverageVisitTimeFilter
  ) {
    publication(host: $host) {
      url
      analytics {
        views(first: $first, filter: $filter) {
          edges {
            node {
              id
              total
            }
          }
        }
        pastViews: views(first: $first, filter: $pastFilter) {
          edges {
            node {
              id
              total
            }
          }
        }
        visitors(first: $first, filter: $visitorsFilter) {
          edges {
            node {
              id
              total
            }
          }
        }
        pastVisitors: visitors(first: $first, filter: $visitorsPastFilter) {
          edges {
            node {
              id
              total
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
