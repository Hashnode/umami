import React from 'react';
import MetricsTable from './MetricsTable';
import { FormattedMessage } from 'react-intl';

export default function OSTable({ publicationId, ...props }) {
  return (
    <MetricsTable
      {...props}
      title={<FormattedMessage id="metrics.operating-systems" defaultMessage="Operating system" />}
      type="os"
      metric={<FormattedMessage id="metrics.visitors" defaultMessage="Visitors" />}
      publicationId={publicationId}
    />
  );
}
