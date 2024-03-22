import React, { useMemo } from 'react';
import classNames from 'classnames';
import PageviewsChart from './PageviewsChart';
import MetricsBar from './MetricsBar';
//import WebsiteHeader from './WebsiteHeader';
import DateFilter from 'components/common/DateFilter';
import StickyHeader from 'components/helpers/StickyHeader';
import useFetch from 'hooks/useFetch';
import useDateRange from 'hooks/useDateRange';
import usePageQuery from 'hooks/usePageQuery';
import ErrorMessage from 'components/common/ErrorMessage';
import FilterTags from 'components/metrics/FilterTags';
import { getDateArray, getDateLength } from 'lib/date';
import styles from './WebsiteChart.module.css';

export default function WebsiteChart({
  websiteId,
  //title,
  domain,
  stickyHeader = false,
  //showLink = false,
  hideChart = false,
  onDataLoad = () => {},
}) {
  const [dateRange, setDateRange] = useDateRange(websiteId);
  const { startDate, endDate, unit, value, modified } = dateRange;
  const {
    router,
    resolve,
    query: { url, ref },
  } = usePageQuery();

  const { data, loading, error } = useFetch(
    `/api/gql/${domain}/pageviews`,
    {
      params: {
        start_at: +startDate,
        end_at: +endDate,
        url,
        ref,
        groupByUnit: unit,
        groupByValue: value,
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
      {/* <WebsiteHeader websiteId={websiteId} title={title} domain={domain} showLink={showLink} /> */}
      <div className={classNames(styles.header, 'row')}>
        <StickyHeader
          className={classNames(styles.metrics, 'col row')}
          stickyClassName={styles.sticky}
          enabled={stickyHeader}
        >
          <FilterTags params={{ url, ref }} onClick={handleCloseFilter} />
          <div className="col-12 col-lg-9">
            <MetricsBar websiteId={websiteId} domain={domain} />
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
              websiteId={websiteId}
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
