import fs from 'node:fs'

const FILE = 'src/data/skills.ts'
const DARK = new Set(['dark', 'totalitarian'])

const lines = fs.readFileSync(FILE, 'utf8').split(/\r?\n/)

let path = null
let dept = '?'
let lvl = '?'
const log = []

const out = lines.map((raw) => {
  const t = raw.trim()

  const d = t.match(/^id: '(\w+)',$/)
  if (d) { dept = d[1]; return raw }

  // Новый узел или конец ветки — сбрасываем текущий путь,
  // чтобы не задеть factor у линейных уровней
  const lv = t.match(/^level: (\d+),$/)
  if (lv) { lvl = lv[1]; path = null; return raw }
  if (t === '],') { path = null; return raw }

  const p = t.match(/^path: '(\w+)',$/)
  if (p) { path = p[1]; return raw }

  const f = t.match(/^factor: ([\d.]+),$/)
  if (f && DARK.has(path)) {
    const before = parseFloat(f[1])
    const after = Math.round((before + 0.01) * 100) / 100
    const text = after.toFixed(2).replace(/0$/, '')
    log.push(`${dept.padEnd(10)} L${String(lvl).padEnd(2)} ${path.padEnd(12)} ${before} -> ${text}`)
    return raw.replace(/factor: [\d.]+,/, `factor: ${text},`)
  }

  return raw
})

fs.writeFileSync(FILE, out.join('\n'))
console.log(`изменено строк: ${log.length}`)
