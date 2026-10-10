/** @jest-environment jsdom */
import React from 'react'
import '@testing-library/jest-dom'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup
} from '@testing-library/react'
import JsonExport from './JsonExport'
import { downloadJson, downloadText } from './download'

jest.mock('./download', () => ({
  downloadJson: jest.fn(),
  downloadText: jest.fn()
}))
const download = downloadJson as jest.Mock
beforeEach(() => download.mockReset())
afterEach(cleanup)
it('keeps a readable export even when browser download fails', async () => {
  download.mockImplementation(() => {
    throw new Error('Download unavailable')
  })
  render(
    React.createElement(JsonExport, {
      filename: 'activity.json',
      label: 'Export',
      getValue: () => ({ records: [{ runId: 'real-run', cleanup: 'failed' }] })
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  const preview = (await screen.findByLabelText(
    'Export preview: activity.json'
  )) as HTMLTextAreaElement
  expect(JSON.parse(preview.value).records[0].cleanup).toBe('failed')
  expect(screen.getByRole('status')).toHaveTextContent(
    /Download is unavailable/
  )
})
it('copies the exported snapshot, while a new export captures newer records', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  })
  const records = [{ runId: 'first' }]
  render(
    React.createElement(JsonExport, {
      filename: 'activity.json',
      label: 'Export',
      getValue: () => ({ records })
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  await screen.findByLabelText('Export preview: activity.json')
  records.push({ runId: 'second' })
  fireEvent.click(screen.getByText('View or copy exported JSON'))
  fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
  expect(JSON.parse(writeText.mock.calls[0][0]).records).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  const preview = (await screen.findByLabelText(
    'Export preview: activity.json'
  )) as HTMLTextAreaElement
  expect(JSON.parse(preview.value).records).toHaveLength(2)
})
it('shows loading, obtains one server object and uses it for preview, copy and download', async () => {
  let resolveValue: (value: unknown) => void
  const getValue = jest.fn(
    () =>
      new Promise((resolve) => {
        resolveValue = resolve
      })
  )
  const writeText = jest.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  })
  render(
    React.createElement(JsonExport, {
      filename: 'server.json',
      label: 'Export',
      getValue
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  expect(
    screen.getByRole('button', { name: 'Preparing export…' })
  ).toBeDisabled()
  expect(download).not.toHaveBeenCalled()
  const server = {
    traceId: 'server-trace',
    releasedResults: [{ answer: 'bounded' }]
  }
  resolveValue(server)
  const preview = (await screen.findByLabelText(
    'Export preview: server.json'
  )) as HTMLTextAreaElement
  fireEvent.click(screen.getByText('View or copy exported JSON'))
  fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(preview.value))
  expect(download).toHaveBeenCalledWith('server.json', server)
  expect(JSON.parse(preview.value)).toEqual(server)
  expect(getValue).toHaveBeenCalledTimes(1)
})
it('shows fetch errors and permits retry without exporting a stale value', async () => {
  const getValue = jest
    .fn()
    .mockRejectedValueOnce(new Error('Trace expired'))
    .mockResolvedValueOnce({ traceId: 'new' })
  render(
    React.createElement(JsonExport, {
      filename: 'server.json',
      label: 'Export',
      getValue
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Trace expired')
  expect(download).not.toHaveBeenCalled()
  expect(
    screen.queryByLabelText('Export preview: server.json')
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  await screen.findByLabelText('Export preview: server.json')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(download).toHaveBeenCalledTimes(1)
})

it('previews, copies and downloads interaction.log from exactly the same captured server object as JSON', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  })
  const server = {
    traceId: 'server-trace',
    interactionLog:
      'timestamp [retrieval] retrieval succeeded — 2 units\ntimestamp [governance] export succeeded'
  }
  const originalLog = server.interactionLog
  const getValue = jest.fn().mockResolvedValue(server)
  render(
    React.createElement(JsonExport, {
      filename: 'trace.json',
      label: 'Export',
      getValue
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  const logPreview = (await screen.findByLabelText(
    'Export preview: interaction.log'
  )) as HTMLTextAreaElement
  const jsonPreview = screen.getByLabelText(
    'Export preview: trace.json'
  ) as HTMLTextAreaElement
  server.interactionLog = 'A newer server snapshot'
  fireEvent.click(screen.getByText('View or copy interaction.log'))
  fireEvent.click(screen.getByRole('button', { name: 'Copy interaction.log' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Download interaction.log' })
  )
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(originalLog))
  expect(downloadText).toHaveBeenCalledWith('interaction.log', originalLog)
  expect(logPreview.value).toBe(originalLog)
  expect(JSON.parse(jsonPreview.value).interactionLog).toBe(originalLog)
  expect(download).toHaveBeenCalledWith(
    'trace.json',
    JSON.parse(jsonPreview.value)
  )
  expect(getValue).toHaveBeenCalledTimes(1)
  getValue.mockRejectedValueOnce(new Error('Trace expired'))
  fireEvent.click(screen.getByRole('button', { name: 'Export' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Trace expired')
  expect(
    screen.queryByLabelText('Export preview: interaction.log')
  ).not.toBeInTheDocument()
})
