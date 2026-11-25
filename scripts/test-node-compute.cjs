// Exercises the frontend's actual Node adapter. No funded wallet or paid jobs.
// --run-free submits one 30-second job using a public file and inline test code.
const fs = require('fs/promises')
const path = require('path')
const assert = require('assert/strict')
const ts = require('typescript')
const { Wallet, providers } = require('ethers')
const { createHash } = require('crypto')
const JSZip = require('jszip')
const root = path.resolve(__dirname, '..')
const dataset =
  'did:op:3cbc47bc5c9e1e36a2b17ac438127b97c432d7e428fc9f4d54daba875db24c8a'
const algorithm =
  'did:op:cbc28a62a872e0c6a259befec693068733ca46dec5f2f6503403640e3e032811'
async function loadAdapter() {
  const validation = {}
  const validationCode = ts.transpileModule(
    await fs.readFile(path.join(root, 'src/@utils/nodeFileInfo.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText
  new Function('require', 'exports', validationCode)(require, validation)
  const code = ts.transpileModule(
    await fs.readFile(path.join(root, 'src/@utils/nodeCompute.ts'), 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }
  ).outputText
  const adapter = {}
  new Function('require', 'exports', code)(
    (name) => (name === './nodeFileInfo' ? validation : require(name)),
    adapter
  )
  return adapter
}
async function main() {
  const adapter = await loadAdapter()
  const environments = await adapter.getNodeEnvironments()
  const env = environments.find(
    (e) => !e.free.access?.addresses?.length && !e.free.access?.accessLists
  )
  assert(env, 'No public free room')
  console.log('PASS: current AgrospAI free room discovery')
  const algo = await adapter.getNodeComputeAsset(algorithm)
  assert.equal(algo.metadata.type, 'algorithm')
  let publishedPair
  try {
    await adapter.prepareNodeCompute(dataset, algorithm, env.id, 60)
    publishedPair = 'Preflight passed; execution not tested by this script.'
  } catch (e) {
    publishedPair = e.message
  }
  console.log('PUBLISHED PAIR:', publishedPair)
  if (!process.argv.includes('--run-free')) return
  const source =
    'https://raw.githubusercontent.com/AgrospAI/ocean-enterprise-launcher/main/README.md'
  const inputResponse = await fetch(source)
  assert(inputResponse.ok, 'Public input unavailable')
  const input = Buffer.from(await inputResponse.arrayBuffer())
  const expected = createHash('sha256').update(input).digest('hex')
  const wallet = Wallet.createRandom().connect(
    new providers.StaticJsonRpcProvider('https://sepolia.optimism.io', 11155420)
  )
  const rawcode = [
    'import pathlib, hashlib, json',
    `expected='${expected}'`,
    "inputs=[p for p in pathlib.Path('/data/inputs').rglob('*') if p.is_file()]",
    'matches=[p for p in inputs if hashlib.sha256(p.read_bytes()).hexdigest()==expected]',
    "assert matches, 'Public input not provisioned correctly'",
    "out=pathlib.Path('/data/outputs'); out.mkdir(parents=True,exist_ok=True)",
    "(out/'cliox-result.json').write_text(json.dumps({'sha256':expected,'bytes':len(matches[0].read_bytes()),'result':4}))",
    "print('CLIOX_NODE_ADAPTER_PASS')"
  ].join('\n')
  // Synthetic control deliberately separate from the published-DID preflight above.
  const submitted = await adapter.startNodeCompute(
    {
      environment: env.id,
      maxJobDuration: 30,
      queueMaxWaitTime: 0,
      resources: [
        { id: 'cpu', amount: 1 },
        { id: 'ram', amount: 1 },
        { id: 'disk', amount: 1 }
      ],
      datasets: [{ fileObject: { type: 'url', url: source, method: 'GET' } }],
      algorithm: {
        meta: {
          language: 'py',
          version: '1.0',
          container: {
            image: 'python',
            tag: '3.11-slim',
            entrypoint: 'python $ALGO'
          },
          rawcode
        }
      }
    },
    wallet
  )
  console.log('SUBMITTED:', submitted.jobId)
  const outputDir = '/private/tmp/cliox-node-compute-proof'
  await fs.mkdir(outputDir, { recursive: true })
  let job
  for (let i = 0; i < 60; i++) {
    job = await adapter.getNodeJob(submitted.jobId)
    console.log('STATUS:', job.status, job.statusText)
    if (adapter.isNodeJobTerminal(job)) break
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  const report = {
    job,
    source,
    expected,
    publishedPair,
    mode: 'Synthetic public-file control through actual frontend adapter; published DID compute remains a separate test.'
  }
  await fs.writeFile(
    path.join(outputDir, 'report.json'),
    JSON.stringify(report, null, 2)
  )
  for (const result of job.results || []) {
    const blob = await adapter.getNodeResult(
      submitted.jobId,
      result.index,
      wallet
    )
    const data = Buffer.from(await blob.arrayBuffer())
    await fs.writeFile(
      path.join(
        outputDir,
        `${result.type}-${result.index}.${
          result.type === 'output' ? 'zip' : 'txt'
        }`
      ),
      data
    )
    if (result.type === 'output') {
      const zip = await JSZip.loadAsync(data)
      const file = Object.values(zip.files).find((f) =>
        f.name.endsWith('cliox-result.json')
      )
      assert(file, 'Missing result file')
      const actual = JSON.parse(await file.async('text'))
      assert.equal(actual.sha256, expected)
      assert.equal(actual.bytes, input.length)
      assert.equal(actual.result, 4)
      report.verifiedOutput = actual
    }
  }
  await fs.writeFile(
    path.join(outputDir, 'report.json'),
    JSON.stringify(report, null, 2)
  )
  assert(
    adapter.isNodeJobSuccessful(job),
    'Container did not exit successfully'
  )
  assert(report.verifiedOutput, 'Output not verified')
  const history = await adapter.getNodeJobs(wallet.address)
  assert(
    history.some((entry) => entry.jobId === submitted.jobId),
    'Job recovery must preserve the routed job ID'
  )
  console.log(
    'PASS: real submit, status, signed downloads and output contents verified; report:',
    outputDir
  )
}
main().catch((e) => {
  console.error(e.message)
  process.exitCode = 1
})
