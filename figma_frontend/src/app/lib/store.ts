export const store = {
    // Keep these empty for now - no auth needed
    getToken: () => '',
    setToken: (_: string) => { },
    isAuthenticated: () => true,
    signOut: () => { },
    getDisplayName: () => 'User',
    setDisplayName: (_: string) => { },
}