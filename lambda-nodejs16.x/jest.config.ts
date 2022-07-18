import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.spec.ts?$': 'ts-jest',
  },
  verbose: true,
  automock: true,
}

export default config
