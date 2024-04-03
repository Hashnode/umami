import React from 'react';
import { FormattedMessage } from 'react-intl';
import MetricsTable from './MetricsTable';
import { browserFilter } from 'lib/filters';

export default function BrowsersTable({ publicationId, ...props }) {
  return (
    <MetricsTable
      {...props}
      title={<FormattedMessage id="metrics.browsers" defaultMessage="Browsers" />}
      type="browser"
      metric={<FormattedMessage id="metrics.visitors" defaultMessage="Visitors" />}
      publicationId={publicationId}
      dataFilter={browserFilter}
    />
  );
}
