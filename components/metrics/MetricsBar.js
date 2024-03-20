import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import Loading from 'components/common/Loading';
import ErrorMessage from 'components/common/ErrorMessage';
import useFetch from 'hooks/useFetch';
import useDateRange from 'hooks/useDateRange';
import { formatShortTime, formatNumber, formatLongNumber } from 'lib/format';
import MetricCard from './MetricCard';
import styles from './MetricsBar.module.css';
import usePageQuery from 'hooks/usePageQuery';

export default function MetricsBar({ websiteId, className, domain }) {
  const [dateRange] = useDateRange(websiteId);
  const { startDate, endDate, modified, unit, value} = dateRange;
  const [format, setFormat] = useState(true);
  const {
    query: { url, ref },
  } = usePageQuery();

  const { data, error, loading } = useFetch(
    `/api/gql/${domain}/stats`,
    {
      params: {
        start_at: +startDate,
        end_at: +endDate,
        url,
        ref,
        groupByUnit:  unit,
        groupByValue: value,
      },
    },
    [modified, url, ref],
  );

  const formatFunc = format
    ? n => (n >= 0 ? formatLongNumber(n) : `-${formatLongNumber(Math.abs(n))}`)
    : formatNumber;

  function handleSetFormat() {
    setFormat(state => !state);
  }

  const views = data?.data?.publication?.analytics?.views?.edges[0]?.node;
  const pastViews = data?.data?.publication?.analytics?.pastViews?.edges[0]?.node;
  const visitors = data?.data?.publication?.analytics?.visitors?.edges[0]?.node;
  const pastVisitors = data?.data?.publication?.analytics?.pastVisitors?.edges[0]?.node;
  const averageVisitTimeInSeconds =
    data?.data?.publication?.analytics?.averageVisitTimeInSeconds;
  const pastAverageVisitTimeInSeconds =
    data?.data?.publication?.analytics?.pastAverageVisitTimeInSeconds;

  return (
    <div className={classNames(styles.bar, className)} onClick={handleSetFormat}>
      {!data && loading && <Loading />}
      {error && <ErrorMessage />}
      {data && !error && (
        <>
          <MetricCard
            label={<FormattedMessage id="metrics.views" defaultMessage="Views" />}
            value={views?.total || 0}
            change={(views?.total || 0) - (pastViews?.total || 0)}
            format={formatFunc}
          />
          <MetricCard
            label={<FormattedMessage id="metrics.visitors" defaultMessage="Visitors" />}
            value={visitors?.total || 0}
            change={(visitors?.total || 0) - (pastVisitors?.total || 0)}
            format={formatFunc}
          />
          {/* <MetricCard
            label={<FormattedMessage id="metrics.bounce-rate" defaultMessage="Bounce rate" />}
            value={uniques.value ? (num / uniques.value) * 100 : 0}
            change={
              uniques.value && uniques.change
                ? (num / uniques.value) * 100 -
                    (Math.min(diffs.uniques, diffs.bounces) / diffs.uniques) * 100 || 0
                : 0
            }
            format={n => Number(n).toFixed(0) + '%'}
            reverseColors
          /> */}
          <MetricCard
            label={
              <FormattedMessage
                id="metrics.average-visit-time"
                defaultMessage="Average visit time"
              />
            }
            value={averageVisitTimeInSeconds}
            change={averageVisitTimeInSeconds - pastAverageVisitTimeInSeconds}
            format={n => `${n < 0 ? '-' : ''}${formatShortTime(Math.abs(~~n), ['m', 's'], ' ')}`}
          />
        </>
      )}
    </div>
  );
}
