# Telecom Procurement Process Tracking

> **Project status:** Work in progress. This README is provisional and
> will be updated as development continues.

## Overview

This project is a web application designed to help track and manage the
procurement process in a telecom environment. It aims to centralize
purchase requests and make it easier to follow each request through the
different stages of the purchasing workflow.

## Main Features

The application is being developed to support workflows such as:

-   **Purchase Requests (DA):** create and consult purchase requests.
-   **Purchase Orders (BC):** follow purchase-order information and
    related documents.
-   **Workflow Tracking:** monitor the progress and status of
    procurement operations.
-   **Transit and Letter of Credit:** support tracking of relevant
    import/transit steps and letter-of-credit information.
-   **PDF Export:** generate PDF documents for selected procurement
    records.
-   **User Access:** provide an interface for users to access the
    features available to them.

*Features and workflows may change while development is in progress.*

## Technology Stack

### Frontend

-   **React** --- user interface
-   **React Router** --- client-side navigation
-   **Tailwind CSS** --- styling
-   **JavaScript**

### Backend

-   **Django** --- backend application and business logic
-   **Python**

### Database and Other Libraries

-   **PostgreSQL / Supabase** --- database environment used in
    development; confirm the final configuration before deployment
-   **pdf-lib** --- PDF generation
-   **Git** --- version control

## Project Structure

The codebase is organized into frontend and backend parts. The frontend
contains pages, reusable components, routing, services, and utilities.
The backend contains the Django application, API endpoints, and data
models.

> Exact folder names and deployment configuration may evolve during
> development.

## Getting Started

### Prerequisites

Install the tools required by your local setup:

-   Node.js and npm
-   Python
-   pip
-   Access to the configured database

### Frontend

From the frontend directory:

``` bash
npm install
npm run dev
```

Use the URL displayed in the terminal to open the application.

### Backend

From the backend directory, create and activate a virtual environment,
then install the project's dependencies:

``` bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

On Windows, activate the environment with:

``` powershell
.venv\Scripts\Activate.ps1
```

If the project uses a different dependency file or setup process, follow
the repository's current configuration.

## Configuration

Before running the application, configure the required environment
variables and database connection according to the local setup. Do not
commit passwords, API keys, secret keys, or other credentials to version
control.

## Development Status

The application is still under development. Features, business rules,
documentation, and deployment instructions may be updated as the project
progresses.

## Contributing

For now, make changes on a separate Git branch, test them locally, and
review them before merging into the main branch.

## License

No license has been specified yet.
