import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from '@oceanprotocol/lib'
import Results from './Results'
import { getNodeResult } from '@utils/nodeCompute'
import { getAsset } from '@utils/aquarius'

jest.mock('@oceanprotocol/lib', () => ({
  ...jest.requireActual('@oceanprotocol/lib'),
  Provider: jest.fn()
}))
jest.mock('@utils/nodeCompute', () => ({
  ...jest.requireActual('@utils/nodeCompute'),
  getNodeResult: jest.fn()
}))
jest.mock('@utils/aquarius', () => ({ getAsset: jest.fn() }))
jest.mock('@context/Automation/AutomationProvider', () => ({
  useAutomation: () => ({ autoWallet: undefined })
}))
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123' }),
  useSigner: () => ({ data: { testSigner: true } })
}))
jest.mock(
  '@components/@shared/FormInput/InputElement/FilesInput/utils',
  () => ({ prettySize: (size) => `${size} bytes` })
)
const job = {
  isOceanNodeJob: true,
  owner: '0x123',
  jobId: 'engine-full-job',
  status: 71,
  dateFinished: '100',
  inputDID: [],
  results: [
    { index: 7, type: 'algorithmLog', filename: 'algorithm.log', filesize: 20 }
  ]
} as unknown as ComputeJobMetaData

beforeEach(() => {
  jest.clearAllMocks()
  URL.createObjectURL = jest.fn().mockReturnValue('blob:test')
  URL.revokeObjectURL = jest.fn()
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

test('downloads a Node artifact using its actual result index, with no legacy Provider or asset lookup', async () => {
  ;(getNodeResult as jest.Mock).mockResolvedValue(new Blob(['log']))
  render(<Results job={job} />)
  fireEvent.click(screen.getByRole('button', { name: /ALGORITHM LOGS/ }))
  await waitFor(() =>
    expect(getNodeResult).toHaveBeenCalledWith('engine-full-job', 7, {
      testSigner: true
    })
  )
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())
  expect(getAsset).not.toHaveBeenCalled()
  expect(Provider).not.toHaveBeenCalled()
})

test('shows a running Node job without assuming an input DID or completed results', () => {
  render(
    <Results job={{ ...job, status: 40, dateFinished: null, results: [] }} />
  )
  expect(screen.getByText('Waiting for results...')).toBeInTheDocument()
  expect(getAsset).not.toHaveBeenCalled()
  expect(Provider).not.toHaveBeenCalled()
})
