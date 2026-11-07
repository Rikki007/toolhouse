import fs from 'node:fs'

const src = fs.readFileSync('src/data/skills.ts', 'utf8')
const lines = src.split('\n')

let dept = '?'
let lvl = '?'
let path = null
let inBranch = false
let forkSides = []
const forks = []
const linear = []

for (const raw of lines) {
  const t = raw.trim()

  const d = t.match(/^id: '(\w+)'/)
  if (d) { dept = d[1]; continue }

  const l = t.match(/^level: (\d+)/)
  if (l) {
    if (inBranch && forkSides.length) forks.push({ dept, lvl, sides: forkSides })
    forkSides = []
    inBranch = false
    lvl = l[1]
    path = null
    continue
  }

  if (t.startsWith('branch:')) { inBranch = true; continue }

  const p = t.match(/^path: '(\w+)'/)
  if (p) { path = p[1]; continue }

  const f = t.match(/^factor: ([\d.]+)/)
  if (f) {
    if (inBranch) forkSides.push({ path, factor: Number(f[1]) })
    else linear.push({ dept, lvl, factor: Number(f[1]) })
  }
}
if (inBranch && forkSides.length) forks.push({ dept, lvl, sides: forkSides })

let fail = 0

console.log(`вилак: ${forks.length}, линейных: ${linear.length}, всего: ${forks.length + linear.length}`)

for (const f of forks) {
  if (f.sides.length !== 2) { console.log(`FAIL ${f.dept} L${f.lvl}: сторон ${f.sides.length}`); fail++; continue }
  const [a, b] = f.sides
  const diff = Math.round((b.factor - a.factor) * 100) / 100
  const ok = diff === 0.01
  if (!ok) fail++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${f.dept.padEnd(10)} L${String(f.lvl).padEnd(2)} ${a.path.padEnd(13)} ${String(a.factor).padEnd(5)} -> ${b.path.padEnd(14)} ${String(b.factor).padEnd(5)} (+${diff})`)
}

// сводка по department: одинаковый ли шаг у всех вилок
const byDept = {}
for (const f of forks) {
  const d = Math.round((f.sides[1].factor - f.sides[0].factor) * 100) / 100
  ;(byDept[f.dept] ??= new Set()).add(d)
}
for (const [k, v] of Object.entries(byDept)) {
  if (v.size !== 1 || !v.has(0.01)) { console.log(`FAIL ${k}: шаги ${[...v]}`); fail++ }
}

console.log(fail === 0 ? 'OK: все 30 вилок имеют шаг ровно +0.01' : `FAIL: проблем ${fail}`)
