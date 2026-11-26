import type { Metadata } from '@oceanprotocol/lib'

type Container = NonNullable<Metadata['algorithm']>['container']

export interface NodeAlgorithmContainerFields {
  nodeAlgorithmEntrypoint?: string
  nodeAlgorithmImage?: string
  nodeAlgorithmTag?: string
  nodeAlgorithmChecksum?: string
}

export function updateNodeAlgorithmContainer(
  current: Container,
  values: NodeAlgorithmContainerFields
): Container {
  return {
    ...current,
    entrypoint: values.nodeAlgorithmEntrypoint?.trim() || current.entrypoint,
    image: values.nodeAlgorithmImage?.trim() || current.image,
    tag: values.nodeAlgorithmTag?.trim() || current.tag,
    checksum: values.nodeAlgorithmChecksum?.trim() || current.checksum
  }
}
