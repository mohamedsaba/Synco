export type HealthStatus = Readonly<{
  service: 'hirearchy-web';
  status: 'ok';
}>;

export const getHealthStatus = (): HealthStatus => ({
  service: 'hirearchy-web',
  status: 'ok',
});
