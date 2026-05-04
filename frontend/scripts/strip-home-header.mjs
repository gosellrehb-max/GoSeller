import fs from 'fs'

const path = 'src/components/home/MarketplaceHomeView.tsx'
let s = fs.readFileSync(path, 'utf8')
const lines = s.split(/\r?\n/)

const exportIdx = lines.findIndex((l) => l.includes('export default function MarketplaceHomeView'))
if (exportIdx < 0) throw new Error('export default not found')

const retIdx = lines.findIndex((l, i) => i > exportIdx && l.trim() === 'return (')
if (retIdx < 0) throw new Error('return not found')

const headerEnd = lines.findIndex((l, i) => i > retIdx && l.trim() === '</header>')
if (headerEnd < 0) throw new Error('</header> not found')

const mainIdx = lines.findIndex(
  (l, i) =>
    i > headerEnd &&
    l === '      <div className="max-w-[1440px] mx-auto">',
)
if (mainIdx < 0) throw new Error('main shell div not found after header')

const before = lines.slice(0, retIdx).join('\n')
const after = lines.slice(mainIdx).join('\n')

const insert = `return (
    <div className="min-h-screen wm-page">
      <MarketplaceSiteHeader />

`

const out = `${before}
${insert}${after}
`
fs.writeFileSync(path, out)
console.log('ok: replaced lines', retIdx + 1, '-', mainIdx, 'with header component')
