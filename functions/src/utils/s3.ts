/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const initS3Client = () =>
  new S3Client({
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.SECRET_ACCESS_KEY ?? '',
    },
    region: 'eu-central-1',
  })

export const getS3ObjectUrl = (
  client: any,
  Bucket: string,
  Folder: string,
  Key: string
): Promise<string> => {
  return new Promise(async resolve => {
    const getObjectCommand = new GetObjectCommand({
      Bucket,
      Key: `${Folder}/${Key}`,
    })

    const url = await getSignedUrl(client, getObjectCommand, {
      expiresIn: 3600,
    })

    resolve(url)
  })
}

export const uploadObjectToS3 = async (
  client: any,
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
