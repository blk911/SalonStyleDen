import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Code, 
  Palette, 
  Database, 
  Globe, 
  Monitor,
  ExternalLink,
  Play,
  FileText,
  Layers
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function DeveloperGuide() {
  const [activeSection, setActiveSection] = useState("overview");

  const guideSections: GuideSection[] = [
    {
      id: "overview",
      title: "Platform Overview",
      description: "Understanding the VMB platform architecture",
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">VMB Platform Architecture</h3>
            <p className="text-gray-600 mb-4">
              VMB is a comprehensive salon management platform built with modern web technologies.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Frontend Stack
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="secondary">React + TypeScript</Badge>
                  <Badge variant="secondary">Wouter (Routing)</Badge>
                  <Badge variant="secondary">TanStack Query</Badge>
                  <Badge variant="secondary">Shadcn/UI</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Backend Stack
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="secondary">Express.js</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">Drizzle ORM</Badge>
                  <Badge variant="secondary">Session Auth</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "storybook",
      title: "Storybook Setup",
      description: "Visual component documentation and testing",
      icon: <Book className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Storybook Integration</h3>
            <p className="text-gray-600 mb-4">
              Storybook is now configured for visual component development and documentation.
            </p>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Features Available</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Play className="w-3 h-3 text-green-500" />
                    Interactive component preview
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-blue-500" />
                    Auto-generated documentation
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="w-3 h-3 text-purple-500" />
                    Component state testing
                  </li>
                  <li className="flex items-center gap-2">
                    <Palette className="w-3 h-3 text-orange-500" />
                    Props and args manipulation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Quick Start Commands</h4>
              <div className="space-y-2 font-mono text-sm">
                <div className="bg-white p-2 rounded border">
                  <code>npm run storybook</code>
                  <span className="text-gray-500 ml-2">- Start Storybook server</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <code>npm run build-storybook</code>
                  <span className="text-gray-500 ml-2">- Build static Storybook</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "components",
      title: "Component Library",
      description: "UI components and design system",
      icon: <Layers className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">UI Component System</h3>
            <p className="text-gray-600 mb-4">
              VMB uses Shadcn/UI components with custom styling and Tailwind CSS.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Layout Components</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Navbar</div>
                  <div>Footer</div>
                  <div>Card variants</div>
                  <div>ScrollArea</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Form Components</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Button variants</div>
                  <div>Input fields</div>
                  <div>Select dropdowns</div>
                  <div>Form validation</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Display</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Tables</div>
                  <div>Badges</div>
                  <div>Tooltips</div>
                  <div>Alert dialogs</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "development",
      title: "Development Workflow",
      description: "Best practices and development guidelines",
      icon: <Monitor className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Development Guidelines</h3>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">File Structure</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-mono space-y-1">
                  <div>client/src/components/ - Reusable UI components</div>
                  <div>client/src/pages/ - Route-based page components</div>
                  <div>client/src/hooks/ - Custom React hooks</div>
                  <div>client/src/lib/ - Utility functions and configurations</div>
                  <div>server/ - Express.js backend</div>
                  <div>shared/ - Shared types and schemas</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Code Standards</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>• Use TypeScript for type safety</div>
                <div>• Follow React hooks patterns</div>
                <div>• Implement proper error handling</div>
                <div>• Use Drizzle ORM for database operations</div>
                <div>• Apply consistent naming conventions</div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800">Testing Strategy</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Use Storybook for component testing</div>
                <div>• Implement unit tests for utilities</div>
                <div>• Test API endpoints thoroughly</div>
                <div>• Validate database schemas</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeGuideSection = guideSections.find(section => section.id === activeSection);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Developer Guide</h2>
          <p className="text-gray-600">Comprehensive platform documentation and development resources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://storybook.js.org" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Storybook Docs
            </a>
          </Button>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4">
          {guideSections.map((section) => (
            <TabsTrigger 
              key={section.id} 
              value={section.id}
              className="flex items-center gap-2"
            >
              {section.icon}
              <span className="hidden sm:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {guideSections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {section.icon}
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {section.content}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}