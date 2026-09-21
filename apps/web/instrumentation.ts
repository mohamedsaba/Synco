export const register = async () => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startSessionTimeoutSweeper } =
    await import('./src/sessions/session-timeout-sweeper');
  startSessionTimeoutSweeper();
};
