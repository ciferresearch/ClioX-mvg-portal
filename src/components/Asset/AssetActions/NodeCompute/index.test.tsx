import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Signer } from 'ethers'
import NodeCompute from '.'
import {
  getNodeEnvironments,
  prepareNodeCompute,
  startNodeCompute
} from '@utils/nodeCompute'

jest.mock('wagmi', () => ({ useNetwork: () => ({ chain: { id: 11155420 } }) }))
jest.mock('@utils/nodeCompute', () => ({
  ...jest.requireActual('@utils/nodeCompute'),
  getNodeEnvironments: jest.fn(),
  prepareNodeCompute: jest.fn(),
  startNodeCompute: jest.fn()
}))
const asset = {
  id: `did:op:${'b'.repeat(64)}`,
  metadata: { type: 'algorithm' }
} as AssetExtended
const dataset = `did:op:${'a'.repeat(64)}`
beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  ;(getNodeEnvironments as jest.Mock).mockResolvedValue([
    {
      id: 'room',
      description: 'AgrospAI CPU',
      free: { minJobDuration: 10, maxJobDuration: 600 }
    }
  ])
})

async function setup() {
  render(<NodeCompute asset={asset} signer={{} as Signer} accountId="0x123" />)
  await screen.findByRole('option', { name: /AgrospAI CPU/ })
  fireEvent.change(screen.getByLabelText('Dataset DID'), {
    target: { value: dataset }
  })
}

test('requires successful checks and invalidates them when inputs change', async () => {
  ;(prepareNodeCompute as jest.Mock).mockResolvedValue({ datasets: [] })
  await setup()
  const start = screen.getByRole('button', { name: 'Start free compute' })
  expect(start).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Check assets' }))
  await waitFor(() => expect(start).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Maximum runtime (seconds)'), {
    target: { value: '60' }
  })
  expect(start).toBeDisabled()
  expect(startNodeCompute).not.toHaveBeenCalled()
})

test('displays index failure before requesting a wallet signature', async () => {
  ;(prepareNodeCompute as jest.Mock).mockRejectedValue(
    new Error('AgrospAI (404): DDO not found')
  )
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Check assets' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('DDO not found')
  expect(
    screen.getByRole('button', { name: 'Start free compute' })
  ).toBeDisabled()
  expect(startNodeCompute).not.toHaveBeenCalled()
})

test('rechecks before submit and prevents duplicate jobs while running', async () => {
  ;(prepareNodeCompute as jest.Mock).mockResolvedValue({ datasets: [] })
  ;(startNodeCompute as jest.Mock).mockResolvedValue({
    jobId: 'engine-job',
    status: 1,
    statusText: 'Queued'
  })
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Check assets' }))
  const start = screen.getByRole('button', { name: 'Start free compute' })
  await waitFor(() => expect(start).toBeEnabled())
  fireEvent.click(start)
  expect(await screen.findByText('engine-job')).toBeInTheDocument()
  expect(start).toBeDisabled()
  expect(prepareNodeCompute).toHaveBeenCalledTimes(2)
  expect(startNodeCompute).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem('cliox-op-compute:0x123')).toBe('engine-job')
})
