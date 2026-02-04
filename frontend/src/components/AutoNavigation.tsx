import NordicNavigation from 'components/nordic/NordicNavigation'
import SubdomainNavigation from 'components/SubdomainNavigation'
import { getSubdomain } from '../lib/subdomain'

/**
 * Automatically selects the correct navigation based on current subdomain.
 * - review.* → SubdomainNavigation for review
 * - report.* → SubdomainNavigation for report
 * - Others → NordicNavigation (main site)
 */
export default function AutoNavigation() {
	const subdomain = getSubdomain()

	if (subdomain === 'review') return <SubdomainNavigation subdomain="review" />
	if (subdomain === 'report') return <SubdomainNavigation subdomain="report" />
	return <NordicNavigation />
}
