import { google, calendar_v3 } from 'googleapis';
import { NextResponse } from 'next/server';

// サービスアカウントの認証情報を設定
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
  }

  try {
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    };

    const response = await calendar.events.list(params);
    return NextResponse.json(response.data.items);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { date, time } = await request.json();

  if (!date || !time) {
    return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });
  }

  try {
    const eventParams: calendar_v3.Schema$Event = {
      summary: 'Guitar Lesson',
      start: {
        dateTime: `${date}T${time}:00`,
        timeZone: 'UTC',
      },
      end: {
        dateTime: `${date}T${time.split(':')[0]}:50:00`, // 50-minute lessons
        timeZone: 'UTC',
      },
    };

    const params: calendar_v3.Params$Resource$Events$Insert = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: eventParams,
    };

    const response = await calendar.events.insert(params);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}