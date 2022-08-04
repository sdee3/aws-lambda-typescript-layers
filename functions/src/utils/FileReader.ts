import { Response } from 'node-fetch'
import Blob from 'node-blob'

export class FileReader {
  private blobData: Buffer | null
  public result: string | ArrayBuffer | null

  constructor() {
    this.result = null
    this.blobData = null
  }

  public onloadend() {}

  public readAsArrayBuffer(blob: Blob) {
    const response = new Response(blob)

    response.text().then(() => {
      const arrayBuffer = new ArrayBuffer(blob.buffer.byteLength)
      this.blobData = blob.buffer

      this.result = arrayBuffer

      this.onloadend()
    })
  }

  public readAsDataURL(blob: Blob) {
    const response = new Response(blob)

    response.text().then(() => {
      console.log('readAsDataURL buffer:', blob.buffer)

      this.result = this.blobData!.toString()
      this.onloadend()
    })
  }
}
