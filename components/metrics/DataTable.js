import React, { useEffect, useState } from 'react';
import { useSpring, animated, config } from 'react-spring';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import NoData from 'components/common/NoData';
import { formatNumber, formatLongNumber } from 'lib/format';
import styles from './DataTable.module.css';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function DataTable({
  data,
  title,
  metric,
  className,
  renderLabel,
  height,
  animate = true,
  fetchMoreItems,
  virtualize = false,
  limit = 10,
}) {
  const [paginatedData, setPaginatedData] = useState(data);
  const [hasNextPage, setHasNextPage] = useState(data.length === limit);
  const [format, setFormat] = useState(true);
  const formatFunc = format ? formatLongNumber : formatNumber;
  const handleSetFormat = () => setFormat(state => !state);

  const onLoadMoreItems = async () => {
    if (paginatedData.length === 0 || !hasNextPage) return;
    const endCursor = paginatedData[paginatedData.length - 1].cursor;
    if (!endCursor) return;
    const data = await fetchMoreItems(endCursor);
    setHasNextPage(data.length === limit);
    setPaginatedData(prevData => [...prevData, ...data]);
  };

  useEffect(() => {
    setHasNextPage(data.length === limit);
    setPaginatedData(data);
  }, [data, limit]);

  const getRow = row => {
    const { x: label, y: value, z: percent } = row;

    return (
      <AnimatedRow
        key={label}
        label={
          renderLabel
            ? renderLabel(row)
            : label ?? <FormattedMessage id="label.unknown" defaultMessage="Unknown" />
        }
        value={value}
        percent={percent}
        animate={animate && !virtualize}
        format={formatFunc}
        onClick={handleSetFormat}
      />
    );
  };

  return (
    <div className={classNames(styles.table, className)}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.metric} onClick={handleSetFormat}>
          {metric}
        </div>
      </div>
      <div className={styles.body} id="scrollableDiv" style={{ height }}>
        {data?.length === 0 && <NoData />}
        {virtualize && paginatedData.length > 0 ? (
          <InfiniteScroll
            dataLength={paginatedData.length}
            next={onLoadMoreItems}
            hasMore={hasNextPage}
            loader={<p>Loading…</p>}
            endMessage={
              !hasNextPage && <p style={{ textAlign: 'center' }}>You have reached the end.</p>
            }
            scrollableTarget="scrollableDiv"
          >
            {paginatedData.map(row => getRow(row))}
          </InfiniteScroll>
        ) : (
          paginatedData.map(row => getRow(row))
        )}
      </div>
    </div>
  );
}

const AnimatedRow = ({ label, value = 0, percent, animate, format, onClick }) => {
  const props = useSpring({
    width: percent,
    y: value,
    from: { width: 0, y: 0 },
    config: animate ? config.default : { duration: 0 },
  });

  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value} onClick={onClick}>
        <animated.div className={styles.value}>{props.y?.interpolate(format)}</animated.div>
      </div>
      <div className={styles.percent}>
        <animated.div
          className={styles.bar}
          style={{ width: props.width.interpolate(n => `${n}%`) }}
        />
        <animated.span className={styles.percentValue}>
          {props.width.interpolate(n => `${n.toFixed(0)}%`)}
        </animated.span>
      </div>
    </div>
  );
};
