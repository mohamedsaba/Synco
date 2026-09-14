import { createHash, timingSafeEqual } from 'node:crypto';

export const evaluatorCookieName = 'delimit_evaluator';

export const createEvaluatorCookieValue = (credential: string) =>
  createHash('sha256')
    .update(`delimit-evaluator:${credential}`)
    .digest('base64url');

export const isEvaluatorCredentialValid = (
  suppliedCredential: string,
  configuredCredential = process.env.DELIMIT_EVALUATOR_KEY,
) => {
  if (!configuredCredential) {
    return false;
  }

  const supplied = Buffer.from(createEvaluatorCookieValue(suppliedCredential));
  const configured = Buffer.from(
    createEvaluatorCookieValue(configuredCredential),
  );

  return (
    supplied.length === configured.length &&
    timingSafeEqual(supplied, configured)
  );
};

export const isEvaluatorCookieValid = (
  suppliedCookie: string | undefined,
  configuredCredential = process.env.DELIMIT_EVALUATOR_KEY,
) => {
  if (!suppliedCookie || !configuredCredential) {
    return false;
  }

  const supplied = Buffer.from(suppliedCookie);
  const configured = Buffer.from(
    createEvaluatorCookieValue(configuredCredential),
  );

  return (
    supplied.length === configured.length &&
    timingSafeEqual(supplied, configured)
  );
};
