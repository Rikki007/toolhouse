import fs from 'node:fs'

const lines = fs.readFileSync('src/data/skills.ts', 'utf8').split(/\r?\n/)

// Ось, к которой относится отдел
const AXIS = {
  accounting: 'money',
  marketing: 'money',
  hr: 'people',
  it: 'people',
  laborProt: 'people',
  security: 'people',
  repair: null,
}

const depts = []
let cur = null
let fork = null // текущая вилка: { level, sides: [] }
let side = null // текущая сторона вилки
let node = null // текущий линейный узел

const flushSide = () => {
  if (fork && side) { fork.sides.push(side); side = null }
}
const flushFork = () => {
  if (fork) { flushSide(); cur.forks.push(fork); fork = null }
}
const flushNode = () => {
  if (node) { cur.linear.push(node); node = null }
}

for (const raw of lines) {
  const l = raw.trim()

  let m = l.match(/^id: '(\w+)',$/)
  if (m) { flushFork(); flushNode(); cur = { id: m[1], forks: [], linear: [], maxLevel: null }; depts.push(cur); continue }

  m = l.match(/^maxLevel: (\d+),$/)
  if (m && cur) { cur.maxLevel = Number(m[1]); continue }

  m = l.match(/^path: '(\w+)',$/)
  if (m) { flushSide(); side = { path: m[1] }; continue }

  m = l.match(/^unlocksName: '(.*)',$/)
  if (m) { if (side) side.name = m[1]; else if (node) node.name = m[1]; continue }

  m = l.match(/^unlocksImage: '(.*)',$/)
  if (m) { const img = m[1].split('/').pop(); if (side) side.img = img; else if (node) node.img = img; continue }

  m = l.match(/^cost: (\d+),$/)
  if (m) { if (side) side.cost = Number(m[1]); else if (node) node.cost = Number(m[1]); continue }

  m = l.match(/^factor: ([\d.]+),$/)
  if (m) { if (side) side.factor = Number(m[1]); else if (node) node.factor = Number(m[1]); continue }

  if (l === 'branch: [') { node = null; flushFork(); fork = { level: cur.pendingLevel, sides: [] }; continue }

  m = l.match(/^level: (\d+),$/)
  if (m) { cur.pendingLevel = Number(m[1]); if (!fork) { flushFork(); flushNode(); node = { level: Number(m[1]) } } continue }

  if (l === '],') { flushFork(); continue }
  if (l === '},') { if (fork && side) flushSide(); else { flushFork(); flushNode() } continue }
}
flushFork(); flushNode()

const axisForks = { money: 0, people: 0 }
const collisions = []
const deadForks = []

for (const d of depts) {
  const axis = AXIS[d.id]
  if (axis) axisForks[axis] += d.forks.length
  for (const f of d.forks) {
    const [a, b] = f.sides
    if (!a || !b) { collisions.push(`${d.id} L${f.level}: сторон ${f.sides.length}`); continue }
    if (a.img === b.img) collisions.push(`${d.id.padEnd(10)} L${String(f.level).padEnd(2)} одна иконка «${a.img}»: «${a.name}» / «${b.name}»`)
    if (a.path === b.path) collisions.push(`${d.id} L${f.level}: обе ветки path=${a.path}`)
    if (a.cost === b.cost && a.factor === b.factor) deadForks.push(`${d.id} L${f.level}`)
  }
}

console.log('=== ОТДЕЛЫ ===')
for (const d of depts) {
  console.log(
    `${d.id.padEnd(11)} ось=${String(AXIS[d.id] ?? '—').padEnd(7)} maxLevel:${String(d.maxLevel).padEnd(3)} ` +
    `уровней=${String(d.forks.length + d.linear.length).padEnd(3)} ` +
    `вилок=${d.forks.length}[${d.forks.map(f => f.level).join(',')}] ` +
    `нейтр=[${d.linear.map(n => n.level).join(',')}] ` +
    `path=${[...new Set(d.forks.flatMap(f => f.sides.map(s => s.path)))].join('/')}`,
  )
}

console.log('\n=== ОСИ ===')
console.log('people (отношение к людям) :', axisForks.people, 'вилок')
console.log('money  (способ заработка)  :', axisForks.money, 'вилок')
console.log('всего бинарных выборов     :', axisForks.people + axisForks.money)

console.log(`\n=== ВИЛОК С ОДИНАКОВЫМИ price/factor: ${deadForks.length} ===`)
console.log(deadForks.join(', '))

console.log('\n=== КОЛЛИЗИИ ИКОНОК В РАМКАХ ОДНОЙ ВИЛКИ ===')
console.log(collisions.length ? collisions.join('\n') : 'нет')
