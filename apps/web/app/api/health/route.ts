import { getHealthStatus } from '../../../src/health';

export const GET = () => Response.json(getHealthStatus());
