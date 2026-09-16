export const submittedDiffPaths = (diff: string): readonly string[] =>
  Array.from(diff.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm), (match) =>
    match[2].trim(),
  ).filter((path, index, paths) => paths.indexOf(path) === index);

export const submittedEvidencePaths = (diff: string): readonly string[] => {
  const gitPaths = submittedDiffPaths(diff);
  const unifiedHeaderPaths = Array.from(
    diff.matchAll(/^\+\+\+\s+(?:b\/)?([^\t\r\n]+)(?:\t.*)?$/gm),
    (match) => match[1].trim(),
  ).filter((path) => path !== '/dev/null');

  return [...gitPaths, ...unifiedHeaderPaths].filter(
    (path, index, paths) => paths.indexOf(path) === index,
  );
};
