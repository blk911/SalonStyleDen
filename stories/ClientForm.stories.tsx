import type { Meta, StoryObj } from '@storybook/react';
import { ClientForm } from '../client/src/components/forms/ClientForm';

const meta: Meta<typeof ClientForm> = {
  title: 'Forms/ClientForm',
  component: ClientForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (data: any) => console.log('Form submitted:', data),
  },
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      name: 'John Doe',
      phone: '555-0123',
      email: 'john@example.com',
    },
    onSubmit: (data: any) => console.log('Form submitted:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'Client form pre-filled with initial data for editing existing clients.',
      },
    },
  },
};

export const ReadOnly: Story = {
  args: {
    initialData: {
      name: 'Jane Smith',
      phone: '555-0456',
      email: 'jane@example.com',
    },
    readOnly: true,
    onSubmit: (data: any) => console.log('Form submitted:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'Client form in read-only mode for viewing client information.',
      },
    },
  },
};