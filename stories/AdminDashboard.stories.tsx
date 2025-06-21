import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AdminDashboard component for story purposes
const MockAdminDashboard = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-medium">Total Clients</h3>
            <p className="text-2xl font-bold text-blue-600">127</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-medium">Active Salons</h3>
            <p className="text-2xl font-bold text-green-600">15</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-medium">Pending Invites</h3>
            <p className="text-2xl font-bold text-orange-600">8</p>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>New client registration</span>
            <span className="text-sm text-gray-500">2 minutes ago</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Salon verification completed</span>
            <span className="text-sm text-gray-500">5 minutes ago</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Gift claim processed</span>
            <span className="text-sm text-gray-500">10 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof MockAdminDashboard> = {
  title: 'Pages/AdminDashboard',
  component: MockAdminDashboard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  render: () => (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="border rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="border rounded p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="border rounded p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state of the admin dashboard with skeleton placeholders.',
      },
    },
  },
};