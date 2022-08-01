import { Stream } from 'stream'
import fs from 'fs/promises'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { APIGatewayProxyResult } from 'aws-lambda'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { LoadingManager } from 'three'
import { GetS3ObjectByKeyEvent } from './types'

const client = new S3Client({})

const getS3Object = (
  Bucket: string,
  Folder: string,
  Key: string
): Promise<ArrayBuffer> => {
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({
      Bucket,
      Key: `${Folder}/${Key}`,
    })

    try {
      const response = await client.send(getObjectCommand)

      if (!response?.Body) throw new Error('No response')

      const responseDataChunks: Buffer[] = []
      const responseBodyStream = response.Body as Stream

      // Handle an error while streaming the response body
      responseBodyStream.once('error', (err: Error) => reject(err))

      // Attach a 'data' listener to add the chunks of data to our array
      // Each chunk is a Buffer instance
      responseBodyStream.on('data', (chunk: Buffer) =>
        responseDataChunks.push(chunk)
      )

      // Once the stream has no more data, join the chunks into a string and return the string
      responseBodyStream.once('end', () => {
        const byteLength = responseDataChunks.reduce(
          (sum, current) => sum + current.length,
          0
        )

        const result = new ArrayBuffer(byteLength)
        const view = new Uint8Array(result)

        for (let i = 0; i < responseDataChunks.length; i++) {
          for (let j = 0; j < responseDataChunks[i].length; j++) {
            view[i] = responseDataChunks[i][j]
          }
        }

        resolve(result)
      })
    } catch (err) {
      // Handle the error or throw
      return reject(err)
    }
  })
}

export const lambdaHandler = async (event: GetS3ObjectByKeyEvent) => {
  if (!event?.key || !event.folder || !process.env.BUCKET_NAME)
    return { statusCode: 400, body: 'Wrong parameters provided!' }

  let handlerResponse: APIGatewayProxyResult | null = null

  console.info('Fetching data from Bucket:', process.env.BUCKET_NAME)

  const data = await getS3Object(
    process.env.BUCKET_NAME,
    event.folder,
    event.key
  )

  console.info('Converting data to GLB...', data.byteLength)

  const fbxTmpFilePath = '/tmp/temp.fbx'
  const glbTmpFilePath = '/tmp/temp.glb'
  await fs.writeFile(fbxTmpFilePath, new DataView(data), 'binary')

  console.info('FBX File written!')

  const loadingManager = new LoadingManager(
    () => console.info('Loaded'),
    (url, loaded, total) => console.info(url, loaded, total),
    error => console.error(error)
  )

  const fbxLoader = new FBXLoader(loadingManager)

  const group = await fbxLoader.loadAsync(fbxTmpFilePath)

  console.info('FBX File loaded! Starting conversion to GLB...')

  const gltfExporter = new GLTFExporter()
  const glbBuffer = await gltfExporter.parseAsync(group)

  console.info('File converted to GLT!', glbBuffer.byteLength)

  const result = await fs.readFile(glbTmpFilePath)

  console.info('Converting data to GLT done! Result:', result.byteLength)

  handlerResponse = {
    statusCode: 200,
    body: JSON.stringify({
      message: event.key,
      dataSize: data.byteLength,
    }),
  }

  return handlerResponse
}
