export const store = {
    getToken: () => localStorage.getItem('dm_token') ?? '',
    setToken: (t: string) => localStorage.setItem('dm_token', t),
    getTenantId: () => localStorage.getItem('dm_tenant_id') ?? '',
    setTenantId: (id: string) => localStorage.setItem('dm_tenant_id', id),
    isAuthenticated: () => !!localStorage.getItem('dm_token'),
    signOut: () => {
        localStorage.removeItem('dm_token')
        localStorage.removeItem('dm_tenant_id')
        localStorage.removeItem('dm_display_name')
    },
    getDisplayName: () => localStorage.getItem('dm_display_name') ?? 'User',
    setDisplayName: (name: string) => localStorage.setItem('dm_display_name', name),
}