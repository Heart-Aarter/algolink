export const usernamePattern = /^[A-Za-z0-9_-]{1,32}$/

export function isValidUsername(username: string) {
  return usernamePattern.test(username)
}
