import { Stream } from 'stream'
import fs from 'fs/promises'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { APIGatewayProxyResult } from 'aws-lambda'
import { ImageData } from '@andreekeberg/imagedata'
import { FileReader } from 'filereader'
import fetch, { Request, Headers } from 'node-fetch'
import { GetS3ObjectByKeyEvent } from './types'
import { delay } from './utils/delay'
import { Blob } from 'fetch-blob'
import { FBXLoader, GLTFExporter } from 'three-stdlib'
// import { Canvas } from 'canvas'

global.FileReader = FileReader
global.ImageData = ImageData
global.Request = Request
global.Headers = Headers
global.Blob = Blob
global.fetch = fetch
// global.Canvas = Canvas

const client = new S3Client({})

const getS3Object = (
  Bucket: string,
  Folder: string,
  Key: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({
      Bucket,
      Key: `${Folder}/${Key}`,
    })

    try {
      const response = await client.send(getObjectCommand)

      if (!response?.Body) throw new Error('No response')

      const responseDataChunks: string[] = []
      const responseBodyStream = response.Body as Stream

      // Handle an error while streaming the response body
      responseBodyStream.once('error', (err: Error) => reject(err))

      // Attach a 'data' listener to add the chunks of data to our array
      // Each chunk is a Buffer instance
      responseBodyStream.on('data', (chunk: Buffer) =>
        responseDataChunks.push(chunk.toString())
      )

      // Once the stream has no more data, join the chunks into a string and return the string
      responseBodyStream.once('end', () => resolve(responseDataChunks.join('')))
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

  const fullFBXPath = `${process.env.BUCKET_NAME}/${event.folder}/${event.key}`
  console.info('Fetching data from Bucket:', fullFBXPath)

  const data = await getS3Object(
    process.env.BUCKET_NAME,
    event.folder,
    event.key
  )

  console.info('FBX loaded from S3. File size in bytes:', data.length)

  const fbxTmpFilePath = '/tmp/fbx_1.fbx'
  const glbTmpFilePath = '/tmp/glb_1.glb'

  console.info('Writing FBX file to tmp directory...')

  const fbxFileArrayBuffer = new Uint8Array(Buffer.from(data))

  await fs.writeFile(fbxTmpFilePath, fbxFileArrayBuffer, {
    flag: 'w',
  })

  console.info('Initializing FBX loader...')

  const fbxLoader = new FBXLoader()

  fbxLoader.load(
    'https://test-hwp-7331.s3.eu-central-1.amazonaws.com/TEST/2100-000A1-HG-L9-MONTAGE-2675_VAE.fbx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4VKOO6347UKTHJWC%2F20220804%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20220804T080837Z&X-Amz-Expires=21600&X-Amz-Signature=7238db4c722b4eabffe67447b9bc00a6effe94d42ef1e98947f8516ffaf0bacf&X-Amz-SignedHeaders=host',
    object => {
      console.info(object)
      console.info('FBX File parsed! Starting conversion to GLB...')

      const gltfExporter = new GLTFExporter()

      gltfExporter.parse(
        object,
        async result => {
          console.info('GLB File created!', result)
          await fs.writeFile(glbTmpFilePath, result.toString(), {
            flag: 'w',
          })
        },
        { binary: true }
      )
    },
    progress => console.info(progress),
    error => console.error(error)
  )

  await delay(20000)

  handlerResponse = {
    statusCode: 200,
    body: JSON.stringify({
      message: event.key,
      dataSize: data.length,
    }),
  }

  return handlerResponse
}
