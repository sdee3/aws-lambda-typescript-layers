/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stream } from 'stream'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { ImageData } from '@andreekeberg/imagedata'
import { JSDOM } from 'jsdom'
import fetch, { Request, Headers } from 'node-fetch'
import { GetS3ObjectByKeyEvent } from './types'
import { Canvas } from 'canvas'
import { FBXLoader, GLTFExporter } from 'three-stdlib'

const domWindow = new JSDOM()

global.FileReader = domWindow.window.FileReader
global.ImageData = ImageData
global.Request = Request as any
global.Headers = Headers as any
global.Blob = domWindow.window.Blob
global.fetch = fetch as any
global.Canvas = Canvas
global.window = global as any

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

const uploadObjectToS3 = async (
  Bucket: string,
  Folder: string,
  Key: string,
  Body: Buffer
) => {
  const uploadObjectCommand = new PutObjectCommand({
    Bucket,
    Key: `${Folder}/${Key}`,
    Body,
  })

  await client.send(uploadObjectCommand)
}

const convertFbxToGlb = () => {
  return new Promise<Buffer>((resolve, reject) => {
    console.info('Initializing FBX loader...')
    const fbxLoader = new FBXLoader()

    fbxLoader.load(
      'https://test-hwp-7331.s3.eu-central-1.amazonaws.com/TEST/2100-000A1-HG-L9-MONTAGE-2675_VAE_FT.fbx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4VKOO6347UKTHJWC%2F20220804%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20220804T114552Z&X-Amz-Expires=21600&X-Amz-Signature=06c6b749b573ae199c09d51fc14c00ef9ee7ea4500cfcdd9e50a62ac3115498c&X-Amz-SignedHeaders=host',
      object => {
        console.info('FBX File parsed! Starting conversion to GLB...')

        const gltfExporter = new GLTFExporter()

        gltfExporter.parse(
          object,
          async result => {
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

export const lambdaHandler = async (event: GetS3ObjectByKeyEvent) => {
  if (!event?.key || !event.folder || !process.env.BUCKET_NAME)
    return { statusCode: 400, body: 'Wrong parameters provided!' }

  const Bucket = process.env.BUCKET_NAME
  const Folder = event.folder
  const Key = event.key

  // const fullFBXPath = `${process.env.BUCKET_NAME}/${event.folder}/${event.key}`
  // console.info('Fetching data from Bucket:', fullFBXPath)

  // const data = await getS3Object(
  //   process.env.BUCKET_NAME,
  //   event.folder,
  //   event.key
  // )

  // console.info('FBX loaded from S3. File size in bytes:', data.length)

  // const fbxTmpFilePath = '/tmp/fbx_1.fbx'
  // const glbTmpFilePath = '/tmp/glb_1.glb'

  // console.info('Writing FBX file to tmp directory...')

  // const fbxFileArrayBuffer = new Uint8Array(Buffer.from(data))

  // await fs.writeFile(fbxTmpFilePath, fbxFileArrayBuffer, {
  //   flag: 'w',
  // })

  const handlerResponse = await convertFbxToGlb()

  const outFileName = Key.replace('.fbx', '.glb')

  await uploadObjectToS3(Bucket, Folder, outFileName, handlerResponse)

  return {
    statusCode: 200,
    message: 'Successfully uploaded GLB file to S3: ' + outFileName,
  }
}
