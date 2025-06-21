# VMB Platform - Storybook Setup Complete

## Access Your Component Documentation

### Option 1: Replit Preview Panel
1. Open the preview panel in your Replit
2. Change the port from 5000 to **6006**
3. Your Storybook will load with interactive component documentation

### Option 2: Direct Browser Access
Visit: `https://your-replit-domain.replit.dev:6006`

## What's Available

### Interactive Component Stories
- **UI/Button** - All button variants with live controls
- **UI/Card** - Card layouts and compositions
- **Forms/ClientForm** - Client registration forms
- **VMB/VmbStyleOptions** - Style selection interface
- **Shared/LogoText** - Brand components
- **Pages/AdminDashboard** - Dashboard overview
- **Pages/GiftsPage** - Gift management interface

### Features You Get
- **Live Editing**: Modify props in real-time using the Controls panel
- **Responsive Testing**: See components on different screen sizes
- **Code Examples**: Copy-paste ready implementation code
- **Auto Documentation**: Generated from your TypeScript interfaces
- **Design Tokens**: Access to your Tailwind CSS classes and theme

### Adding New Components
1. Create a `.stories.tsx` file next to your component
2. Stories automatically appear in the sidebar
3. Use the existing stories as templates

## Current Setup
- Running on port 6006
- Configured with your Tailwind CSS theme
- Includes all your existing VMB platform components
- Auto-generates documentation from TypeScript

Your VMB platform now has professional component documentation that will help with development consistency and team collaboration.

## Starting Storybook Manually
If needed, restart with:
```bash
npx storybook dev -p 6006 --host 0.0.0.0
```