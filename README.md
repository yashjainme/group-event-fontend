# Group Event Planner

## Overview

The Group Event Planner is a web application designed to help users organize and schedule group events. It provides a calendar interface for viewing events, the ability to add new events, manage attendees, and handle RSVPs. The application is built using React, with date-fns for date manipulation and Tailwind CSS for styling.

## Features

* **Calendar View:** Displays events on a monthly calendar, allowing users to easily see scheduled events.
* **Event Creation:** Users can create new events with details such as title, date, description, location, and maximum attendees.
* **Event Details:** Displays event details, including attendees and location.
* **RSVP Functionality:** Users can RSVP to events, with a check for maximum attendee limits.
* **Responsive Design:** The application is designed to be responsive and work on various screen sizes.
* **Notifications:** Provides toast notifications for user actions, such as successfully creating an event or RSVPing.
* **Settings:** Includes a settings modal (currently with a placeholder for calendar weekend display).

## Technologies Used

* React
* date-fns
* Tailwind CSS
* Framer Motion
* Lucide React Icons

## UI Components

* **Calendar:** Displays the month, dates, and events for each day.
* **EventCard:** Displays individual event information.
* **AddEventModal:** Form for creating new events.
* **SettingsModal:** (Placeholder) For application settings.
* **Notification Toast:** Displays temporary popup messages for user feedback.

## Data Structures

* **Event:**
    * `id`: Unique identifier for the event.
    * `title`: Title of the event.
    * `date`: Date and time of the event in ISO string format.
    * `description`: Description of the event.
    * `location`: Location of the event.
    * `attendees`: Array of `Attendee` objects.
    * `maxAttendees`: Maximum number of attendees (optional).
    * `createdBy`: The user who created the event.
* **Attendee:**
    * `id`: Unique identifier for the attendee.
    * `name`: Name of the attendee.
    * `avatarColor`: (Optional) Color for the attendee's avatar.

## Getting Started

1.  **Prerequisites:**
    * Node.js and npm installed on your machine.
2.  **Installation:**
    * Clone the repository.
    * Run `npm install` to install dependencies.
3.  **Running the Application:**
    * Run `npm run dev` to start the development server.
    * Open your browser and navigate to the provided URL (usually `http://localhost:3000`).

## Key Features in the Code

* **State Management:** React's `useState` is used to manage events, current month, selected date, modal visibility, and notifications.
* **Calendar Generation:** The `calendarDays` memoized variable calculates and structures the days to display in the calendar.
* **Event Filtering:** The `eventsOnSelectedDate` memoized variable filters and sorts events for the selected date.
* **Date Handling:** The date-fns library is used for date manipulation, formatting, and comparison.
* **Modals:** Modals are used for adding new events and adjusting settings.
* **Event RSVP:** The `handleRsvp` function updates the list of attendees for an event.
* **Notifications:** The `showToast` function displays temporary notification messages.
* **Styling:** Tailwind CSS is used for styling, providing a responsive and modern design.
* **Animations:** Framer Motion is used to add animations.
