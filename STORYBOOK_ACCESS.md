# VMB Platform Storybook - Component Documentation

## Access Instructions

### 1. Storybook URL
Your Storybook is running on port 6006. Access it via:
- **Local Development**: `http://localhost:6006`
- **Replit Preview**: Use the preview panel and change the port to `6006`
- **Direct URL**: `https://[your-replit-slug].replit.dev:6006`

### 2. Starting Storybook

To manually start Storybook, run:
```bash
npm run storybook
```

Or use the direct command:
```bash
npx storybook dev -p 6006 --host 0.0.0.0
```

### 3. Available Components

Your Storybook includes documentation for:

#### UI Components
- **Button** - All button variants and sizes
- **Card** - Card layouts with headers, content, and footers
- **Form Components** - Input fields, validation, and form layouts

#### VMB Platform Components
- **VmbStyleOptions** - Style selection interface
- **ClientForm** - Client registration and editing
- **LogoText** - Brand logo component
- **AdminDashboard** - Admin interface overview
- **GiftsPage** - Gift management interface

#### Design System
- Interactive controls for testing different props
- Responsive design previews
- Code examples and documentation
- Dark/light theme support

### 4. Features

- **Interactive Controls**: Test different props and states
- **Responsive Preview**: See how components look on different screen sizes
- **Code Examples**: Copy-paste ready code snippets
- **Auto-documentation**: Generated from TypeScript interfaces
- **Accessibility**: Built-in accessibility testing

### 5. Adding New Stories

To document a new component, create a `.stories.tsx` file:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from '../path/to/component';

const meta: Meta<typeof YourComponent> = {
  title: 'Category/YourComponent',
  component: YourComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // your props here
  },
};
```

### 6. Building for Production

To build Storybook for deployment:
```bash
npm run build-storybook
```

## Next Steps

1. Open Storybook in your browser
2. Explore the component categories in the sidebar
3. Use the Controls panel to test different component states
4. Reference the code examples when implementing features
5. Add stories for new components as you build them

Your VMB platform now has comprehensive component documentation that will help with development, testing, and design consistency.