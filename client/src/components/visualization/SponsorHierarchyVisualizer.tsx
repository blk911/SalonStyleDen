import { useState, useEffect } from 'react';
import { User2, UserRound, User, Building2, RefreshCw } from 'lucide-react';

// Define types for our sponsor hierarchy data
interface SponsorMember {
  id: number;
  name: string;
  type: 'salon' | 'client';
  gender?: 'male' | 'female' | 'unknown';
  isInvitation?: boolean;
  children: SponsorMember[];
}

interface SponsorHierarchyVisualizerProps {
  data: SponsorMember | null;
  loading?: boolean;
}

export function SponsorHierarchyVisualizer({ 
  data, 
  loading = false 
}: SponsorHierarchyVisualizerProps) {
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading sponsor hierarchy...</p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <User2 className="h-16 w-16 text-gray-300 mb-4" />
        <p>No sponsor hierarchy data available</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white rounded-md shadow w-full overflow-auto">
      <RenderSponsorNode node={data} level={0} />
    </div>
  );
}

// Recursive component to render each node in the hierarchy
function RenderSponsorNode({ node, level }: { node: SponsorMember; level: number }) {
  return (
    <div className="relative">
      {/* The node itself */}
      <div 
        className={`flex items-center ${
          node.isInvitation ? 'text-gray-500 italic' : ''
        } ${level > 0 ? 'mt-2' : 'mb-4'}`}
        style={{ marginLeft: level > 0 ? `${level * 40}px` : '0' }}
      >
        {/* Connector line from parent */}
        {level > 0 && (
          <div 
            className="absolute border-t-2 border-gray-300" 
            style={{ 
              width: '20px', 
              left: `${(level * 40) - 20}px`,
              top: '16px',
            }}
          />
        )}
        
        {/* Vertical connector line to parent */}
        {level > 0 && (
          <div 
            className="absolute border-l-2 border-gray-300" 
            style={{ 
              height: '16px', 
              left: `${(level * 40) - 20}px`,
              top: '0px',
            }}
          />
        )}
        
        {/* Icon based on type and gender */}
        <div className="relative z-10 bg-white p-1">
          {node.type === 'salon' ? (
            <Building2 
              className="h-6 w-6 text-blue-600 mr-2" 
              aria-label="Salon" 
            />
          ) : node.gender === 'male' ? (
            <User 
              className="h-6 w-6 text-blue-500 mr-2" 
              aria-label="Male client" 
            />
          ) : node.gender === 'female' ? (
            <User 
              className="h-6 w-6 text-pink-500 mr-2" 
              aria-label="Female client" 
            />
          ) : (
            <UserRound 
              className="h-6 w-6 text-gray-500 mr-2" 
              aria-label="Client" 
            />
          )}
        </div>
        
        {/* Node label with ID */}
        <div className="flex flex-col">
          <span className="font-medium">{node.name}</span>
          <span className="text-xs text-gray-500">ID: {node.id}</span>
        </div>
        
        {/* Status indicator for invitations */}
        {node.isInvitation && (
          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Pending Invitation
          </span>
        )}
      </div>
      
      {/* Render children recursively */}
      {node.children.length > 0 && (
        <div className="ml-6">
          {node.children.map((child, index) => (
            <RenderSponsorNode 
              key={`${child.id}-${index}`} 
              node={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}