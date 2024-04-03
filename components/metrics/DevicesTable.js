import React from 'react';
import MetricsTable from './MetricsTable';
import { FormattedMessage } from 'react-intl';
import { getDeviceMessage } from 'components/messages';

export default function DevicesTable({ publicationId, ...props }) {
  return (
    <MetricsTable
      {...props}
      title={<FormattedMessage id="metrics.devices" defaultMessage="Devices" />}
      type="device"
      metric={<FormattedMessage id="metrics.visitors" defaultMessage="Visitors" />}
      publicationId={publicationId}
      renderLabel={({ x }) => getDeviceMessage(x)}
    />
  );
}
