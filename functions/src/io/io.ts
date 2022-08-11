export interface IO {
  readFile(path: string): Promise<Buffer>
  writeFile(path: string, content: Buffer): Promise<void>
}
