/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY ?? '',
  },
  region: 'eu-central-1',
})

const getS3ObjectUrl = (
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

const convertFbxToGlb = (s3ObjectUrl: string) => {
  return new Promise<Buffer>((resolve, reject) => {
    console.info('Initializing FBX loader...')
    const fbxLoader = new FBXLoader()

    fbxLoader.load(
      s3ObjectUrl,
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

  const s3ObjectUrl = await getS3ObjectUrl(Bucket, Folder, Key)
  const handlerResponse = await convertFbxToGlb(s3ObjectUrl)

  const outFileName = Key.replace('.fbx', '.glb')

  await uploadObjectToS3(Bucket, Folder, outFileName, handlerResponse)

  return {
    statusCode: 200,
    message: 'Successfully uploaded GLB file to S3: ' + outFileName,
  }
}
