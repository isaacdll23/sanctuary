/**
 * GoogleCalendarApiClient
 *
 * Low-level Google Calendar API interactions using the Google Calendar API v3.
 * Handles all API requests for creating, updating, deleting, and listing events.
 */

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  colorId?: string;
}

interface GoogleEventListResponse {
  items?: Array<{
    id: string;
    summary: string;
    description?: string;
    start?: {
      dateTime?: string;
      date?: string;
    };
    end?: {
      dateTime?: string;
      date?: string;
    };
    updated: string;
  }>;
  nextSyncToken?: string;
}

class GoogleCalendarApiClient {
  /**
   * Creates a new event in Google Calendar
   */
  async createEvent(
    calendarId: string,
    accessToken: string,
    eventData: GoogleCalendarEvent
  ): Promise<{ id: string; [key: string]: unknown }> {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to create Google Calendar event: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Updates an existing event in Google Calendar
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    accessToken: string,
    eventData: Partial<GoogleCalendarEvent>
  ): Promise<{ id: string; [key: string]: unknown }> {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to update Google Calendar event: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Deletes an event from Google Calendar
   */
  async deleteEvent(
    calendarId: string,
    eventId: string,
    accessToken: string
  ): Promise<void> {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to delete Google Calendar event: ${error.error?.message || response.statusText}`
      );
    }
  }

  /**
   * Lists events in Google Calendar for a time range
   */
  async listEvents(
    calendarId: string,
    accessToken: string,
    timeMin: string,
    timeMax: string,
    syncToken?: string
  ): Promise<GoogleEventListResponse> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    if (syncToken) {
      params.append("syncToken", syncToken);
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to list Google Calendar events: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Gets a single event from Google Calendar
   */
  async getEvent(
    calendarId: string,
    eventId: string,
    accessToken: string
  ): Promise<{ id: string; [key: string]: unknown }> {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to get Google Calendar event: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Gets the primary calendar metadata
   */
  async getCalendar(calendarId: string, accessToken: string): Promise<{ id: string; [key: string]: unknown }> {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to get Google Calendar: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }
}

// Export singleton instance
export const googleCalendarApiClient = new GoogleCalendarApiClient();
