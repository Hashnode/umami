import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import WebsiteChart from 'components/metrics/WebsiteChart';
import WorldMap from 'components/common/WorldMap';
import Page from 'components/layout/Page';
import GridLayout, { GridRow, GridColumn } from 'components/layout/GridLayout';
import Link from 'components/common/Link';
import MenuLayout from 'components/layout/MenuLayout';
import Loading from 'components/common/Loading';
import Arrow from 'assets/arrow-right.svg';
import styles from './WebsiteDetails.module.css';
import PagesTable from '../metrics/PagesTable';
import ReferrersTable from '../metrics/ReferrersTable';
import BrowsersTable from '../metrics/BrowsersTable';
import OSTable from '../metrics/OSTable';
import DevicesTable from '../metrics/DevicesTable';
import CountriesTable from '../metrics/CountriesTable';
import usePageQuery from 'hooks/usePageQuery';
import { DEFAULT_ANIMATION_DURATION } from 'lib/constants';

const views = {
  url: PagesTable,
  referrer: ReferrersTable,
  browser: BrowsersTable,
  os: OSTable,
  device: DevicesTable,
  country: CountriesTable,
};

export default function WebsiteDetails({ publication }) {
  return <MainContent publication={publication} />;
}

function MainContent({ publication }) {
  const [chartLoaded, setChartLoaded] = useState(false);
  const [countryData, setCountryData] = useState();
  const {
    resolve,
    query: { view },
  } = usePageQuery();

  const BackButton = () => (
    <div key="back-button" className={styles.backButton}>
      <Link key="back-button" href={resolve({ view: undefined })} icon={<Arrow />} size="small">
        <FormattedMessage id="label.back" defaultMessage="Back" />
      </Link>
    </div>
  );

  const menuOptions = [
    {
      render: BackButton,
    },
    {
      label: <FormattedMessage id="metrics.pages" defaultMessage="Pages" />,
      value: resolve({ view: 'url' }),
    },
    {
      label: <FormattedMessage id="metrics.referrers" defaultMessage="Referrers" />,
      value: resolve({ view: 'referrer' }),
    },
    {
      label: <FormattedMessage id="metrics.browsers" defaultMessage="Browsers" />,
      value: resolve({ view: 'browser' }),
    },
    {
      label: <FormattedMessage id="metrics.operating-systems" defaultMessage="Operating system" />,
      value: resolve({ view: 'os' }),
    },
    {
      label: <FormattedMessage id="metrics.devices" defaultMessage="Devices" />,
      value: resolve({ view: 'device' }),
    },
    {
      label: <FormattedMessage id="metrics.countries" defaultMessage="Countries" />,
      value: resolve({ view: 'country' }),
    },
  ];

  const tableProps = {
    publicationId: publication._id,
    websiteDomain: publication.url,
    limit: 10,
    virtualize: false,
  };

  const DetailsComponent = views[view];

  function handleDataLoad() {
    if (!chartLoaded) {
      setTimeout(() => setChartLoaded(true), DEFAULT_ANIMATION_DURATION);
    }
  }

  return (
    <Page>
      <div className="row">
        <div className={classNames(styles.chart, 'col')}>
          <WebsiteChart
            publicationId={publication._id}
            title={publication.title}
            onDataLoad={handleDataLoad}
            showLink={false}
            stickyHeader
          />
          {!chartLoaded && <Loading />}
        </div>
      </div>
      {chartLoaded && !view && (
        <GridLayout>
          <GridRow>
            <GridColumn md={12} lg={6}>
              <PagesTable {...tableProps} />
            </GridColumn>
            <GridColumn md={12} lg={6}>
              <ReferrersTable {...tableProps} />
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn md={12} lg={4}>
              <BrowsersTable {...tableProps} />
            </GridColumn>
            <GridColumn md={12} lg={4}>
              <OSTable {...tableProps} />
            </GridColumn>
            <GridColumn md={12} lg={4}>
              <DevicesTable {...tableProps} />
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn xs={12} md={12} lg={8}>
              <WorldMap data={countryData} />
            </GridColumn>
            <GridColumn xs={12} md={12} lg={4}>
              <CountriesTable {...tableProps} onDataLoad={setCountryData} />
            </GridColumn>
          </GridRow>
        </GridLayout>
      )}
      {view && chartLoaded && (
        <MenuLayout
          className={styles.view}
          menuClassName={styles.menu}
          contentClassName={styles.content}
          menu={menuOptions}
        >
          <DetailsComponent
            {...tableProps}
            height={500}
            limit={25}
            animate={false}
            showFilters
            virtualize
          />
        </MenuLayout>
      )}
    </Page>
  );
}
