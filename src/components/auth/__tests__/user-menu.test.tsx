import { render, screen } from '@testing-library/react'
import { UserMenu } from '../user-menu'
import { AuthProvider } from '@/lib/auth/context'

// Mock the auth context
const mockAuthContext = {
  user: null,
  loading: false,
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('@/lib/auth/context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext,
}))

describe('UserMenu', () => {
  it('renders sign in and sign up buttons when user is not authenticated', () => {
    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows loading state when loading is true', () => {
    mockAuthContext.loading = true
    
    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )

    expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
  })

  it('renders user avatar when user is authenticated', () => {
    mockAuthContext.loading = false
    mockAuthContext.user = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        provider_id: 'google',
        sub: '123',
      },
    } as any

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )

    const avatarButton = screen.getByRole('button')
    expect(avatarButton).toBeInTheDocument()
  })
}) 