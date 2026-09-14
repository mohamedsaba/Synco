export type HealthStatus = Readonly<{
  service: 'delimit-web';
  status: 'ok';
}>;

export const getHealthStatus = (): HealthStatus => ({
  service: 'delimit-web',
  status: 'ok',
});
