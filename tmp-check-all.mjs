import fs from 'node:fs'
import { skills } from './src/data/skills.ts'

for (const dep of skills) {
  const forks = dep.levels.filter(l => l.branch)
  const line = forks.map(l => `L${l.level}[${l.branch.map(b => `${b.path[0]}:${b.factor}`).join(',')}]`).join(' ')
  console.log(`${dep.id.padEnd(11)} ${line}`)
}
