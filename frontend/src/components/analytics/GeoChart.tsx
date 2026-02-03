import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

interface GeoItem {
	name: string
	users: number
	sessions: number
}

interface GeoChartProps {
	countries: GeoItem[]
	cities: GeoItem[]
}

export default function GeoChart({ countries, cities }: GeoChartProps) {
	const [tab, setTab] = useState<'countries' | 'cities'>('countries')
	const data = tab === 'countries' ? countries : cities

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-200">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-base font-semibold text-sand-900">지역 분석</h3>
				<div className="flex gap-1 bg-sand-100 rounded-lg p-0.5">
					<button
						onClick={() => setTab('countries')}
						className={`px-3 py-1 text-sm rounded-md transition-colors ${
							tab === 'countries'
								? 'bg-white text-sand-900 shadow-sm'
								: 'text-sand-500 hover:text-sand-700'
						}`}
					>
						국가
					</button>
					<button
						onClick={() => setTab('cities')}
						className={`px-3 py-1 text-sm rounded-md transition-colors ${
							tab === 'cities'
								? 'bg-white text-sand-900 shadow-sm'
								: 'text-sand-500 hover:text-sand-700'
						}`}
					>
						도시
					</button>
				</div>
			</div>
			<ResponsiveContainer width="100%" height={300}>
				<BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
					<XAxis type="number" tick={{ fill: '#9B9588', fontSize: 12 }} />
					<YAxis
						type="category"
						dataKey="name"
						tick={{ fill: '#3D3D3D', fontSize: 12 }}
						width={100}
					/>
					<Tooltip
						contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
						labelStyle={{ color: '#1A1A1A' }}
						itemStyle={{ color: '#6B6B6B' }}
					/>
					<Bar dataKey="users" name="사용자" fill="#A87B4F" radius={[0, 6, 6, 0]} barSize={20} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
