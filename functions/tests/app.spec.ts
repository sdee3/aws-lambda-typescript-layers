/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from 'stream'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { lambdaHandler } from '../src/app'

const objectKey = 'my-object.mbtiles'
const mockStream = Readable.from(objectKey)

jest.mock('@aws-sdk/client-s3', () => {
  const mockS3Client = {
    send: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ Body: mockStream })),
  }

  return { S3Client: jest.fn(() => mockS3Client), GetObjectCommand: jest.fn() }
})

describe('Unit test for app handler', function () {
  it('verifies error code 400 response', async () => {
    const event: APIGatewayProxyEvent = {
      key: '1',
    } as any
    const result = await lambdaHandler(event)

    expect(result.statusCode).toEqual(400)
    expect(result.body).toMatchSnapshot()
  })

  it('verifies successful response', async () => {
    process.env.BUCKET_NAME = 'test-hwp-7331'

    const event = {
      key: objectKey,
    } as any

    const result = await lambdaHandler(event)

    expect(result.statusCode).toEqual(200)

    const parsedBody = JSON.parse(result.body)

    expect(parsedBody).toHaveProperty('message')
    expect(parsedBody).toHaveProperty('dataSize')

    expect(parsedBody.message).toEqual(objectKey)
    expect(parsedBody.dataSize).toEqual(objectKey.length)
  })
})
