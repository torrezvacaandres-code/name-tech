import { render, screen } from '@testing-library/react'
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator'

describe('PasswordStrengthIndicator', () => {
  it('does not render when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows weak password for short password', () => {
    render(<PasswordStrengthIndicator password="abc" />)
    expect(screen.getByText(/very weak/i)).toBeInTheDocument()
  })

  it('shows good password for medium strength', () => {
    render(<PasswordStrengthIndicator password="Abcd1234" />)
    expect(screen.getByText(/good/i)).toBeInTheDocument()
  })

  it('shows strong password for complex password', () => {
    render(<PasswordStrengthIndicator password="Abcd1234!@#" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('provides suggestions for weak passwords', () => {
    render(<PasswordStrengthIndicator password="abc" />)
    expect(screen.getByText(/use at least 8 characters/i)).toBeInTheDocument()
  })

  it('suggests adding uppercase letters when missing', () => {
    render(<PasswordStrengthIndicator password="abcd1234" />)
    expect(screen.getByText(/add uppercase letters/i)).toBeInTheDocument()
  })

  it('suggests adding numbers when missing', () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />)
    expect(screen.getByText(/add numbers/i)).toBeInTheDocument()
  })

  it('suggests adding special characters when missing', () => {
    render(<PasswordStrengthIndicator password="Abcd1234" />)
    expect(screen.getByText(/add special characters/i)).toBeInTheDocument()
  })

  it('limits suggestions to 3 maximum', () => {
    const { container } = render(<PasswordStrengthIndicator password="a" />)
    const suggestions = container.querySelectorAll('li')
    expect(suggestions.length).toBeLessThanOrEqual(3)
  })
})
