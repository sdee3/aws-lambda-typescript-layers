import { APIGatewayProxyEvent } from 'aws-lambda'
import { lambdaHandler } from '../src/app'

describe('Unit test for app handler', function () {
  it('verifies error code 400 response', async () => {
    const event: APIGatewayProxyEvent = {
      queryStringParameters: {
        a: '1',
      },
    } as any
    const result = await lambdaHandler(event)

    expect(result.statusCode).toEqual(400)
    expect(result.body).toMatchSnapshot()
  })

  it('verifies successful response', async () => {
    process.env.BUCKET_NAME = 'vw-dpa-mp-3d-files'

    const event: APIGatewayProxyEvent = {
      key: 'TEST/TEST-TEST-EG-PLP-foerdertechnik-001.mbtiles',
    } as any
    const result = await lambdaHandler(event)

    expect(result.statusCode).toEqual(200)
    expect(JSON.parse(result.body)).toHaveProperty('message')
    expect(JSON.parse(result.body)).toHaveProperty('dataSize')
  })
})
