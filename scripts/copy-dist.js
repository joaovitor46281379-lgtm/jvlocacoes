const { cpSync, mkdirSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const root = resolve(__dirname, '..')

mkdirSync(resolve(root, 'public', 'admin'), { recursive: true })
mkdirSync(resolve(root, 'public', 'cliente'), { recursive: true })

cpSync(resolve(root, 'admin', 'dist'), resolve(root, 'public', 'admin'), { recursive: true, force: true })
cpSync(resolve(root, 'client', 'dist'), resolve(root, 'public', 'cliente'), { recursive: true, force: true })

// Gerar index.html raiz com links para os dois apps
const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=/cliente" />
  <title>JV Locações</title>
</head>
<body>
  <script>window.location.replace('/cliente')</script>
</body>
</html>`

writeFileSync(resolve(root, 'public', 'index.html'), indexHtml, 'utf-8')

console.log('dist copiados: admin -> public/admin, client -> public/cliente')
console.log('index.html raiz gerado em public/index.html')
