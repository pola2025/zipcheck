const isAdminDomain = window.location.hostname === 'admin.zcheck.co.kr'

/**
 * Admin 경로를 도메인에 맞게 반환
 * admin.zcheck.co.kr → /path (prefix 없음)
 * zcheck.co.kr → /admin/path
 */
export function adminPath(path: string = ''): string {
	if (isAdminDomain) {
		return path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
	}
	return path === '' ? '/admin' : `/admin${path.startsWith('/') ? path : `/${path}`}`
}

export { isAdminDomain }
