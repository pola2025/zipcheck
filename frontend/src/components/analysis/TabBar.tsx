import { FileSearch, Tags, Ungroup, Receipt, BarChart3, Calculator, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Tab {
	id: number
	label: string
	Icon: LucideIcon
}

const TABS: Tab[] = [
	{ id: 1, label: '파싱', Icon: FileSearch },
	{ id: 2, label: '정규화', Icon: Tags },
	{ id: 3, label: '일식분해', Icon: Ungroup },
	{ id: 4, label: 'VAT', Icon: Receipt },
	{ id: 5, label: '벤치마크', Icon: BarChart3 },
	{ id: 6, label: '점수', Icon: Calculator },
	{ id: 7, label: '규칙', Icon: ShieldCheck },
]

interface Props {
	activeTab: number
	onTabChange: (tab: number) => void
	completedTabs?: number[]
}

export default function TabBar({ activeTab, onTabChange, completedTabs = [] }: Props) {
	return (
		<div className="bg-white rounded-2xl border border-sand-300 p-1.5">
			<div className="flex gap-1">
				{TABS.map((tab) => {
					const isActive = activeTab === tab.id
					const isCompleted = completedTabs.includes(tab.id)
					return (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
								isActive
									? 'bg-forest-600 text-white shadow-sm'
									: 'text-sand-600 hover:bg-sand-50 hover:text-sand-800'
							}`}
						>
							<tab.Icon className="w-4 h-4" />
							<span className="hidden lg:inline">{tab.label}</span>
							{isCompleted && !isActive && (
								<span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}
