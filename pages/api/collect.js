import isbot from 'isbot';
import { useCors } from 'lib/middleware';
import { notFound, ok } from 'lib/response';

export default async (req, res) => {
  await useCors(req, res);

  if (isbot(req.headers['user-agent'])) {
    return ok(res);
  }

  // just pretending that this does not exist anymore
  // but keep it for being aware of requests still coming in
  console.log('Got request', { body: req.body });
  return notFound(res);
};
