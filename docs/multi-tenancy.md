# Multi-Tenancy Implementation & Testing

## Architecture
ConnectIQ uses a **Dynamic Workspace Isolation** model. Every community has its own `slug` (e.g., `google`, `hackathon`) which acts as the root of its URL structure.

### URL Structure
- `localhost:3000/community`: Global community hub (where you join or create communities).
- `localhost:3000/[tenant]`: Community dashboard.
- `localhost:3000/[tenant]/chat`: Community-specific real-time chat.
- `localhost:3000/[tenant]/leaderboard`: Community-specific live ranking.

## Local Development Testing (Subdomains)

To test the full subdomain-based multi-tenant behavior on your local machine:

1. **Configure Hosts**: Open your `C:\Windows\System32\drivers\etc\hosts` file as Administrator and add:
   ```text
   127.0.0.1 genius.localhost
   127.0.0.1 alpha.localhost
   ```
2. **Access the Subdomain**: Navigate to `http://genius.localhost:3000`.
3. **Verify Isolation**:
   - Open `http://genius.localhost:3000/chat` in one tab.
   - Open `http://alpha.localhost:3000/chat` in another.
   - Send a message in "Genius." It will **not** appear in "Alpha," confirming the subdomain-level data isolation.

## Alternative Path-based Testing
If you prefer not to edit your hosts file, you can still test using dynamic path segments:
- `http://localhost:3000/genius`
- `http://localhost:3000/alpha`

## Deployment Note (Vercel)

> [!WARNING]
> **Subdomain Limitation**
> On localhost, we use path-based multi-tenancy (`/[tenant]`). While this is highly effective for testing logic, production-grade multi-tenancy often uses subdomains (`tenant.yourdomain.com`).
> Due to Vercel's standard deployment configuration and DNS limitations for free/hobby tiers, the **custom subdomain routing might not work out-of-the-box** without a Wildcard SSL certificate and specific Middleware configurations that are not supported on all Vercel plans.
> For the purpose of this hackathon, we recommend using the **path-based routing** (`domain.com/[tenant]`) as it is guaranteed to work across all environments.
