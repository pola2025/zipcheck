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

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route path='/' element={<ZipCheck />} />
			<Route path='/plan-selection' element={<PlanSelection />} />
			<Route path='/community' element={<Community />} />
			<Route path='/payment' element={<Payment />} />
			<Route path='/ai' element={<AI />}>
				<Route path=':id' element={<AI />} />
			</Route>
			<Route path='/ai/shared/:id' element={<AI isShared />} />
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
