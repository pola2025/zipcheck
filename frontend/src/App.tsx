import ErrorBoundary from 'components/ErrorBoundary'
import LoadingOrError from 'components/LoadingOrError'
import { TooltipProvider } from 'components/ui/tooltip'
import { useMediaQuery } from 'hooks'
import { HelmetProvider } from 'react-helmet-async'

import type { ReactElement } from 'react'
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

// Const Index = lazy(async () => import('pages/Index'))
const AI = lazy(async () => import('pages/AI'))
const ZipCheck = lazy(async () => import('pages/Marketing/ZipCheck'))
const PlanSelection = lazy(async () => import('pages/PlanSelection'))
const Community = lazy(async () => import('pages/Community'))
const Payment = lazy(async () => import('pages/Payment'))
const QuoteSubmission = lazy(async () => import('pages/QuoteSubmission'))
const QuoteStatus = lazy(async () => import('pages/QuoteStatus'))
const ReviewCreate = lazy(async () => import('pages/Community/ReviewCreate'))
const ReviewDetail = lazy(async () => import('pages/Community/ReviewDetail'))
const DamageCaseCreate = lazy(async () => import('pages/Community/DamageCaseCreate'))
const DamageCaseDetail = lazy(async () => import('pages/Community/DamageCaseDetail'))
const AdminLogin = lazy(async () => import('pages/Admin/Login'))
const AdminDashboard = lazy(async () => import('pages/Admin/Dashboard'))
const AdminQuoteRequests = lazy(async () => import('pages/Admin/QuoteRequests'))
const AdminQuoteRequestDetail = lazy(async () => import('pages/Admin/QuoteRequestDetail'))
const AdminDataManagement = lazy(async () => import('pages/Admin/DataManagement'))
const AdminCommunityManagement = lazy(async () => import('pages/Admin/CommunityManagement'))
const AdminAnalytics = lazy(async () => import('pages/Admin/Analytics'))
const NotFound = lazy(async () => import('pages/NotFound'))

const isAdminDomain = window.location.hostname === 'admin.zcheck.co.kr'

const adminRoutes = (
	<>
		{/* admin.zcheck.co.kr 전용: prefix 없이 접근 */}
		<Route path='/login' element={<AdminLogin />} />
		<Route path='/' element={<AdminDashboard />} />
		<Route path='/quote-requests' element={<AdminQuoteRequests />} />
		<Route path='/quote-requests/:id' element={<AdminQuoteRequestDetail />} />
		<Route path='/data' element={<AdminDataManagement />} />
		<Route path='/community' element={<AdminCommunityManagement />} />
		<Route path='/analytics' element={<AdminAnalytics />} />
		{/* 기존 /admin/* 경로도 리다이렉트 지원 */}
		<Route path='/admin' element={<Navigate to="/" replace />} />
		<Route path='/admin/login' element={<Navigate to="/login" replace />} />
		<Route path='/admin/quote-requests' element={<Navigate to="/quote-requests" replace />} />
		<Route path='/admin/analytics' element={<Navigate to="/analytics" replace />} />
		<Route path='/admin/data' element={<Navigate to="/data" replace />} />
		<Route path='/admin/community' element={<Navigate to="/community" replace />} />
		<Route path='*' element={<NotFound />} />
	</>
)

const mainRoutes = (
	<>
		<Route path='/' element={<ZipCheck />} />
		<Route path='/plan-selection' element={<PlanSelection />} />
		<Route path='/community' element={<Community />} />
		<Route path='/community/reviews/create' element={<ReviewCreate />} />
		<Route path='/community/reviews/:id' element={<ReviewDetail />} />
		<Route path='/community/damage-cases/create' element={<DamageCaseCreate />} />
		<Route path='/community/damage-cases/:id' element={<DamageCaseDetail />} />
		<Route path='/payment' element={<Payment />} />
		<Route path='/quote-submission' element={<QuoteSubmission />} />
		<Route path='/quote-status' element={<QuoteStatus />} />
		<Route path='/ai' element={<AI />}>
			<Route path=':id' element={<AI />} />
		</Route>
		<Route path='/ai/shared/:id' element={<AI isShared />} />
		<Route path='/admin/login' element={<AdminLogin />} />
		<Route path='/admin' element={<AdminDashboard />} />
		<Route path='/admin/quote-requests' element={<AdminQuoteRequests />} />
		<Route path='/admin/quote-requests/:id' element={<AdminQuoteRequestDetail />} />
		<Route path='/admin/data' element={<AdminDataManagement />} />
		<Route path='/admin/community' element={<AdminCommunityManagement />} />
		<Route path='/admin/analytics' element={<AdminAnalytics />} />
		<Route path='*' element={<NotFound />} />
	</>
)

const router = createBrowserRouter(
	createRoutesFromElements(isAdminDomain ? adminRoutes : mainRoutes)
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
			<Suspense fallback={<LoadingOrError />}>
				<ErrorBoundary renderError={error => <LoadingOrError error={error} />}>
					<TooltipProvider>
						<DevTools />
						<RouterProvider router={router} />
					</TooltipProvider>
				</ErrorBoundary>
			</Suspense>
		</HelmetProvider>
	)
}
