import React, { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import firstBy from 'thenby';
import classNames from 'classnames';
import Link from 'components/common/Link';
import Loading from 'components/common/Loading';
import useFetch from 'hooks/useFetch';
import Arrow from 'assets/arrow-right.svg';
import useDateRange from 'hooks/useDateRange';
import usePageQuery from 'hooks/usePageQuery';
import ErrorMessage from 'components/common/ErrorMessage';
import DataTable from './DataTable';
import { DEFAULT_ANIMATION_DURATION } from 'lib/constants';
import styles from './MetricsTable.module.css';

export default function MetricsTable({
  websiteId,
  websiteDomain,
  type,
  className,
  dataFilter,
  filterOptions,
  limit,
  onDataLoad,
  ...props
}) {
  const [dateRange] = useDateRange(websiteId);
  const { startDate, endDate, modified } = dateRange;
  const {
    resolve,
    router,
    query: { url, ref },
  } = usePageQuery();

  const { data, loading, error } = useFetch(
    `/api/gql/${websiteDomain}/metrics`,
    {
      params: {
        type,
        start_at: +startDate,
        end_at: +endDate,
        limit: limit || 10,
      },
      onDataLoad,
      delay: DEFAULT_ANIMATION_DURATION,
    },
    [modified, url, ref],
  );

  const filteredData = useMemo(() => {
    if (data) {
      const items = data;
      if (limit) {
        return items.filter((e, i) => i < limit).sort(firstBy('y', -1).thenBy('x'));
      }
      return items.sort(firstBy('y', -1).thenBy('x'));
    }
    return [];
  }, [data, error, dataFilter, filterOptions]);

  return (
    <div className={classNames(styles.container, className)}>
      {!data && loading && <Loading />}
      {error && <ErrorMessage />}
      {data && !error && (
        <DataTable {...props} data={filteredData} className={className} virtualize={!limit} />
      )}
      <div className={styles.footer}>
        {data && !error && limit && (
          <Link
            icon={<Arrow />}
            href={router.pathname}
            as={resolve({ view: type })}
            size="small"
            iconRight
          >
            <FormattedMessage id="label.more" defaultMessage="More" />
          </Link>
        )}
      </div>
    </div>
  );
}
