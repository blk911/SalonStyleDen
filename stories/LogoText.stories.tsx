import type { Meta, StoryObj } from '@storybook/react';
import { LogoText } from '../client/src/components/shared/LogoText';

const meta: Meta<typeof LogoText> = {
  title: 'Shared/LogoText',
  component: LogoText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Large: Story = {
  args: {
    className: 'text-4xl',
  },
};

export const Small: Story = {
  args: {
    className: 'text-sm',
  },
};

export const Colored: Story = {
  args: {
    className: 'text-pink-600',
  },
};