import { FBXLoader, GLTFExporter } from 'three-stdlib'

export const convertFbxToGlb = (s3ObjectUrl: string) => {
  return new Promise<Buffer>((resolve, reject) => {
    console.info('Initializing FBX loader...')
    const fbxLoader = new FBXLoader()

    fbxLoader.load(
      s3ObjectUrl,
      object => {
        console.info('FBX File parsed! Starting conversion to GLB...')

        const gltfExporter = new GLTFExporter()

        gltfExporter.parse(
          object,
          result => {
            const arrayBuffer = result as ArrayBuffer
            console.info('GLB File created!', arrayBuffer.byteLength)

            const buffer = Buffer.alloc(arrayBuffer.byteLength)
            const view = new Uint8Array(arrayBuffer)

            for (let i = 0; i < buffer.length; ++i) buffer[i] = view[i]

            resolve(buffer)
          },
          { binary: true }
        )
      },
      progress => console.info(progress),
      error => reject(error)
    )
  })
}
