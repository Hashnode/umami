const hashnodeEnv = process.env.NEXT_PUBLIC_HASHNODE_ENV;
const isDevEnv = hashnodeEnv === 'development';
const isStagingEnv = hashnodeEnv === 'staging';

const protocol = isDevEnv ? 'http:' : 'https:';

const publicationDomainNames = {
  development: 'app.localhost',
  staging: 'hashnode.net',
  test: 'hashnode.net',
  production: 'hashnode.dev',
};

export const getAppUrl = () => {
  const NEXT_PUBLIC_HASHNODE_ENV = process.env.NEXT_PUBLIC_HASHNODE_ENV;
  let url;

  switch (NEXT_PUBLIC_HASHNODE_ENV) {
    case 'development':
      url = 'http://localhost:8080';
      break;
    case 'staging':
      url = 'https://staging.hashnode.com';
      break;
    case 'production':
      url = 'https://hashnode.com';
      break;
    default:
      url = 'http://localhost:8080';
      break;
  }
  return url;
};

const isValidPublicationDomainNamesKey = key => key in publicationDomainNames;

export const createPublicationOrigin = publication => {
  if (!publication || (!publication?.domain && !publication?.username)) {
    // using the hashnode domain as a fallback in order to prevent errors
    return getAppUrl();
  }
  const { domain, username, domainStatus } = publication;

  const hasReadyDomain = !!domain && !!domainStatus?.ready;

  // always use prod as default to make sure prod works
  let subDomain = hasReadyDomain ? '' : `${username}.`;
  if (isDevEnv || isStagingEnv) {
    subDomain = `${username}.`;
  }

  let domainName = hasReadyDomain ? domain : publicationDomainNames.production;
  if ((isDevEnv || isStagingEnv) && isValidPublicationDomainNamesKey(hashnodeEnv)) {
    domainName = publicationDomainNames[hashnodeEnv];
  }
  return `${protocol}//${subDomain}${domainName}`;
};
