import { Stream } from 'stream'
import fs from 'fs/promises'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { APIGatewayProxyResult } from 'aws-lambda'
import { ImageData } from '@andreekeberg/imagedata'
import { FileReader } from 'filereader'
import { GetS3ObjectByKeyEvent } from './types'
import { FBXLoader, GLTFExporter } from 'three-stdlib'
import { Canvas } from 'canvas'

global.FileReader = FileReader
global.ImageData = ImageData
global.Request = require('node-fetch')
global.Canvas = Canvas

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

  console.info('Writing file to tmp directory')

  const fbxFileArrayBuffer = new Uint8Array(Buffer.from(data))

  await fs.writeFile(fbxTmpFilePath, fbxFileArrayBuffer, {
    flag: 'w',
  })

  const fbxLoader = new FBXLoader()
  fbxLoader.load(fbxTmpFilePath, object => {
    console.info(object)

    // const glbTmpFilePath = './tmp/glb_1.glb'
    const gltfExporter = new GLTFExporter()

    gltfExporter.parse(
      object,
      result => {
        console.info('GLB File created!', result)
      },
      { binary: true }
    )
  })

  console.info('FBX File parsed! Starting conversion to GLB...')

  handlerResponse = {
    statusCode: 200,
    body: JSON.stringify({
      message: event.key,
      dataSize: data.length,
    }),
  }

  return handlerResponse
}
