import fs from 'node:fs'
const s = fs.readFileSync('src/data/skills.ts', 'utf8').split(/\r?\n/)
const idx = s.findIndex(l => l.includes("path: 'totalitarian'"))
console.log('--- hr L3 totalitarian ---')
for (let i = Math.max(0, idx - 10); i < idx + 12 && i < s.length; i++) {
  console.log(`  ${i + 1}: ${JSON.stringify(s[i])}`)
}
