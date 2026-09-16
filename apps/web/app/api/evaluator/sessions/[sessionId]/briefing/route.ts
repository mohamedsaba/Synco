import { cookies } from 'next/headers';
import { evaluatorCookieName } from '../../../../../../src/access/evaluator-access';
import { getAuthorizedEvidence } from '../../../../../../src/access/evaluator-evidence';
import { buildEvaluatorBriefing } from '../../../../../../src/evaluator/build-evaluator-briefing';
import {
  briefingDepthProfiles,
  projectBriefing,
  type BriefingDepthProfile,
} from '../../../../../../src/evaluator/project-evaluator-briefing';
import { errorResponse } from '../../../../../../src/http/error-response';
import { getAuthorizedReconstruction } from '../../../../../../src/reconstruction/evidence-reconstruction-runtime';

export const GET = async (
  request: Request,
  context: Readonly<{ params: Promise<{ sessionId: string }> }>,
) => {
  try {
    const [{ sessionId }, cookieStore] = await Promise.all([
      context.params,
      cookies(),
    ]);
    const credential = cookieStore.get(evaluatorCookieName)?.value;
    const evidence = getAuthorizedEvidence(sessionId, credential);
    const reconstruction = getAuthorizedReconstruction(sessionId, credential);
    const briefing = buildEvaluatorBriefing(evidence, reconstruction);
    const profile = new URL(request.url).searchParams.get('depth');
    if (profile === null)
      return Response.json(briefing, {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    if (!briefingDepthProfiles.includes(profile as BriefingDepthProfile))
      return Response.json(
        { error: 'Unsupported briefing depth profile.' },
        { status: 400 },
      );
    return Response.json(
      projectBriefing(briefing, profile as BriefingDepthProfile),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
};
