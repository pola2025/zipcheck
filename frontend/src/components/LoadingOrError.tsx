import type { ReactElement } from 'react'
import NeonZLoader from './NeonZLoader'

interface Properties {
	error?: Error
}
export default function LoadingOrError({ error }: Properties): ReactElement {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-black'>
			<h1 className='text-xl' data-testid='LoadingOrError'>
				{error ? (
					<span className="text-red-400">{error.message}</span>
				) : (
					<div role='status' className='flex flex-col items-center gap-4'>
						<NeonZLoader size={80} />
						<p className="text-cyan-400 animate-pulse">Loading...</p>
					</div>
				)}
			</h1>
			{error ? (
				<a
					href='/'
					className='mt-5 text-lg text-blue-500 underline'
					onClick={(e: React.SyntheticEvent) => {
						e.preventDefault()
						document.location.reload()
					}}
				>
					Reload
				</a>
			) : undefined}
		</div>
	)
}
