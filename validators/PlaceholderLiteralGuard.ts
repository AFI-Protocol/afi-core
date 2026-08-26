/**
 * DEM-PLACEHOLDER-GUARD — the terminal enforcement of D-DEM-4(5)
 * (DEM-GOV §9 DEM-PLACEHOLDER-GUARD, owner-authorized 2026-08-25):
 *
 *   "a CI guard asserts that no expression in `afi-core/analysts/**` or
 *    `afi-reactor/src/pipeline/nodes/**` assigns a `FroggyTrendPullbackInput`
 *    field from a compile-time constant, and a negative test proves the guard
 *    fails on a reintroduced one. Values sourced from a registered mapping
 *    document are expressly exempt — including its declared `default`
 *    literals, `band` output ordinals, `recode` target members, and
 *    `namespace-default` empty objects — as is the reserved `liquiditySwept`
 *    computation, which is not a literal."
 *
 * HOW IT DECIDES. The field set is read from the `FroggyTrendPullbackInput`
 * interface itself, so it can never drift from the rubric's contract. A
 * finding is an assignment to one of those field NAMES whose value is
 * CONSTANT — decided by the TYPE CHECKER as well as the syntax tree, so a
 * constant imported across a package boundary (the exact form the retired
 * `BROKE_EMA_WITH_BODY_UNIMPLEMENTED_STUB` took at `laneView.ts:79`, where the
 * initializer lives in another repo's `.d.ts`) is caught just like a local
 * literal. Mapping-sourced values are never constant — they flow from an
 * interpreter result at runtime — so the exemption holds by construction.
 *
 * The `typescript` compiler API is imported LAZILY so this module stays inert
 * (and dependency-free at runtime) unless a test actually invokes it.
 */

export interface PlaceholderFinding {
  /** Repo-relative path of the offending file. */
  file: string;
  /** 1-indexed line. */
  line: number;
  /** The scorer-input field being assigned. */
  field: string;
  /** The offending source text (trimmed). */
  text: string;
  /** Why it is a constant. */
  reason: string;
}

export interface GuardOptions {
  /** tsconfig whose program the scan runs in (its `include` set is scanned). */
  tsconfigPath: string;
  /** Directories (repo-relative) the guard is bounded to, per D-DEM-4(5). */
  bounds: string[];
  /** Repo root the reported paths are relative to. */
  repoRoot: string;
  /**
   * Fields exempt by the accepted text: `liquiditySwept` (the reserved
   * two-lane computation, D-DEM-3(5)).
   */
  exemptFields?: string[];
  /**
   * D-DEM-4(5)'s mapping-sourced exemption, made checkable: the REGISTERED
   * mapping's declared `default` literals, keyed by binding target. A constant
   * is exempt only where its value EQUALS the registered default for that same
   * target — so the grandfathered `?? 0` / `?? false` the retired adapter
   * still applies (its physical deletion is reserved by DEM-BIND ruling R1)
   * cannot drift from the registered document, and any OTHER literal at the
   * same site still fires.
   */
  mappingDeclaredDefaults?: Record<string, string | number | boolean>;
  /** Extra in-memory sources to scan (negative-test fixtures). */
  extraSources?: Array<{ fileName: string; content: string }>;
}

const DEFAULT_EXEMPT_FIELDS = ["liquiditySwept"];

/** Test directories are exempt: fixtures legitimately build inputs by hand. */
function isTestPath(p: string): boolean {
  return /(^|[\\/])(__tests__|__mocks__|test|tests)[\\/]/.test(p) || /\.(test|spec)\.[cm]?tsx?$/.test(p);
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

export async function scanForPlaceholderLiterals(options: GuardOptions): Promise<PlaceholderFinding[]> {
  const ts = (await import("typescript")).default ?? (await import("typescript"));
  const path = await import("node:path");

  const configFile = ts.readConfigFile(options.tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(`PlaceholderLiteralGuard: cannot read ${options.tsconfigPath}`);
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(options.tsconfigPath)
  );

  const extra = options.extraSources ?? [];
  const extraByName = new Map(extra.map((s) => [toPosix(path.resolve(s.fileName)), s.content]));
  const rootNames = [...parsed.fileNames, ...extra.map((s) => path.resolve(s.fileName))];

  // A host that serves the in-memory fixtures and delegates everything else to
  // disk, so a negative-test fixture typechecks against the real declarations.
  const host = ts.createCompilerHost(parsed.options, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    const injected = extraByName.get(toPosix(path.resolve(fileName)));
    if (injected !== undefined) {
      return ts.createSourceFile(fileName, injected, languageVersion, true);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreate);
  };
  const originalFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) =>
    extraByName.has(toPosix(path.resolve(fileName))) || originalFileExists(fileName);
  const originalReadFile = host.readFile.bind(host);
  host.readFile = (fileName) =>
    extraByName.get(toPosix(path.resolve(fileName))) ?? originalReadFile(fileName);

  const program = ts.createProgram(rootNames, parsed.options, host);
  const checker = program.getTypeChecker();

  // The authoritative field set: the rubric's own input interface.
  const fields = readInputFieldNames(ts, program);
  if (fields.size === 0) {
    throw new Error("PlaceholderLiteralGuard: could not resolve FroggyTrendPullbackInput's fields");
  }
  const exempt = new Set(options.exemptFields ?? DEFAULT_EXEMPT_FIELDS);
  const bounds = options.bounds.map((b) => toPosix(path.resolve(options.repoRoot, b)));
  const findings: PlaceholderFinding[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    const abs = toPosix(path.resolve(sourceFile.fileName));
    if (sourceFile.isDeclarationFile) continue;
    if (!bounds.some((b) => abs === b || abs.startsWith(`${b}/`))) continue;
    if (isTestPath(abs)) continue;

    const rel = toPosix(path.relative(options.repoRoot, abs));
    const visit = (node: import("typescript").Node): void => {
      // `{ field: <expr> }` and shorthand `{ field }`
      if (ts.isPropertyAssignment(node) && isFieldName(ts, node.name, fields, exempt)) {
        record(rel, node.name.getText(sourceFile), node.initializer, node);
      } else if (ts.isShorthandPropertyAssignment(node) && fields.has(node.name.text) && !exempt.has(node.name.text)) {
        const symbol = checker.getShorthandAssignmentValueSymbol(node);
        const decl = symbol?.valueDeclaration;
        if (decl && ts.isVariableDeclaration(decl) && decl.initializer) {
          record(rel, node.name.text, decl.initializer, node);
        }
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && fields.has(node.name.text) && !exempt.has(node.name.text) && node.initializer) {
        record(rel, node.name.text, node.initializer, node);
      } else if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) &&
        fields.has(node.left.name.text) &&
        !exempt.has(node.left.name.text)
      ) {
        record(rel, node.left.name.text, node.right, node);
      }
      ts.forEachChild(node, visit);
    };

    function record(
      file: string,
      field: string,
      expr: import("typescript").Expression,
      at: import("typescript").Node
    ): void {
      const reason = constancyReason(ts, checker, expr);
      if (!reason) return;
      // D-DEM-4(5): a value equal to the REGISTERED mapping's declared default
      // for this same target is expressly exempt. Any other constant fires.
      const declared = options.mappingDeclaredDefaults?.[field];
      if (declared !== undefined && constantValue(ts, checker, expr) === declared) return;
      const { line } = sourceFile.getLineAndCharacterOfPosition(at.getStart(sourceFile));
      findings.push({
        file,
        line: line + 1,
        field,
        text: at.getText(sourceFile).replace(/\s+/g, " ").slice(0, 160),
        reason,
      });
    }

    ts.forEachChild(sourceFile, visit);
  }

  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

function isFieldName(
  ts: typeof import("typescript"),
  name: import("typescript").PropertyName,
  fields: Set<string>,
  exempt: Set<string>
): boolean {
  const text = ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
  return text !== undefined && fields.has(text) && !exempt.has(text);
}

/** Read the scorer input's field names straight from its interface. */
function readInputFieldNames(
  ts: typeof import("typescript"),
  program: import("typescript").Program
): Set<string> {
  const out = new Set<string>();
  for (const sf of program.getSourceFiles()) {
    ts.forEachChild(sf, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === "FroggyTrendPullbackInput") {
        for (const member of node.members) {
          if (member.name && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) {
            out.add(member.name.text);
          }
        }
      }
    });
  }
  return out;
}

/**
 * Is this expression a compile-time constant? Syntax first (literals, `as
 * const`, unary of a literal, substitution-free templates, `??`/ternary of
 * constants), then the TYPE CHECKER — a literal type from any declaration,
 * including a `.d.ts` in another package, is exactly the cross-package form
 * D-DEM-4(2) named. Returns the reason, or undefined when it is not constant.
 */
function constancyReason(
  ts: typeof import("typescript"),
  checker: import("typescript").TypeChecker,
  expr: import("typescript").Expression
): string | undefined {
  const node = unwrap(ts, expr);

  if (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    ts.isBigIntLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(node) && node.text === "undefined")
  ) {
    return "literal";
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) return "template literal without substitution";
  if (ts.isPrefixUnaryExpression(node) && constancyReason(ts, checker, node.operand)) {
    return "unary of a literal";
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
    // `x ?? CONST` — the fallback half is the placeholder (the retired `??`
    // stub form); flag when the fallback is constant.
    const r = constancyReason(ts, checker, node.right);
    if (r) return `nullish fallback to a ${r}`;
  }
  if (ts.isConditionalExpression(node)) {
    const w = constancyReason(ts, checker, node.whenTrue);
    const f = constancyReason(ts, checker, node.whenFalse);
    if (w && f) return "conditional between constants";
  }

  // The type-checker pass: a literal type (from an initializer here, or from a
  // `.d.ts` across a package boundary) means the value cannot vary at runtime.
  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
    const type = checker.getTypeAtLocation(node);
    const resolved = checker.getBaseConstraintOfType(type) ?? type;
    const LITERAL_FLAGS =
      ts.TypeFlags.StringLiteral |
      ts.TypeFlags.NumberLiteral |
      ts.TypeFlags.BigIntLiteral |
      ts.TypeFlags.BooleanLiteral |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Null;
    if (!resolved.isUnion() && (resolved.flags & LITERAL_FLAGS) !== 0) {
      return `identifier of literal type '${checker.typeToString(resolved)}'`;
    }
  }
  return undefined;
}

/**
 * The literal VALUE of a constant expression (for the mapping-default
 * exemption), or undefined when it has none. For `x ?? CONST` the fallback is
 * the constant that matters — that is the grandfathered absent-source form.
 */
function constantValue(
  ts: typeof import("typescript"),
  checker: import("typescript").TypeChecker,
  expr: import("typescript").Expression
): string | number | boolean | undefined {
  const node = unwrap(ts, expr);
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const inner = constantValue(ts, checker, node.operand);
    return typeof inner === "number" ? -inner : undefined;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
    return constantValue(ts, checker, node.right);
  }
  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
    const type = checker.getTypeAtLocation(node);
    const resolved = checker.getBaseConstraintOfType(type) ?? type;
    if (resolved.isStringLiteral() || resolved.isNumberLiteral()) return resolved.value;
    if ((resolved.flags & ts.TypeFlags.BooleanLiteral) !== 0) {
      return checker.typeToString(resolved) === "true";
    }
  }
  return undefined;
}

function unwrap(
  ts: typeof import("typescript"),
  expr: import("typescript").Expression
): import("typescript").Expression {
  let node: import("typescript").Expression = expr;
  for (;;) {
    if (ts.isParenthesizedExpression(node)) node = node.expression;
    else if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
    else if (ts.isTypeAssertionExpression?.(node)) node = node.expression;
    else if (ts.isNonNullExpression(node)) node = node.expression;
    else return node;
  }
}
