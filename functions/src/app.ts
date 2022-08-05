import { GetS3ObjectByKeyEvent } from './types'
import {
  convertFbxToGlb,
  getS3ObjectUrl,
  initS3Client,
  overrideGlobal,
  uploadObjectToS3,
} from './utils'

overrideGlobal()

const client = initS3Client()

export const lambdaHandler = async (event: GetS3ObjectByKeyEvent) => {
  if (!event?.key || !event.folder || !process.env.BUCKET_NAME)
    return { statusCode: 400, body: 'Wrong parameters provided!' }

  const Bucket = process.env.BUCKET_NAME
  const Folder = event.folder
  const Key = event.key

  const s3ObjectUrl = await getS3ObjectUrl(client, Bucket, Folder, Key)
  const handlerResponse = await convertFbxToGlb(s3ObjectUrl)

  const outFileName = Key.replace('.fbx', '.glb')

  await uploadObjectToS3(client, Bucket, Folder, outFileName, handlerResponse)

  return {
    statusCode: 200,
    message: 'Successfully uploaded GLB file to S3: ' + outFileName,
  }
}
