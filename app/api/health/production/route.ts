import { handleHealthCheck } from '@/lib/monitoring/production-monitor';

export async function GET() {
  return await handleHealthCheck();
}