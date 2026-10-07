import pb from '../lib/pocketbase'

export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await pb.collection('users').authWithPassword(email, password)
      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Login failed. Please check your email and password.',
      )
    }
  },

  async register(name: string, email: string, password: string, passwordConfirm: string) {
    if (!name.trim()) {
      throw new Error('Name is required.')
    }

    if (password !== passwordConfirm) {
      throw new Error('Passwords do not match.')
    }

    try {
      const createdUser = await pb.collection('users').create({
        name,
        email,
        password,
        passwordConfirm,
        emailVisibility: true,
      })

      await pb.collection('users').authWithPassword(email, password)

      return createdUser
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Registration failed. Please try again.',
      )
    }
  },

  async logout() {
    pb.authStore.clear()
  },
}
