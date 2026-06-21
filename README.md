# UserPersona Demo Website

This repository is a static, deployable copy of the Demo-Safe target app.

## Local Files

- `index.html` redirects to the demo route.
- `demo-app/index.html` redirects to the account settings demo.
- `demo-app/account-settings/index.html` is the main account settings demo.

The `.html` files alongside the route folders are kept as direct-file aliases for static hosts and tooling that request the explicit file path.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Create a new Vercel project.
3. Use the repository root as the project root directory.
4. Use framework preset `Other` or `Static`.
5. Leave the build command empty and the output directory empty or `.`.
6. Deploy.

The Browserbase target URL will be:

```text
https://your-vercel-project.vercel.app/demo-app/account-settings
```

Use this URL in PersonaProbe Real Website Mode, or set the main app's `NEXT_PUBLIC_DEMO_BASE_URL` to:

```text
https://your-vercel-project.vercel.app
```
