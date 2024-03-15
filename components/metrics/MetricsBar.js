import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import Loading from 'components/common/Loading';
import ErrorMessage from 'components/common/ErrorMessage';
import useFetch from 'hooks/useFetch';
import useDateRange from 'hooks/useDateRange';
import usePageQuery from 'hooks/usePageQuery';
import useShareToken from 'hooks/useShareToken';
import { formatShortTime, formatNumber, formatLongNumber } from 'lib/format';
import { TOKEN_HEADER } from 'lib/constants';
import MetricCard from './MetricCard';
import styles from './MetricsBar.module.css';

export default function MetricsBar({ websiteId, className, domain }) {
  const shareToken = useShareToken();
  const [dateRange] = useDateRange(websiteId);
  const { startDate, endDate, modified } = dateRange;
  const [format, setFormat] = useState(true);
  const {
    query: { url, ref },
  } = usePageQuery();

  const { data, error, loading } = useFetch(
    `/api/website/${websiteId}/stats`,
    {
      params: {
        start_at: +startDate,
        end_at: +endDate,
        url,
        ref,
      },
      headers: { [TOKEN_HEADER]: shareToken?.token },
    },
    [modified, url, ref],
  );

  const { data: dataGQL } = useFetch(`/api/gql/${domain}/stats`, {
    params: {
      start_at: +startDate,
      end_at: +endDate,
    },
  });

  const formatFunc = format
    ? n => (n >= 0 ? formatLongNumber(n) : `-${formatLongNumber(Math.abs(n))}`)
    : formatNumber;

  function handleSetFormat() {
    setFormat(state => !state);
  }

  const { pageviews, uniques, bounces, totaltime } = data || {};
  const diffs = data && {
    pageviews: pageviews.value - pageviews.change,
    uniques: uniques.value - uniques.change,
    bounces: bounces.value - bounces.change,
    totaltime: totaltime.value - totaltime.change,
  };
  const views = dataGQL?.data?.publication?.analytics?.views?.edges[0]?.node;
  const pastViews = dataGQL?.data?.publication?.analytics?.pastViews?.edges[0]?.node;
  const visitors = dataGQL?.data?.publication?.analytics?.visitors?.edges[0]?.node;
  const pastVisitors = dataGQL?.data?.publication?.analytics?.pastVisitors?.edges[0]?.node;

  return (
    <div className={classNames(styles.bar, className)} onClick={handleSetFormat}>
      {!data && loading && <Loading />}
      {error && <ErrorMessage />}
      {data && !error && (
        <>
          <MetricCard
            label={<FormattedMessage id="metrics.views" defaultMessage="Views" />}
            value={views?.total || 0}
            change={Math.abs(views?.total || 0 - (pastViews?.total || 0))}
            format={formatFunc}
          />
          <MetricCard
            label={<FormattedMessage id="metrics.visitors" defaultMessage="Visitors" />}
            value={visitors?.total || 0}
            change={Math.abs(visitors?.total || 0 - (pastVisitors?.total || 0))}
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
            value={
              totaltime.value && pageviews.value
                ? totaltime.value / (pageviews.value - bounces.value)
                : 0
            }
            change={
              totaltime.value && pageviews.value
                ? (diffs.totaltime / (diffs.pageviews - diffs.bounces) -
                    totaltime.value / (pageviews.value - bounces.value)) *
                    -1 || 0
                : 0
            }
            format={n => `${n < 0 ? '-' : ''}${formatShortTime(Math.abs(~~n), ['m', 's'], ' ')}`}
          />
        </>
      )}
    </div>
  );
}
