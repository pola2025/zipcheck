import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
	LayoutDashboard,
	FileText,
	BarChart3,
	MessageSquare,
	Database,
	LogOut,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminPath } from '../../lib/admin-path'

const navItems = [
	{ label: '대시보드', icon: LayoutDashboard, path: '' },
	{ label: '견적 관리', icon: FileText, path: '/quote-requests' },
	{ label: '유입 분석', icon: BarChart3, path: '/analytics' },
	{ label: '커뮤니티', icon: MessageSquare, path: '/community' },
	{ label: '데이터', icon: Database, path: '/data' },
]

function NavItem({ item, isMobile }: { item: typeof navItems[0]; isMobile?: boolean }) {
	const to = adminPath(item.path)

	if (isMobile) {
		return (
			<NavLink
				to={to}
				end={item.path === ''}
				className={({ isActive }) =>
					`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors ${
						isActive
							? 'text-forest-700'
							: 'text-sand-500 hover:text-sand-700'
					}`
				}
			>
				<item.icon className="w-5 h-5" />
				<span>{item.label}</span>
			</NavLink>
		)
	}

	return (
		<NavLink
			to={to}
			end={item.path === ''}
			className={({ isActive }) =>
				`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
					isActive
						? 'bg-forest-100 text-forest-700 shadow-sm'
						: 'text-sand-600 hover:bg-sand-100 hover:text-sand-800'
				}`
			}
		>
			<item.icon className="w-[18px] h-[18px]" />
			<span>{item.label}</span>
		</NavLink>
	)
}

export default function AdminLayout() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const handleLogout = () => {
		logout()
		navigate(adminPath('/login'))
	}

	return (
		<div className="min-h-screen bg-sand-50 flex">
			{/* ====== PC Sidebar ====== */}
			<aside className="hidden lg:flex flex-col w-60 border-r border-sand-200 bg-white/80 backdrop-blur-lg fixed inset-y-0 left-0 z-30">
				{/* Logo */}
				<div className="px-6 py-5 border-b border-sand-200">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
							<span className="text-white font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Z</span>
						</div>
						<div>
							<h1 className="text-base font-semibold text-sand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>ZipCheck</h1>
							<p className="text-[11px] text-sand-400 uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>Admin</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
					{navItems.map(item => (
						<NavItem key={item.path} item={item} />
					))}
				</nav>

				{/* User & Logout */}
				<div className="px-4 py-4 border-t border-sand-200">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center">
								<span className="text-forest-700 text-xs font-semibold">
									{(user?.username || 'A')[0].toUpperCase()}
								</span>
							</div>
							<span className="text-sm text-sand-700 font-medium">{user?.username || 'Admin'}</span>
						</div>
						<button
							onClick={handleLogout}
							className="p-1.5 rounded-lg text-sand-400 hover:text-red-500 hover:bg-red-50 transition-colors"
							title="로그아웃"
						>
							<LogOut className="w-4 h-4" />
						</button>
					</div>
				</div>
			</aside>

			{/* ====== Main Content ====== */}
			<main className="flex-1 lg:ml-60 pb-20 lg:pb-0">
				{/* Mobile Header */}
				<header className="lg:hidden sticky top-0 z-20 bg-white/85 backdrop-blur-lg border-b border-sand-200 px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-lg bg-forest-600 flex items-center justify-center">
								<span className="text-white font-bold text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>Z</span>
							</div>
							<span className="text-sm font-semibold text-sand-800" style={{ fontFamily: 'Outfit, sans-serif' }}>ZipCheck Admin</span>
						</div>
						<button
							onClick={handleLogout}
							className="p-2 rounded-lg text-sand-400 hover:text-red-500 hover:bg-red-50 transition-colors"
						>
							<LogOut className="w-4 h-4" />
						</button>
					</div>
				</header>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2 }}
					className="p-4 sm:p-6 lg:p-8"
				>
					<Outlet />
				</motion.div>
			</main>

			{/* ====== Mobile Bottom Bar ====== */}
			<nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-lg border-t border-sand-200 flex justify-around items-center px-2 py-1 safe-area-pb">
				{navItems.map(item => (
					<NavItem key={item.path} item={item} isMobile />
				))}
			</nav>
		</div>
	)
}
