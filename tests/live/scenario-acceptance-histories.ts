import type { SessionService } from '../../apps/web/src/sessions/session-service';
import {
  applyCompleteFix,
  applyPartialFix,
  resetAndVerify,
} from './nvidia-nim-acceptance-fixtures';

export type ScenarioAcceptanceLabel = 'A' | 'B' | 'C' | 'D';

export const scenarioAcceptanceHistories: Readonly<
  Record<
    ScenarioAcceptanceLabel,
    (service: SessionService, token: string) => Promise<void>
  >
> = {
  A: async (service, token) => {
    await service.executeCommand(
      token,
      "psql -h 127.0.0.1 -U hirearchy -d inventory -t -A -c \"SELECT quantity FROM inventory WHERE warehouse_id='WH-EAST-01' AND product_id='PROD-1001';\"",
    );
    await service.executeCommand(
      token,
      'redis-cli get "stock:wh-east-01:PROD-1001"',
    );
    await service.executeCommand(token, 'pytest');
    await service.executeCommand(
      token,
      'redis-cli del "stock:wh-east-01:PROD-1001"',
    );
    await service.executeCommand(token, 'pytest');
  },
  B: async (service, token) => {
    await service.executeCommand(token, 'pytest');
    await applyPartialFix(service, token);
    await service.executeCommand(token, 'pytest');
  },
  C: async (service, token) => {
    await service.executeCommand(
      token,
      "psql -h 127.0.0.1 -U hirearchy -d inventory -t -A -c \"SELECT quantity FROM inventory WHERE warehouse_id='WH-EAST-01' AND product_id='PROD-1001';\"",
    );
    await service.executeCommand(
      token,
      'redis-cli get "stock:wh-east-01:PROD-1001"',
    );
    await service.executeCommand(token, 'pytest');
    await applyCompleteFix(service, token);
    await resetAndVerify(service, token);
  },
  D: async (service, token) => {
    await service.executeCommand(token, 'pytest');
    const original = await applyPartialFix(service, token);
    await service.executeCommand(token, 'pytest');
    await service.saveWorkspaceFile(token, 'inventory/service.py', original);
    await service.executeCommand(
      token,
      'python3 -c \'import time; time.sleep(1); open("notes.txt", "w").write("synthetic note\\n")\' >/dev/null 2>&1 &',
    );
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await service.executeCommand(token, 'pwd');
    await service.executeCommand(token, 'rm notes.txt');
    await applyCompleteFix(service, token);
    await service.executeCommand(token, 'pytest');
    await resetAndVerify(service, token);
  },
};
