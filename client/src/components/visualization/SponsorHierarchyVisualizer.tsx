import { useState, useEffect } from 'react';
import { User2, UserRound, User, Building2, RefreshCw, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

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
    <div className="p-6 bg-white rounded-md shadow w-full overflow-auto">
      <h3 className="font-bold text-xl mb-6 text-purple-800">
        VMB Sponsor Network Hierarchy
        <div className="text-xs font-semibold text-purple-500 ml-2 inline-block tracking-wider">
          L ↑ L ↓
        </div>
      </h3>
      <div className="sponsor-hierarchy border-t-2 border-purple-800 pt-4">
        <RenderSponsorNode node={data} level={0} />
      </div>
    </div>
  );
}

// Recursive component to render each node in the hierarchy
function RenderSponsorNode({ node, level }: { node: SponsorMember; level: number }) {
  const [expanded, setExpanded] = useState(true);
  
  // Use consistent indentation for all levels
  const indentSize = 40; // px
  const leftIndent = level * indentSize;
  
  // Define vertical spacing for nodes
  const nodeSpacing = 12; // px
  
  // Determine dashboard URL based on node type and ID
  const getDashboardUrl = () => {
    if (node.isInvitation) return null; // Invitations don't have dashboards
    
    if (node.type === 'salon') {
      return `/salon-dashboard/${node.id}`;
    } else {
      return `/client-dashboard/${node.id}`;
    }
  };
  
  const dashboardUrl = getDashboardUrl();
  
  // Logic to toggle expand/collapse
  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  return (
    <div className="relative node-container" style={{ marginBottom: `${nodeSpacing}px` }}>
      {/* Category header for the level */}
      {level === 0 && (
        <div className="absolute -top-4 right-0 left-0 flex items-center">
          <div className="flex-grow border-b border-gray-200"></div>
          <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full ml-auto">
            Level {level}
          </div>
        </div>
      )}
      
      {/* The node itself with appropriate indentation */}
      <div 
        className={`flex items-center ${
          node.isInvitation ? 'text-gray-500 italic' : ''
        } ${level > 0 ? 'mt-3' : 'mb-5 font-bold text-lg'} group`}
        style={{ marginLeft: level > 0 ? `${leftIndent}px` : '0' }}
      >
        {/* Toggle expand/collapse button (only if node has children) */}
        {node.children.length > 0 && (
          <button 
            onClick={toggleExpanded}
            className="absolute -left-6 top-1 p-1 rounded-full hover:bg-gray-100"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
        
        {/* Connector line from parent - horizontal line */}
        {level > 0 && (
          <div 
            className="absolute border-t-2 border-gray-300" 
            style={{ 
              width: '25px', 
              left: `${leftIndent - 25}px`,
              top: '16px',
            }}
          />
        )}
        
        {/* Vertical connector line to parent */}
        {level > 0 && (
          <div 
            className="absolute border-l-2 border-gray-300" 
            style={{ 
              height: '20px', 
              left: `${leftIndent - 25}px`,
              top: '-4px',
            }}
          />
        )}
        
        {/* Icon based on type and gender */}
        <div className={`relative z-10 rounded-full p-1 ${
          node.type === 'salon' ? 'bg-blue-50' : 
          node.gender === 'male' ? 'bg-blue-50' : 
          node.gender === 'female' ? 'bg-pink-50' : 'bg-gray-50'
        }`}>
          {node.type === 'salon' ? (
            <Building2 
              className="h-7 w-7 text-blue-600 mr-2" 
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
        
        {/* Node label with ID - Wrapped in Link if has dashboard */}
        {dashboardUrl ? (
          <Link to={dashboardUrl} className="flex flex-col ml-2 group hover:cursor-pointer">
            <span className={`font-medium ${node.type === 'salon' ? 'text-blue-700' : ''} group-hover:underline`}>
              {node.name}
              <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="text-xs text-gray-500">
              ID: {Math.abs(node.id)} {node.isInvitation && '(Invitation)'}
            </span>
          </Link>
        ) : (
          <div className="flex flex-col ml-2">
            <span className={`font-medium ${node.type === 'salon' ? 'text-blue-700' : ''}`}>
              {node.name}
            </span>
            <span className="text-xs text-gray-500">
              ID: {Math.abs(node.id)} {node.isInvitation && '(Invitation)'}
            </span>
          </div>
        )}
        
        {/* Status indicator for invitations */}
        {node.isInvitation && (
          <span className="ml-3 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Pending
          </span>
        )}
        
        {/* Level indicator */}
        <span className="ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
          Level {level}
        </span>
      </div>
      
      {/* Vertical connector line to children (only if there are children and expanded) */}
      {node.children.length > 0 && expanded && (
        <div 
          className="absolute border-l-2 border-gray-300" 
          style={{ 
            height: '12px', 
            left: level === 0 ? '15px' : `${leftIndent + 15}px`,
            top: '28px',
          }}
        />
      )}
      
      {/* Render children recursively - only if expanded */}
      {node.children.length > 0 && expanded && (
        <div className="children-container">
          {/* Category header for child level */}
          {node.children.length > 0 && level < 5 && (
            <div 
              className="relative" 
              style={{ marginLeft: level === 0 ? '20px' : `${leftIndent + 20}px` }}
            >
              <div className="absolute flex items-center w-full">
                <div className="flex-grow border-b border-gray-200"></div>
                <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full ml-auto">
                  Level {level + 1}
                </div>
              </div>
            </div>
          )}
          
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