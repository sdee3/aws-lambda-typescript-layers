import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda'
import { IO, S3IO } from './io'
import { convertFbxToGlb } from './utils/convertFbxToGlb'

export type APIGatewayProxyHandler = Handler<APIGatewayProxyEvent, APIGatewayProxyResult>

export interface GetS3ObjectByKeyEvent extends APIGatewayProxyEvent {
  key?: string
}

export const lambdaHandler = async (event: GetS3ObjectByKeyEvent) => {
  if (!process.env.BUCKET_NAME) {
    return { statusCode: 400, body: 'No bucket configured' }
  }

  const { key } = event

  if (!key || typeof key != 'string') {
    return { statusCode: 400, body: 'Key parameter is missing or not string!' }
  }

  const io: IO = new S3IO(process.env.BUCKET_NAME)

  const fbx = await io.readFile(key)
  const glb = await convertFbxToGlb(fbx.buffer)

  const outputObjectKey = `${key.slice(0, -4)}.glb`
  await io.writeFile(outputObjectKey, glb)

  return {
    statusCode: 200,
    message: 'Successfully uploaded GLB file to S3: ' + outputObjectKey
  }
}
