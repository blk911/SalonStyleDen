import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the card',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card story
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

// Card with different states
export const WithActionButton: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Salon Information</CardTitle>
        <CardDescription>Manage your salon details and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Owner:</span>
            <span className="text-sm">John Doe</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Email:</span>
            <span className="text-sm">john@salon.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Phone:</span>
            <span className="text-sm">555-0123</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
          Edit
        </button>
        <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
          Delete
        </button>
      </CardFooter>
    </Card>
  ),
};

// Interactive card with form elements
export const Interactive: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>License Verification</CardTitle>
        <CardDescription>Update license information for compliance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">License Number</label>
          <input 
            type="text" 
            placeholder="Enter license number" 
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">State</label>
          <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
            <option>Select state</option>
            <option>California</option>
            <option>New York</option>
            <option>Texas</option>
          </select>
        </div>
      </CardContent>
      <CardFooter>
        <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          Verify License
        </button>
      </CardFooter>
    </Card>
  ),
};