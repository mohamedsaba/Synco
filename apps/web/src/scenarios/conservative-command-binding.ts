// Deliberately not a shell parser. Unsupported syntax has no semantic meaning.
export const directCommandArgv = (
  command: string,
): readonly string[] | null => {
  const tokens: string[] = [];
  const pattern = /"([^"$`\\]*)"|'([^']*)'|([^\s"'\\$`;&|<>()]+)/gy;
  let offset = 0;
  while (offset < command.length) {
    while (/\s/.test(command[offset] ?? '') && offset < command.length)
      offset += 1;
    if (offset === command.length) break;
    pattern.lastIndex = offset;
    const match = pattern.exec(command);
    if (!match) return null;
    tokens.push(match[1] ?? match[2] ?? match[3]);
    offset = pattern.lastIndex;
    if (offset < command.length && !/\s/.test(command[offset])) return null;
  }
  return tokens.length > 0 ? tokens : null;
};

export const conservativeReadTarget = (
  argv: readonly string[],
): 'cache' | 'database' | null => {
  if (
    argv.length === 3 &&
    argv[0] === 'redis-cli' &&
    argv[1].toLowerCase() === 'get' &&
    /^stock:[a-z0-9-]+:[A-Z0-9-]+$/.test(argv[2])
  )
    return 'cache';
  const prefix = [
    'psql',
    '-h',
    '127.0.0.1',
    '-U',
    'delimit',
    '-d',
    'inventory',
    '-t',
    '-A',
    '-c',
  ];
  if (
    argv.length === prefix.length + 1 &&
    prefix.every((value, index) => argv[index] === value) &&
    /^SELECT quantity FROM inventory WHERE warehouse_id='[A-Z0-9-]+' AND product_id='[A-Z0-9-]+';$/.test(
      argv.at(-1) ?? '',
    )
  )
    return 'database';
  return null;
};

export const isDirectPytest = (argv: readonly string[] | null) =>
  argv !== null &&
  argv[0] === 'pytest' &&
  argv
    .slice(1)
    .every((arg) =>
      /^-(?:q|v|x)$|^--(?:disable-warnings|maxfail=\d+)$|^tests\/[a-zA-Z0-9_./:-]+$/.test(
        arg,
      ),
    );
