import type { Meta, StoryObj } from '@storybook/react';
import DeveloperGuide from './DeveloperGuide';

const meta: Meta<typeof DeveloperGuide> = {
  title: 'Admin/DeveloperGuide',
  component: DeveloperGuide,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive developer guide and documentation system for the VMB platform. Includes platform overview, Storybook integration, component library documentation, and development workflow guidelines.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <DeveloperGuide />
    </div>
  ),
};

export const Overview: Story = {
  render: () => (
    <div className="p-6">
      <DeveloperGuide />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the platform architecture overview with frontend and backend technology stacks.',
      },
    },
  },
};

export const StorybookSetup: Story = {
  render: () => (
    <div className="p-6">
      <DeveloperGuide />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Documentation for Storybook integration, including features and quick start commands.',
      },
    },
  },
};