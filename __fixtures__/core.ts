import { jest } from '@jest/globals'

export const getInput = jest.fn<(name: string) => string>()
export const getBooleanInput = jest.fn<(name: string) => boolean>()
export const info = jest.fn<(message: string) => void>()
export const warning = jest.fn<(message: string) => void>()
export const error = jest.fn<(message: string) => void>()
export const setFailed = jest.fn<(message: string) => void>()
export const setOutput = jest.fn<(name: string, value: string) => void>()
export const exportVariable = jest.fn<(name: string, value: string) => void>()
export const debug = jest.fn<(message: string) => void>()
