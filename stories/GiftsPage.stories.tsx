import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock GiftsPage component for demonstration
const MockGiftsPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gift Management</h1>
        <button className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700">
          Create New Gift
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Gifts */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-green-600 mb-2">Active Gift</h3>
          <div className="space-y-2">
            <p className="font-medium">Manicure Service</p>
            <p className="text-sm text-gray-600">Value: $35.00</p>
            <p className="text-sm text-gray-600">Expires: Dec 31, 2025</p>
            <p className="text-sm text-gray-600">From: Sarah's Salon</p>
            <div className="flex gap-2 mt-3">
              <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Redeem
              </button>
              <button className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Pending Gift */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-orange-600 mb-2">Pending Gift</h3>
          <div className="space-y-2">
            <p className="font-medium">Facial Treatment</p>
            <p className="text-sm text-gray-600">Value: $75.00</p>
            <p className="text-sm text-gray-600">Expires: Jan 15, 2026</p>
            <p className="text-sm text-gray-600">From: Beauty Haven</p>
            <div className="flex gap-2 mt-3">
              <button className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Accept
              </button>
              <button className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                Decline
              </button>
            </div>
          </div>
        </div>

        {/* Redeemed Gift */}
        <div className="border rounded-lg p-4 opacity-75">
          <h3 className="font-semibold text-gray-600 mb-2">Redeemed</h3>
          <div className="space-y-2">
            <p className="font-medium">Hair Cut & Style</p>
            <p className="text-sm text-gray-600">Value: $60.00</p>
            <p className="text-sm text-gray-600">Redeemed: Nov 15, 2025</p>
            <p className="text-sm text-gray-600">At: Tiffany's Studio</p>
            <div className="mt-3">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Gift Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">12</p>
            <p className="text-sm text-gray-600">Active Gifts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">3</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">28</p>
            <p className="text-sm text-gray-600">Redeemed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">$1,250</p>
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof MockGiftsPage> = {
  title: 'Pages/GiftsPage',
  component: MockGiftsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main gifts management page where users can view, create, and manage their gifts and rewards.',
      },
    },
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

export const Empty: Story = {
  render: () => (
    <div className="container mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Gift Management</h1>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
        <p className="text-gray-500 mb-4">No gifts available</p>
        <button className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700">
          Create Your First Gift
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no gifts are available.',
      },
    },
  },
};