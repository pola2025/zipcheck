import ErrorBoundary from 'components/ErrorBoundary'
import LoadingOrError from 'components/LoadingOrError'
import { TooltipProvider } from 'components/ui/tooltip'
import { useMediaQuery } from 'hooks'

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
import Lenis from 'lenis'
import { AuthProvider } from 'contexts/AuthContext'
import ProtectedRoute from 'components/auth/ProtectedRoute'

const AI = lazy(async () => import('pages/AI'))
const ZipCheckPage = lazy(async () => await import('pages/Marketing/ZipCheck'))
const AdminDashboard = lazy(async () => await import('pages/Admin/Dashboard'))
const DataManagement = lazy(async () => await import('pages/Admin/DataManagement'))
const QuoteRequests = lazy(async () => await import('pages/Admin/QuoteRequests'))
const QuoteRequestDetail = lazy(async () => await import('pages/Admin/QuoteRequestDetail'))
const QuoteAnalysis = lazy(async () => await import('pages/QuoteAnalysis'))
const PlanSelection = lazy(async () => await import('pages/PlanSelection'))
const Payment = lazy(async () => await import('pages/Payment'))
const QuoteSubmission = lazy(async () => await import('pages/QuoteSubmission'))
const QuoteStatus = lazy(async () => await import('pages/QuoteStatus'))
const QuoteResult = lazy(async () => await import('pages/QuoteResult'))
const AdminLogin = lazy(async () => await import('pages/Admin/Login'))
const NaverCallback = lazy(async () => await import('pages/auth/NaverCallback'))
const MyPage = lazy(async () => await import('pages/MyPage'))
const Community = lazy(async () => await import('pages/Community'))
const CompanyReviewDetail = lazy(async () => await import('pages/CompanyReviewDetail'))
const CompanyReviewForm = lazy(async () => await import('pages/CompanyReviewForm'))
const DamageCaseDetail = lazy(async () => await import('pages/DamageCaseDetail'))
const DamageCaseForm = lazy(async () => await import('pages/DamageCaseForm'))

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route path='/' element={<ZipCheckPage />} />
			<Route path='/quote-analysis' element={<QuoteAnalysis />} />
			<Route path='/plan-selection' element={<PlanSelection />} />
			<Route path='/payment' element={<Payment />} />
			<Route path='/quote-submission' element={<QuoteSubmission />} />
			<Route path='/quote-status' element={<QuoteStatus />} />
			<Route path='/quote-result' element={<QuoteResult />} />
			<Route path='/admin/login' element={<AdminLogin />} />
			<Route
				path='/admin'
				element={
					<ProtectedRoute>
						<AdminDashboard />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/admin/data'
				element={
					<ProtectedRoute>
						<DataManagement />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/admin/quote-requests'
				element={
					<ProtectedRoute>
						<QuoteRequests />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/admin/quote-requests/:id'
				element={
					<ProtectedRoute>
						<QuoteRequestDetail />
					</ProtectedRoute>
				}
			/>
			<Route path='/auth/naver/success' element={<NaverCallback />} />
			<Route path='/mypage' element={<MyPage />} />
			<Route path='/community' element={<Community />} />
			<Route path='/community/reviews/create' element={<CompanyReviewForm />} />
			<Route path='/community/reviews/:id/edit' element={<CompanyReviewForm />} />
			<Route path='/community/reviews/:id' element={<CompanyReviewDetail />} />
			<Route path='/community/damage-cases/create' element={<DamageCaseForm />} />
			<Route path='/community/damage-cases/:id/edit' element={<DamageCaseForm />} />
			<Route path='/community/damage-cases/:id' element={<DamageCaseDetail />} />
			<Route path='/ai' element={<AI />}>
				<Route path=':id' element={<AI />} />
			</Route>
			<Route path='/ai/shared/:id' element={<AI isShared />} />
			<Route path='*' element={<Navigate replace to='/' />} />
		</>
	)
)

export default function App(): ReactElement {
	const systemDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
	const darkMode = useAtomValue(darkModeAtom)

	// Smooth scroll setup
	useEffect(() => {
		const lenis = new Lenis({
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			orientation: 'vertical',
			gestureOrientation: 'vertical',
			smoothWheel: true,
			wheelMultiplier: 1,
			touchMultiplier: 2
		})

		function raf(time: number) {
			lenis.raf(time)
			requestAnimationFrame(raf)
		}

		requestAnimationFrame(raf)

		return () => {
			lenis.destroy()
		}
	}, [])

	useEffect(() => {
		if ((darkMode === 'system' && systemDarkMode) || darkMode === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [darkMode, systemDarkMode])

	return (
		<AuthProvider>
			<Suspense fallback={<LoadingOrError />}>
				<ErrorBoundary renderError={error => <LoadingOrError error={error} />}>
					<TooltipProvider>
						<DevTools />
						<RouterProvider router={router} />
					</TooltipProvider>
				</ErrorBoundary>
			</Suspense>
		</AuthProvider>
	)
}
