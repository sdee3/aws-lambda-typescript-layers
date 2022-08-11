import { IO } from './io'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

export class S3IO implements IO {
  private client = new S3Client({
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.SECRET_ACCESS_KEY ?? ''
    },
    region: 'eu-central-1'
  })

  constructor(private readonly bucket: string) {}

  async readFile(path: string): Promise<Buffer> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path
    })
    const result = await this.client.send(cmd)
    const body = result.Body

    if (!body) {
      throw new Error('Empty body received from S3')
    }

    if (!(body instanceof Readable)) {
      throw new Error(`Received unexpected type of body: ${body}`)
    }

    const bodyAsBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      body.on('data', (chunk: Buffer) => chunks.push(chunk))
      body.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      body.on('error', (err) => {
        reject(err)
      })
    })

    return bodyAsBuffer
  }

  async writeFile(path: string, content: Buffer): Promise<void> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: content
    })

    await this.client.send(cmd)
  }
}
