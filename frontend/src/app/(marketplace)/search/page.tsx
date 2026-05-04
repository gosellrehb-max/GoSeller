import MarketplaceSearchResultsView from '@/features/marketplace/components/MarketplaceSearchResultsView';

export default function SearchRoute({
  searchParams,
}: {
  searchParams: { q?: string | string[] }
}) {
  const raw = searchParams?.q
  const q = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : ''
  return <MarketplaceSearchResultsView query={q} />;
}
