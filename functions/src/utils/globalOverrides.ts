/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSDOM } from 'jsdom'
import fetch, { Request, Headers } from 'node-fetch'
import { Canvas } from 'canvas'

export const overrideGlobal = () => {
  const domWindow = new JSDOM()

  global.FileReader = domWindow.window.FileReader
  global.ImageData = domWindow.window.ImageData
  global.Request = Request as any
  global.Headers = Headers as any
  global.Blob = domWindow.window.Blob
  global.fetch = fetch as any
  global.Canvas = Canvas
  global.window = domWindow.window as any
}
