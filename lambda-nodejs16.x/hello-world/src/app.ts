import { Stream } from 'stream'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { BoxGeometry, Scene, MeshBasicMaterial, Mesh } from 'three'
import { APIGatewayProxyResult } from 'aws-lambda'

import { APIGatewayProxyHandler, GetS3ObjectByKeyEvent } from './types'

const client = new S3Client({})

const getS3Object = (Bucket: string, Key: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({ Bucket, Key })

    try {
      const response = await client.send(getObjectCommand)

      if (!response?.Body) throw new Error('No response')

      // Store all of data chunks returned from the response data stream
      // into an array then use Array#join() to use the returned contents as a String
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
      responseBodyStream.once('end', () => resolve(responseDataChunks.join('')))
    } catch (err) {
      // Handle the error or throw
      return reject(err)
    }
  })
}

export const lambdaHandler: APIGatewayProxyHandler = async (
  event: GetS3ObjectByKeyEvent,
  _context
) => {
  if (!event?.bucket || !event?.key)
    return { statusCode: 400, body: 'No bucket or key' }

  let handlerResponse: APIGatewayProxyResult | null = null

  try {
    const data = await getS3Object(event.bucket, event.key)

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
        dataSize: data.length,
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
