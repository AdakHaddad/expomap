import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Define the Team interface based on the columns
export interface Team {
  teamCode: string;
  judul: string;
  description: string;
  logo: string;
}

export async function getTeams(): Promise<Team[]> {
  // Check if environment variables are set
  if (
    !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !process.env.GOOGLE_PRIVATE_KEY ||
    !process.env.GOOGLE_SHEET_ID
  ) {
    console.warn(
      'Google Sheets environment variables are missing. Returning empty list.'
    );
    return [];
  }

  try {
    // Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID,
      serviceAccountAuth
    );

    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByIndex[0]; // assuming data is in the first sheet

    const rows = await sheet.getRows();

    // Map rows to Team objects
    // We assume the headers in the sheet are: "Team Code", "Judul", "Description", "Logo"
    // Note: getRows() returns rows where we can access values by header name if headers are set.
    // If the headers in the sheet are different, this mapping needs to be adjusted.
    // The library converts headers to keys.

    const teams: Team[] = rows.map((row) => ({
      teamCode: row.get('Team Code') || row.get('team code') || '',
      judul: row.get('Judul') || row.get('judul') || '',
      description: row.get('Description') || row.get('description') || '',
      logo: row.get('Logo') || row.get('logo') || '',
    }));

    return teams;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return [];
  }
}
