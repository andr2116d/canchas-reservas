import { api, REPO, RESPONSABLE, resumen } from './github.mjs';

const SENSIBLES = [
  /^\.github\//,
  /^\.husky\//,
  /^scripts\//,
  /^docker-compose\.yml$/,
  /(^|\/)package\.json$/,
  /(^|\/)tsconfig[^/]*\.json$/,
  /^(commitlint\.config\.mjs|\.lintstagedrc\.mjs)$/,
  /(^|\/)(\.oxlintrc\.json|eslint\.config\.mjs|next\.config\.ts|vitest\.config\.mts|jest\.config\.ts)$/,
  /^server\/prisma\//,
  /^server\/prisma\.config\.ts$/,
  /^server\/src\/(main|app\.module|configurar-app)\.ts$/,
  /^server\/src\/(common|prisma)\//,
  /^server\/src\/modules\/auth\//,
  /^client\/src\/app\/(layout\.tsx|globals\.css)$/,
  /^client\/src\/(lib|components\/ui)\//,
  /^client\/src\/features\/auth\//,
];

const numero = process.env.PR_NUMERO ?? process.argv[2];
const pr = api(`repos/${REPO}/pulls/${numero}`);
const errores = [];

if (pr.user.login !== RESPONSABLE && !pr.user.login.startsWith('dependabot')) {
  const archivos = api(`repos/${REPO}/pulls/${numero}/files?per_page=100`, { paginar: true });
  const tocados = archivos.map((a) => a.filename).filter((n) => SENSIBLES.some((p) => p.test(n)));

  if (tocados.length > 0) {
    const revisiones = api(`repos/${REPO}/pulls/${numero}/reviews?per_page=100`, { paginar: true })
      .filter((r) => r.user?.login === RESPONSABLE && r.state !== 'COMMENTED');
    const ultima = revisiones.at(-1);
    const aprobado = ultima?.state === 'APPROVED' && ultima.commit_id === pr.head.sha;

    if (!aprobado) {
      errores.push(
        `Este PR toca archivos compartidos y necesita la aprobación de @${RESPONSABLE} sobre el último commit: ${tocados.join(', ')}`,
      );
    }
  }
}

resumen(`Zonas sensibles del PR #${numero}`, errores);
