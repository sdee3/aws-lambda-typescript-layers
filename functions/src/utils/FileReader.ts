import { Response } from 'node-fetch'
import Blob from 'node-blob'

export class FileReader {
  constructor() {
    this.result = null
  }

  public result: string | ArrayBuffer | null

  public onloadend() {}

  public readAsArrayBuffer(blob: Blob) {
    const response = new Response(blob)

    response.text().then((data: any) => {
      console.log('Blob data Buffer:', blob, data.byteLength)

      const arrayBuffer = new ArrayBuffer(blob.buffer.byteLength)
      this.result = arrayBuffer

      this.onloadend()
    })
  }

  public readAsDataURL(blob: Blob) {
    const response = new Response(blob)

    response.text().then(data => {
      this.result = data.toString()
      this.onloadend()
    })
  }
}
