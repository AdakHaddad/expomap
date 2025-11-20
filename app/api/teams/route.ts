import { NextResponse } from 'next/server';
import { getTeams } from '@/app/lib/google-sheets';

export const dynamic = 'force-dynamic'; // defaults to auto, but we want to make sure it fetches fresh data

export async function GET() {
  try {
    const teams = await getTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
