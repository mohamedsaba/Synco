import type { EvidencePacketV1 } from './evidence-packet';

export type GeneratedReconstruction = Readonly<{
  output: unknown;
  providerId: string;
  modelId: string;
  requestId?: string;
}>;

export interface EvidenceReconstructionGenerator {
  readonly providerId?: string;
  readonly modelId?: string;
  readonly versionId?: string;

  generate(
    packet: EvidencePacketV1,
    options: Readonly<{ signal: AbortSignal }>,
  ): Promise<GeneratedReconstruction>;
}

export class FakeEvidenceReconstructionGenerator implements EvidenceReconstructionGenerator {
  readonly calls: EvidencePacketV1[] = [];

  constructor(
    private readonly result:
      | GeneratedReconstruction
      | ((
          packet: EvidencePacketV1,
        ) => GeneratedReconstruction | Promise<GeneratedReconstruction>),
  ) {}

  async generate(packet: EvidencePacketV1) {
    this.calls.push(packet);
    return typeof this.result === 'function'
      ? this.result(packet)
      : this.result;
  }
}
