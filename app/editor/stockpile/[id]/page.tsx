import GenerateClient from './GenerateClient';

export const dynamic = 'force-dynamic';

export default async function StockpileGeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GenerateClient id={id} />;
}
