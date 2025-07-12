import React, { createContext, useState, useContext, ReactNode } from 'react';

interface NavigationContextState {
  title: string;
  showBackButton: boolean;
  backButtonDestination: string;
}

interface NavigationContextType {
  navigation: NavigationContextState;
  updateNavigation: (navigationUpdate: Partial<NavigationContextState>) => void;
}

const defaultNavigationState: NavigationContextState = {
  title: 'VMB Limited',
  showBackButton: false,
  backButtonDestination: '/',
};

const NavigationContext = createContext<NavigationContextType>({
  navigation: defaultNavigationState,
  updateNavigation: () => {},
});

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [navigation, setNavigation] = useState<NavigationContextState>(defaultNavigationState);

  const updateNavigation = (navigationUpdate: Partial<NavigationContextState>) => {
    setNavigation((prev) => ({
      ...prev,
      ...navigationUpdate,
    }));
  };

  return (
    <NavigationContext.Provider value={{ navigation, updateNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => useContext(NavigationContext);