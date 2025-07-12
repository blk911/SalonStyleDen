import { Link } from 'wouter';
import BrandName from '@/components/ui/BrandName';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-1.5">
      <div className="max-w-7xl mx-auto px-2">
        <div className="text-center text-[10px] text-gray-400">
          <p>&copy; {new Date().getFullYear()} <BrandName size="xs" inline withExclamation={false} /> All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}