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
const NotFound = lazy(async () => import('pages/NotFound'))

const router = createBrowserRouter(
	createRoutesFromElements(
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
			<Route path='*' element={<NotFound />} />
		</>
	)
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
		<Suspense fallback={<LoadingOrError />}>
			<ErrorBoundary renderError={error => <LoadingOrError error={error} />}>
				<TooltipProvider>
					<DevTools />
					<RouterProvider router={router} />
				</TooltipProvider>
			</ErrorBoundary>
		</Suspense>
	)
}
