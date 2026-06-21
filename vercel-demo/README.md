# UserPersona Demo Website

This folder is a static, deployable copy of the Demo-Safe target app.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Create a new Vercel project.
3. Set the project root directory to `vercel-demo`.
4. Use framework preset `Other` or `Static`.
5. Leave the build command empty and the output directory empty or `.`.
6. Deploy.

The Browserbase target URL will be:

```text
https://your-vercel-project.vercel.app/demo-app/account-settings
```

This folder uses real static route files:

```text
index.html
demo-app/index.html
demo-app/account-settings/index.html
```

So it does not require a build step.

Use this URL in PersonaProbe Real Website Mode, or set the main app's `NEXT_PUBLIC_DEMO_BASE_URL` to:

```text
https://your-vercel-project.vercel.app
```
