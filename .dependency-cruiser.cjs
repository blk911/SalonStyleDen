/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'This dependency is part of a circular relationship.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      severity: 'info',
      comment: 'This file has no incoming or outgoing dependencies. Might be unused.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+',      // dot files and folders
          'node_modules',
          'dist',
          'build',
          '\\.(json|html)$'     // files that typically don't have deps
        ]
      },
      to: {}
    },
    {
      name: 'no-client-to-server',
      severity: 'error',
      comment: 'Client-side code cannot directly reference server-side code.',
      from: {
        path: '^client/'
      },
      to: {
        path: '^server/'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
        'npm-no-pkg'
      ]
    },
    includeOnly: [
      '^server/',
      '^client/',
      '^shared/'
    ],
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: { rankdir: 'LR', splines: 'true', fontname: 'Helvetica' },
          node: { shape: 'box', style: 'rounded,filled', fillcolor: '#ffffcc', fontcolor: '#000000', fontname: 'Helvetica', fontsize: 9 },
          edge: { fontname: 'Helvetica', fontsize: 8, fontcolor: '#000000' }
        }
      }
    }
  }
};