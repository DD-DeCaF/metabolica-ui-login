interface SessionFactory {
  isAuthenticated(): boolean
  expired(): boolean
  expires(): Date
  authorizationExpired(): boolean
  authorizationExpires(): Date
  getCurrentUser(): null
  refresh()
  authenticate(credentials: UserCredentials | FirebaseCredentials, firebase)
  invalidate(): void
  logout(next: string): void
  login(next: string): void
}
