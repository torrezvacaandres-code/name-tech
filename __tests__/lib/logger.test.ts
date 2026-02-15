import { logger } from '@/lib/logger'

describe('Logger', () => {
  // Mock console methods
  let consoleLogSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('logs info messages', () => {
    logger.info('Test message', { userId: '123' })
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.stringContaining('Test message'),
      expect.objectContaining({ userId: '123' })
    )
  })

  it('logs warning messages', () => {
    logger.warn('Warning message', { code: 'WARN001' })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]'),
      expect.stringContaining('Warning message'),
      expect.objectContaining({ code: 'WARN001' })
    )
  })

  it('logs error messages', () => {
    const error = new Error('Test error')
    logger.error('Error occurred', error)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.stringContaining('Error occurred'),
      error
    )
  })

  it('handles debug messages in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    logger.debug('Debug message')
    expect(consoleLogSpy).toHaveBeenCalled()
    
    process.env.NODE_ENV = originalEnv
  })
})
