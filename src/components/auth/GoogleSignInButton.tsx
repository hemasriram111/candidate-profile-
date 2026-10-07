import { useEffect, useRef, useState } from 'react'

type GoogleSignInButtonProps = {
  onSuccess: (credential: string) => Promise<void> | void
  onError?: (message: string) => void
  className?: string
  label?: string
  disabled?: boolean
}

type GoogleWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string
          callback: (response: { credential?: string }) => void
          context?: string
        }) => void
        renderButton: (
          element: HTMLElement,
          options?: {
            type?: 'standard' | 'icon'
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin' | 'signup'
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            logo_alignment?: 'left' | 'center'
            width?: number | string
          },
        ) => void
      }
    }
  }

  __clyptusGoogleInitialized?: boolean
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`)
    if (existingScript) {
      if ((window as GoogleWindow).google?.accounts?.id) {
        resolve()
        return
      }

      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google script failed to load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google script failed to load.'))
    document.head.appendChild(script)
  })
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  className = '',
  label = 'Continue with Google',
  disabled = false,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  useEffect(() => {
    if (!clientId) {
      return
    }

    let isMounted = true

    const initializeGoogleAuth = async () => {
      try {
        await loadGoogleScript()

        const googleAccounts = (window as GoogleWindow).google?.accounts
        if (!googleAccounts?.id || !containerRef.current) {
          return
        }

        if (!(window as GoogleWindow).__clyptusGoogleInitialized) {
          googleAccounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (!response.credential) {
                onErrorRef.current?.('Google authentication failed.')
                return
              }

              setIsLoading(true)
              try {
                await onSuccessRef.current(response.credential)
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Google authentication failed.'
                onErrorRef.current?.(message)
              } finally {
                setIsLoading(false)
              }
            },
            context: 'signin',
          })

          ;(window as GoogleWindow).__clyptusGoogleInitialized = true
        }

        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = ''
          googleAccounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: '100%',
          })
        }
      } catch {
        onErrorRef.current?.('Google Sign-In is unavailable right now.')
      }
    }

    void initializeGoogleAuth()

    return () => {
      isMounted = false
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [clientId])

  return (
    <div
      className={`button button-secondary auth-google-button google-button-shell ${className || ''}`}
      aria-live="polite"
      aria-disabled={disabled || isLoading || !clientId}
      style={{
        pointerEvents: disabled || isLoading || !clientId ? 'none' : 'auto',
        opacity: disabled || isLoading || !clientId ? 0.7 : 1,
      }}
    >
      <div
        ref={containerRef}
        className={`google-button-container ${disabled || isLoading || !clientId ? 'is-disabled' : ''}`}
        aria-label={label}
        role="button"
        tabIndex={disabled || isLoading || !clientId ? -1 : 0}
      />
      {isLoading ? <span className="google-button-loading">Signing in with Google...</span> : null}
    </div>
  )
}
