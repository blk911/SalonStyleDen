import type { Meta, StoryObj } from '@storybook/react';
import { VmbStyleOptions } from '../client/src/components/promos/VmbStyleOptions';

const meta: Meta<typeof VmbStyleOptions> = {
  title: 'VMB/VmbStyleOptions',
  component: VmbStyleOptions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onStyleSelect: (style: string) => console.log('Selected style:', style),
  },
};

export const WithCustomCallback: Story = {
  args: {
    onStyleSelect: (style: string) => alert(`You selected: ${style}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'VMB Style Options with a custom callback that shows an alert.',
      },
    },
  },
};