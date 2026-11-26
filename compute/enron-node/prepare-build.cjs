// Downloads public build resources and verifies pinned checksums. No dataset is included.
const fs = require('fs/promises')
const path = require('path')
const os = require('os')
const { createHash } = require('crypto')

const resources = [
  [
    'en_core_web_sm-3.8.0-py3-none-any.whl',
    'https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl',
    '1932429db727d4bff3deed6b34cfc05df17794f4a52eeb26cf8928f7c1a0fb85'
  ],
  [
    'punkt_tab.zip',
    'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/punkt_tab.zip',
    'e57f64187974277726a3417ca6f181ec5403676c717672eef6a748a7b20e0106'
  ],
  [
    'stopwords.zip',
    'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/stopwords.zip',
    '48c0e52d8b52546e827f53761fb30300c0ab94f70660d28bd65ba0a86270946b'
  ]
]

async function main() {
  const target = path.resolve(
    process.argv[2] || path.join(os.tmpdir(), 'cliox-enron-node-build')
  )
  await fs.mkdir(target, { recursive: true })
  for (const name of ['Dockerfile', 'algorithm.py', 'node_main.py'])
    await fs.copyFile(path.join(__dirname, name), path.join(target, name))
  for (const [name, url, checksum] of resources) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
    const data = Buffer.from(await response.arrayBuffer())
    if (createHash('sha256').update(data).digest('hex') !== checksum)
      throw new Error(`${name}: checksum mismatch; build stopped`)
    await fs.writeFile(path.join(target, name), data)
  }
  console.log(`Verified build context: ${target}`)
  console.log(
    `docker build --platform linux/amd64 --network none -t cliox-enron-node-preview:local ${target}`
  )
}
main().catch((e) => {
  console.error(e.message)
  process.exitCode = 1
})
