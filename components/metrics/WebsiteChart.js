import React, { useMemo } from 'react';
import classNames from 'classnames';
import PageviewsChart from './PageviewsChart';
import MetricsBar from './MetricsBar';
import DateFilter from 'components/common/DateFilter';
import StickyHeader from 'components/helpers/StickyHeader';
import useFetch from 'hooks/useFetch';
import useDateRange from 'hooks/useDateRange';
import usePageQuery from 'hooks/usePageQuery';
import ErrorMessage from 'components/common/ErrorMessage';
import FilterTags from 'components/metrics/FilterTags';
import { getDateArray, getDateLength } from 'lib/date';
import styles from './WebsiteChart.module.css';
import useTimezone from 'hooks/useTimezone';

export default function WebsiteChart({
  publicationId,
  //title,
  stickyHeader = false,
  //showLink = false,
  hideChart = false,
  onDataLoad = () => {},
}) {
  const [dateRange, setDateRange] = useDateRange(publicationId);
  const { startDate, endDate, unit, value, modified } = dateRange;
  const {
    router,
    resolve,
    query: { url, ref },
  } = usePageQuery();
  const [timezone] = useTimezone();

  const { data, loading, error } = useFetch(
    `/api/gql/${publicationId}/pageviews`,
    {
      params: {
        start_at: +startDate,
        end_at: +endDate,
        url,
        ref,
        groupByUnit: unit,
        groupByValue: value,
        tz: timezone,
      },
      onDataLoad,
    },
    [modified, url, ref],
  );

  const chartData = useMemo(() => {
    if (data) {
      return {
        pageviews: getDateArray(data.pageviews, startDate, endDate, unit),
        sessions: getDateArray(data.sessions, startDate, endDate, unit),
      };
    }
    return { pageviews: [], sessions: [] };
  }, [data]);

  function handleCloseFilter(param) {
    router.push(resolve({ [param]: undefined }));
  }

  return (
    <div className={styles.container}>
      <div className={classNames(styles.header, 'row')}>
        <StickyHeader
          className={classNames(styles.metrics, 'col row')}
          stickyClassName={styles.sticky}
          enabled={stickyHeader}
        >
          <FilterTags params={{ url, ref }} onClick={handleCloseFilter} />
          <div className="col-12 col-lg-9">
            <MetricsBar publicationId={publicationId} />
          </div>
          <div className={classNames(styles.filter, 'col-12 col-lg-3')}>
            <DateFilter
              value={value}
              startDate={startDate}
              endDate={endDate}
              onChange={setDateRange}
            />
          </div>
        </StickyHeader>
      </div>
      <div className="row">
        <div className={classNames(styles.chart, 'col')}>
          {error && <ErrorMessage />}
          {!hideChart && (
            <PageviewsChart
              publicationId={publicationId}
              data={chartData}
              unit={unit}
              records={getDateLength(startDate, endDate, unit)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
