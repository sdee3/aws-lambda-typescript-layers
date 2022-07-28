import { Stream } from 'stream'
import path from 'path'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  BoxGeometry,
  Scene,
  MeshBasicMaterial,
  Mesh,
  LoadingManager,
} from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { APIGatewayProxyResult } from 'aws-lambda'
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

  try {
    console.info('Fetching data from Bucket:', process.env.BUCKET_NAME)

    const data = await getS3Object(
      process.env.BUCKET_NAME,
      event.folder,
      event.key
    )

    console.info('Converting data to GLT...', data.byteLength)

    // const loadingManager = new LoadingManager()
    // const loader = new FBXLoader(loadingManager)

    // loadingManager.onError = (url: string) => {
    //   console.error('Error loading GLT from URL: ' + url)
    // }

    // loadingManager.onLoad = () => {
    //   console.info('Finished loading')
    // }

    // loader.parse(data, path.resolve(__dirname, 'my_file'))

    const scene = new Scene()
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new Mesh(geometry, material)

    console.info('Scene ID:', scene.id)
    console.info('Geometry ID:', geometry.id)
    console.info('Material ID:', material.id)
    console.info('Cube ID:', cube.id)

    handlerResponse = {
      statusCode: 200,
      body: JSON.stringify({
        message: event.key,
        dataSize: data.byteLength,
      }),
    }
  } catch (err) {
    handlerResponse = {
      statusCode: 500,
      body: JSON.stringify({
        message: err,
      }),
    }
  }

  return handlerResponse
}
