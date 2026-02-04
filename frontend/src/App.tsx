import ErrorBoundary from 'components/ErrorBoundary'
import LoadingOrError from 'components/LoadingOrError'
import { TooltipProvider } from 'components/ui/tooltip'
import { useMediaQuery } from 'hooks'
import { HelmetProvider } from 'react-helmet-async'
import { UserAuthProvider } from 'contexts/UserAuthContext'

import type { ComponentType, ReactElement } from 'react'
import { lazy, Suspense, useEffect } from 'react'
import {
	createBrowserRouter,
	createRoutesFromElements,
	Navigate,
	Route,
	RouterProvider
} from 'react-router-dom'
import { darkModeAtom } from 'state'

import { useAtomValue } from 'jotai'
import { DevTools } from 'jotai-devtools'
import 'jotai-devtools/styles.css'

// Retry wrapper for lazy imports - auto-reloads on chunk load failure
function lazyWithRetry<T extends ComponentType<unknown>>(
	importFn: () => Promise<{ default: T }>
) {
	return lazy(async () => {
		try {
			return await importFn()
		} catch (error) {
			const isChunkError =
				error instanceof TypeError &&
				(error.message.includes('Failed to fetch dynamically imported module') ||
					error.message.includes('error loading dynamically imported module') ||
					error.message.includes('Importing a module script failed'))

			if (isChunkError) {
				const reloadKey = 'chunk-reload-timestamp'
				const lastReload = sessionStorage.getItem(reloadKey)
				const now = Date.now()

				// Only auto-reload if we haven't reloaded in the last 10 seconds
				if (!lastReload || now - Number(lastReload) > 10_000) {
					sessionStorage.setItem(reloadKey, String(now))
					window.location.reload()
					return new Promise(() => {}) as never
				}
				sessionStorage.removeItem(reloadKey)
			}
			throw error
		}
	})
}

// Public pages
const AI = lazyWithRetry(async () => import('pages/AI'))
const ZipCheck = lazyWithRetry(async () => import('pages/Marketing/ZipCheck'))
const PlanSelection = lazyWithRetry(async () => import('pages/PlanSelection'))
const Community = lazyWithRetry(async () => import('pages/Community'))
const Payment = lazyWithRetry(async () => import('pages/Payment'))
const QuoteSubmission = lazyWithRetry(async () => import('pages/QuoteSubmission'))
const QuoteStatus = lazyWithRetry(async () => import('pages/QuoteStatus'))
const ReviewCreate = lazyWithRetry(async () => import('pages/Community/ReviewCreate'))
const ReviewDetail = lazyWithRetry(async () => import('pages/Community/ReviewDetail'))
const DamageCaseCreate = lazyWithRetry(async () => import('pages/Community/DamageCaseCreate'))
const DamageCaseDetail = lazyWithRetry(async () => import('pages/Community/DamageCaseDetail'))
const ReviewWrite = lazyWithRetry(async () => import('pages/Write/ReviewWrite'))
const DamageCaseWrite = lazyWithRetry(async () => import('pages/Write/DamageCaseWrite'))
const ReviewsLanding = lazyWithRetry(async () => import('pages/Reviews/ReviewsLanding'))
const ReviewSlugPage = lazyWithRetry(async () => import('pages/Reviews/ReviewSlugPage'))
const DamageCasesLanding = lazyWithRetry(async () => import('pages/DamageCases/DamageCasesLanding'))
const DamageCaseSlugPage = lazyWithRetry(async () => import('pages/DamageCases/DamageCaseSlugPage'))
const GoogleCallback = lazy(async () => import('pages/auth/GoogleCallback'))
const NaverCallback = lazy(async () => import('pages/auth/NaverCallback'))
const PrivacyPolicy = lazy(async () => import('pages/Legal/PrivacyPolicy'))
const TermsOfService = lazy(async () => import('pages/Legal/TermsOfService'))
const NotFound = lazy(async () => import('pages/NotFound'))

// Admin pages
const AdminLogin = lazy(async () => import('pages/Admin/Login'))
const AdminLayout = lazy(async () => import('components/admin/AdminLayout'))
const ProtectedRoute = lazy(async () => import('components/auth/ProtectedRoute'))
const AdminDashboard = lazy(async () => import('pages/Admin/Dashboard'))
const AdminQuoteRequests = lazy(async () => import('pages/Admin/QuoteRequests'))
const AdminQuoteRequestDetail = lazy(async () => import('pages/Admin/QuoteRequestDetail'))
const AdminDataManagement = lazy(async () => import('pages/Admin/DataManagement'))
const AdminCommunityManagement = lazy(async () => import('pages/Admin/CommunityManagement'))
const AdminAnalytics = lazy(async () => import('pages/Admin/Analytics'))

const isAdminDomain = window.location.hostname === 'admin.zcheck.co.kr'

// Admin child routes shared between both domains
const adminChildRoutes = (
	<>
		<Route index element={<AdminDashboard />} />
		<Route path='quote-requests' element={<AdminQuoteRequests />} />
		<Route path='quote-requests/:id' element={<AdminQuoteRequestDetail />} />
		<Route path='analytics' element={<AdminAnalytics />} />
		<Route path='community' element={<AdminCommunityManagement />} />
		<Route path='data' element={<AdminDataManagement />} />
	</>
)

const adminDomainRoutes = (
	<>
		<Route path='/login' element={<AdminLogin />} />
		<Route path='/' element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
			{adminChildRoutes}
		</Route>
		{/* Legacy /admin/* redirects */}
		<Route path='/admin' element={<Navigate to="/" replace />} />
		<Route path='/admin/login' element={<Navigate to="/login" replace />} />
		<Route path='/admin/*' element={<Navigate to="/" replace />} />
		<Route path='*' element={<NotFound />} />
	</>
)

const mainDomainRoutes = (
	<>
		<Route path='/' element={<ZipCheck />} />
		<Route path='/plan-selection' element={<PlanSelection />} />
		<Route path='/community' element={<Community />} />
		<Route path='/community/reviews/create' element={<ReviewCreate />} />
		<Route path='/community/reviews/:id' element={<ReviewDetail />} />
		<Route path='/community/damage-cases/create' element={<DamageCaseCreate />} />
		<Route path='/community/damage-cases/:id' element={<DamageCaseDetail />} />
		<Route path='/write/review' element={<ReviewWrite />} />
		<Route path='/write/damage-case' element={<DamageCaseWrite />} />
		<Route path='/reviews' element={<ReviewsLanding />} />
		<Route path='/reviews/:slug' element={<ReviewSlugPage />} />
		<Route path='/damage-cases' element={<DamageCasesLanding />} />
		<Route path='/damage-cases/:slug' element={<DamageCaseSlugPage />} />
		<Route path='/payment' element={<Payment />} />
		<Route path='/quote-submission' element={<QuoteSubmission />} />
		<Route path='/quote-status' element={<QuoteStatus />} />
		<Route path='/ai' element={<AI />}>
			<Route path=':id' element={<AI />} />
		</Route>
		<Route path='/ai/shared/:id' element={<AI isShared />} />
		<Route path='/auth/google/callback' element={<GoogleCallback />} />
		<Route path='/auth/google/success' element={<GoogleCallback />} />
		<Route path='/auth/naver/callback' element={<NaverCallback />} />
		<Route path='/auth/naver/success' element={<NaverCallback />} />
		<Route path='/privacy' element={<PrivacyPolicy />} />
		<Route path='/terms' element={<TermsOfService />} />
		<Route path='/admin/login' element={<AdminLogin />} />
		<Route path='/admin' element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
			{adminChildRoutes}
		</Route>
		<Route path='*' element={<NotFound />} />
	</>
)

const router = createBrowserRouter(
	createRoutesFromElements(isAdminDomain ? adminDomainRoutes : mainDomainRoutes)
)

export default function App(): ReactElement {
	const systemDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
	const darkMode = useAtomValue(darkModeAtom)

	useEffect(() => {
		if ((darkMode === 'system' && systemDarkMode) || darkMode === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [darkMode, systemDarkMode])

	return (
		<HelmetProvider>
			<UserAuthProvider>
				<Suspense fallback={<LoadingOrError />}>
					<ErrorBoundary renderError={error => <LoadingOrError error={error} />}>
						<TooltipProvider>
							<DevTools />
							<RouterProvider router={router} />
						</TooltipProvider>
					</ErrorBoundary>
				</Suspense>
			</UserAuthProvider>
		</HelmetProvider>
	)
}
