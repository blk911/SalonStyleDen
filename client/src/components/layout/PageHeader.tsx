import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="hidden md:flex p-1.5 rounded-lg bg-primary/10">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;