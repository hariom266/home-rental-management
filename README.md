# HomeBase Manager

Build a Private 15-Apartment Rental Management Web App

Build a complete, production-ready private apartment rental management web application for a single residential building containing exactly 15 rental apartments.

This is NOT an Airbnb-style public rental marketplace. It is a private web application for the building owner/administrator and existing tenants.

The application should be modern, responsive, secure, easy to use, and optimized for desktop and mobile browsers.

1. APPLICATION PURPOSE

The building owner has 15 rental apartments.

Each apartment has a unique Apartment ID:

APT-001

APT-002

APT-003

APT-004

APT-005

APT-006

APT-007

APT-008

APT-009

APT-010

APT-011

APT-012

APT-013

APT-014

APT-015

Existing tenants should be able to log into the web application and see information related only to their own apartment.

The owner/admin should have complete control over apartments, tenants, rent, payments, maintenance requests, notices, and reports.

2. TECHNOLOGY STACK

Use:

React

TypeScript

Vite

Tailwind CSS

Modern component library such as shadcn/ui

Supabase

PostgreSQL

Supabase Authentication

Supabase Row Level Security (RLS)

Supabase Storage where necessary

GitHub-compatible project structure

Design the application so that a payment gateway such as Razorpay can be integrated later.

Do NOT expose secret API keys in frontend code.

3. USER ROLES

Create two main roles.

ADMIN

The building owner/manager.

Admin can:

View all 15 apartments

Add/edit tenant information

Assign tenant to apartment

Change monthly rent

Set rent due date

View rent status

View payment history

View pending payments

View maintenance requests

Create announcements/notices

View reports

Manage apartment status

Manage tenant accounts

TENANT

Tenant can:

Login securely

View only their own apartment

View their rent amount

View current month's rent

View due date

View payment status

Pay rent

View payment history

Download/view receipts

Submit maintenance complaints

View notices from admin

Update allowed profile information

Logout

Tenants must NEVER be able to access another tenant's data.

4. AUTHENTICATION

Create a secure authentication system.

Do NOT use Apartment ID as the password.

Tenant login should use:

Apartment ID / registered login identifier

Password

Example:

Apartment ID:

APT-007

Password:

Also provide:

Forgot password

Logout

Session management

Protected routes

Role-based authorization

Admin should have a separate secure login.

Create protected routes:

/login
/admin
/admin/apartments
/admin/tenants
/admin/payments
/admin/maintenance
/admin/notices
/admin/reports
/tenant
/tenant/rent
/tenant/payments
/tenant/maintenance
/tenant/notices
/tenant/profile

Redirect users to the correct dashboard based on their role.

5. DATABASE DESIGN

Use Supabase PostgreSQL.

Create the following tables.

apartments

Fields:

id

apartment_id

apartment_number

floor

monthly_rent

security_deposit

status

description

created_at

updated_at

status values:

occupied

vacant

maintenance

Pre-create exactly 15 apartments:

APT-001 through APT-015.

tenants

Fields:

id

auth_user_id

apartment_id

full_name

phone

email

emergency_contact_name

emergency_contact_phone

move_in_date

move_out_date

status

created_at

updated_at

status:

active

inactive

The tenant's apartment relationship must be enforced through the database.

rent_records

Fields:

id

apartment_id

tenant_id

billing_month

rent_amount

due_date

paid_amount

payment_status

late_fee

total_amount

paid_at

created_at

updated_at

payment_status:

pending

partially_paid

paid

overdue

Each month's rent should have a separate record.

Example:

APT-007
September 2026
₹8,000
Due: 5 September 2026

payments

Fields:

id

rent_record_id

apartment_id

tenant_id

amount

payment_method

transaction_id

payment_gateway

payment_status

paid_at

receipt_number

created_at

payment_status:

pending

successful

failed

refunded

payment_method examples:

UPI

Card

Net Banking

Cash

Bank Transfer

Do not mark an online payment as successful based only on frontend input.

Payment confirmation must be verified through the backend/payment gateway webhook.

maintenance_requests

Fields:

id

apartment_id

tenant_id

title

description

category

priority

status

admin_notes

created_at

updated_at

resolved_at

category:

Plumbing

Electrical

Cleaning

Appliance

Internet

Other

priority:

low

medium

high

emergency

status:

submitted

in_progress

resolved

rejected

notices

Fields:

id

title

message

priority

target_type

published_at

expires_at

created_by

created_at

target_type:

all_tenants

specific_apartment

receipts

Fields:

id

payment_id

receipt_number

generated_at

receipt_url

6. SECURITY / RLS

This is extremely important.

Implement Supabase Row Level Security.

Tenant:

Can read only their own tenant record

Can read only their own apartment

Can read only their own rent records

Can read only their own payments

Can create maintenance requests for their apartment

Can read their own maintenance requests

Can read notices intended for all tenants or their apartment

Tenant must NOT be able to:

View another apartment

View another tenant

Modify rent amount

Modify payment status

Modify transaction ID

Modify apartment assignment

Access admin pages

Access other tenants' maintenance requests

Admin:

Can view and manage all apartments

Can view and manage all tenants

Can view rent records

Can view payments

Can manage maintenance requests

Can create/manage notices

Can generate reports

Never rely only on frontend authorization. Enforce permissions at the database level.

7. LANDING / LOGIN PAGE

Create a clean professional login page.

Brand name:

"HomeRent Manager"

Subtitle:

"Secure Apartment Rental Management"

Show:

🏠 HomeRent Manager

"Manage your apartment, rent and maintenance in one place."

Login form:

Apartment ID / Email

Password

Login button

Forgot Password

Also provide:

"Admin Login"

Do not expose tenant information on the public page.

8. TENANT DASHBOARD

After login, show a personalized dashboard.

Example:

Welcome, Rahul

Apartment:
APT-007

Monthly Rent:
₹8,000

Current Rent:
₹8,000

Due Date:
5 September 2026

Status:
PENDING

Dashboard cards:

Current Rent

Payment Status

Last Payment

Maintenance Requests

Add a prominent:

"Pay Rent"

button.

Also show:

Recent payments

Latest notices

Maintenance request status

9. TENANT RENT PAGE

Create:

"My Rent"

Display:

Apartment ID

Monthly rent

Billing month

Due date

Late fee

Total amount

Payment status

Example:

September 2026

Rent: ₹8,000
Late Fee: ₹0
Total: ₹8,000
Due Date: 5 Sep 2026

Status: Pending

Button:

"Pay Rent"

If overdue:

Status: OVERDUE

Show appropriate late fee if configured.

10. PAYMENT SYSTEM

Design the application so Razorpay can be integrated.

Payment flow:

Tenant clicks:

PAY RENT

↓

Backend creates payment/order

↓

Razorpay checkout

↓

Tenant completes payment

↓

Razorpay webhook verifies payment

↓

Backend updates payment record

↓

Rent status becomes PAID

↓

Generate receipt

↓

Show success page

Important:

Never trust the frontend payment-success response.

Use secure server-side verification/webhooks.

For the first development version, if Razorpay credentials are not configured, create a clearly labeled:

"Demo Payment Mode"

Do not pretend demo payments are real transactions.

11. PAYMENT HISTORY

Tenant can see:

MonthAmountDateStatusReceiptSep 2026₹8,00005 SepPaidViewAug 2026₹8,00004 AugPaidViewJul 2026₹8,00005 JulPaidView

Add:

Search

Filter by year

Filter by status

Receipt button

12. RENT RECEIPT

Create a professional receipt.

Include:

HOME RENT MANAGER

Rental Payment Receipt

Receipt Number:
HRM-2026-00001

Apartment:
APT-007

Tenant:
Rahul Sharma

Billing Month:
September 2026

Rent:
₹8,000

Payment Method:
UPI

Transaction ID:
XXXXXXXX

Payment Date:
5 September 2026

Status:
PAID

Provide:

"Download Receipt"

13. ADMIN DASHBOARD

Create a professional admin dashboard.

Top cards:

Total Apartments: 15

Occupied: 15

Vacant: 0

Rent Collected This Month: ₹1,20,000

Pending Rent: ₹16,000

Overdue: ₹8,000

Maintenance Requests: 3

Create charts:

Rent Collection

Monthly rent collected over the last 6 months.

Apartment Occupancy

Occupied vs vacant.

Payment Status

Paid vs pending vs overdue.

14. ADMIN APARTMENTS PAGE

Display all 15 apartments.

Example:

ApartmentTenantRentStatusAPT-001Amit₹8,000OccupiedAPT-002Rahul₹8,000OccupiedAPT-003Priya₹9,000Occupied............APT-015Neha₹8,500Occupied

Allow admin to:

View

Edit

Assign tenant

Change rent

Change status

Do not allow deletion of an apartment if historical financial records depend on it. Use archive/inactive status instead.

15. ADMIN TENANT MANAGEMENT

Create tenant management page.

Admin can:

Add tenant

Edit tenant

Assign apartment

Change tenant status

View tenant profile

View payment history

View maintenance requests

Tenant profile should show:

Name
Apartment
Phone
Email
Move-in date
Current rent
Payment status

16. ADMIN RENT MANAGEMENT

Create:

"Rent Management"

Show all apartments and current month's rent.

Columns:

Apartment
Tenant
Rent
Due Date
Paid Amount
Status
Action

Statuses should be visually distinct:

Paid
Pending
Overdue
Partially Paid

Admin can:

Set rent

Change due date

Add late fee

Record offline payment

View payment history

17. OFFLINE PAYMENT

Because some tenants may pay by cash or bank transfer, allow admin to record an offline payment.

Form:

Apartment
Tenant
Billing Month
Amount
Payment Method
Transaction/Reference Number
Payment Date
Notes

Methods:

Cash
Bank Transfer
UPI
Other

After recording the payment, update the rent record appropriately.

18. MAINTENANCE SYSTEM

Tenant can create:

"New Maintenance Request"

Fields:

Category
Title
Description
Priority

Optional image upload.

Example:

Category:
Plumbing

Title:
Water leakage in bathroom

Description:
Water is leaking below the sink.

Priority:
High

Admin receives request in dashboard.

Admin can update:

Submitted
In Progress
Resolved

Tenant sees the current status.

19. NOTICES

Admin can publish notices.

Example:

"Water Supply Maintenance"

"Water supply will be unavailable between 10 AM and 1 PM tomorrow due to maintenance."

Tenants see notices on their dashboard.

Support:

All tenants

Specific apartment

Priority

Expiry date

20. PROFILE

Tenant profile:

Full name

Phone

Email

Apartment ID

Move-in date

Emergency contact

Tenant should not be able to change:

Apartment ID

Rent

Payment status

Tenant ID

Admin can update these fields.

21. RESPONSIVE DESIGN

The application must work perfectly on:

Desktop

Laptop

Tablet

Android phone

iPhone

Use a mobile bottom navigation or responsive sidebar for tenants.

Mobile tenant navigation:

Home
Rent
Payments
Maintenance
Profile

Admin desktop navigation:

Dashboard
Apartments
Tenants
Rent
Payments
Maintenance
Notices
Reports
Settings

22. UI DESIGN

Create a modern professional property-management UI.

Style:

Clean

Minimal

Professional

Trustworthy

Easy to understand

Mobile friendly

Use:

Cards

Tables

Badges

Charts

Modal dialogs

Toast notifications

Confirmation dialogs

Use Indian Rupee formatting:

₹8,000

Dates:

DD MMM YYYY

Example:

05 Sep 2026

Avoid unnecessary animations.

Use accessible contrast and readable typography.

23. NOTIFICATION SYSTEM

Prepare notification architecture for:

Rent due reminder

Rent overdue reminder

Payment confirmation

Maintenance status update

New notice

Initially notifications can appear inside the web application.

Structure the backend so email/WhatsApp/SMS can be integrated later.

24. REPORTS

Admin reports:

Monthly Rent Report

Show:

Total expected rent

Total collected

Total pending

Total overdue

Collection percentage

Apartment Report

Show:

Occupied apartments

Vacant apartments

Rent by apartment

Tenant Report

Show:

Active tenants

Inactive tenants

Move-in dates

Maintenance Report

Show:

Open requests

Resolved requests

Emergency requests

Allow export to CSV if practical.

25. SEARCH AND FILTERS

Admin should be able to search:

Apartment ID

Tenant name

Phone number

Filters:

Occupied/vacant

Paid/pending/overdue

Maintenance status

Payment month

26. AUTOMATIC MONTHLY RENT RECORDS

Create a backend-friendly system for monthly rent generation.

For every occupied apartment:

At the beginning of a new billing month, create a rent record.

Example:

APT-001
October 2026
₹8,000
Due: 5 October 2026

APT-002
October 2026
₹8,000
Due: 5 October 2026

Continue for all occupied apartments.

Do not create duplicate rent records for the same apartment and billing month.

Use a unique constraint such as:

apartment_id + billing_month

27. OVERDUE LOGIC

If:

Current date > due date

AND payment status != paid

Then display:

OVERDUE

Calculate late fee according to the configurable late-fee rules.

Keep the late-fee logic centralized so the admin can change it later.

28. EMPTY / ERROR / LOADING STATES

Create proper states for:

Loading

No payment history

No maintenance requests

No notices

Apartment vacant

Payment failed

Network error

Unauthorized access

Session expired

Do not leave blank screens.

29. DEMO DATA

Create development/demo data for all 15 apartments.

Example tenants:

APT-001 → Tenant 1
APT-002 → Tenant 2
APT-003 → Tenant 3
...
APT-015 → Tenant 15

Use realistic but clearly fictional data.

Create sample rent records and payment history so the dashboard looks complete during development.

Do not use real people's personal information.

30. DATABASE RELATIONSHIPS

Implement proper foreign keys:

apartments
↓
tenants
↓
rent_records
↓
payments

apartments
↓
maintenance_requests

tenants
↓
maintenance_requests

notices
↓
target apartments / all tenants

Maintain referential integrity.

31. SECURITY REQUIREMENTS

Implement:

Supabase Auth

RLS policies

Role-based access

Protected routes

Server-side validation

Input validation

Secure payment verification

No secret keys in frontend

No sensitive information in localStorage

Proper logout

Session expiry handling

Prevent:

Unauthorized apartment access

IDOR attacks

Tenant-to-tenant data access

Client-side manipulation of rent/payment status

32. ADMIN SETTINGS

Create Settings page.

Allow admin to configure:

Building name
Building address
Owner name
Owner phone
Currency
Default rent due day
Late fee
Contact information

Do not allow changing critical system/security settings from unsafe client-side forms.

33. BUILDING INFORMATION

Use a configurable building profile.

Default:

Building Name:
HomeRent Manager

Number of Apartments:
15

Currency:
INR (₹)

Country:
India

The building address should be configurable by admin instead of hardcoded.

34. USER EXPERIENCE

The application should feel like a real production SaaS/property-management application.

Tenant flow:

LOGIN
↓
TENANT DASHBOARD
↓
VIEW RENT
↓
PAY RENT
↓
PAYMENT VERIFICATION
↓
RECEIPT
↓
PAYMENT HISTORY

Maintenance flow:

LOGIN
↓
MAINTENANCE
↓
CREATE REQUEST
↓
ADMIN REVIEWS
↓
IN PROGRESS
↓
RESOLVED

Admin flow:

ADMIN LOGIN
↓
DASHBOARD
↓
VIEW 15 APARTMENTS
↓
MANAGE TENANTS
↓
MANAGE RENT
↓
TRACK PAYMENTS
↓
MANAGE MAINTENANCE
↓
REPORTS

35. IMPORTANT IMPLEMENTATION RULES

Do not build this as a static mockup.

Build the actual application architecture with:

Working authentication

Working database

Working CRUD operations

Working tenant/admin roles

Working RLS

Working rent records

Working payment records

Working maintenance requests

Working notices

Working dashboards

If a third-party service such as Razorpay cannot be configured yet, create a clean integration interface and Demo Payment Mode rather than pretending that real payments work.

Use environment variables for secrets.

Keep the code modular and maintainable.

Create reusable components.

Avoid hardcoding tenant information into the frontend.

The 15 apartments should be stored in the database.

36. FINAL ACCEPTANCE TEST

Before considering the application complete, verify these scenarios:

Admin can login.

Tenant can login.

Tenant APT-001 cannot see APT-002 data.

Admin can see all 15 apartments.

Admin can assign tenants.

Admin can set rent.

Monthly rent records can be created.

Tenant can see current rent.

Tenant can see payment history.

Tenant can create maintenance request.

Admin can update maintenance status.

Admin can publish notices.

Tenant can see appropriate notices.

Admin can record offline payment.

Payment status updates correctly.

Overdue rent is identified.

Receipt can be generated.

Logout works.

Protected pages cannot be accessed without authentication.

Supabase RLS prevents cross-tenant data access.

Application works on mobile.

No secret API keys are exposed.

No duplicate monthly rent records are created.

37. DEVELOPMENT APPROACH

First create the complete UI and database schema.

Then implement:

PHASE 1:
Authentication + roles

PHASE 2:
Apartments + tenants

PHASE 3:
Rent management

PHASE 4:
Payment records + receipts

PHASE 5:
Maintenance

PHASE 6:
Notices

PHASE 7:
Reports

PHASE 8:
Razorpay integration

PHASE 9:
Security testing + responsive testing

Do not skip database security.

Start by creating the database schema, authentication, RLS policies, and core application layout, then build the tenant and admin dashboards on top of that foundation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://home-rental-management.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/695f866f-06d7-4953-a15b-2dd7a192c6f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
