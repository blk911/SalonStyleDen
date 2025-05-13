import React from "react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  price,
  duration,
  imageUrl,
  className,
}) => {
  return (
    <div className={cn("service-card-container", className)}>
      <div className="service-card">
        <div className="service-info">
          <h3 className="service-title">{title}</h3>
          <p className="service-description">{description}</p>
          <div className="service-price-time">
            <span className="service-price">${price}</span>
            <span className="service-duration">{duration} min</span>
          </div>
        </div>
        {imageUrl && (
          <div className="service-image-container">
            <img src={imageUrl} alt={title} className="service-image" />
          </div>
        )}
      </div>
      {/* Styles applied using Tailwind classes instead of jsx */}
    </div>
  );
};

// Usage example component with fetching from API
export const ServiceCardWithFetch: React.FC<{ serviceId: number }> = ({ serviceId }) => {
  const [service, setService] = React.useState<{
    title: string;
    description: string;
    price: number;
    duration: number;
    imageUrl?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/${serviceId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch service: ${response.status}`);
        }
        const data = await response.json();
        setService({
          title: data.name,
          description: data.description,
          price: data.price / 100, // Assuming price is stored in cents
          duration: data.duration,
          imageUrl: data.imageUrl,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        console.error("Error fetching service:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  if (loading) {
    return <div className="p-4 animate-pulse bg-gray-100 rounded-md h-24"></div>;
  }

  if (error || !service) {
    return <div className="p-4 text-red-500">Failed to load service information</div>;
  }

  return <ServiceCard {...service} />;
};

// Sample data direct implementation (for hard-coded usage)
export const GlamMeCustomDesignCard: React.FC = () => {
  return (
    <ServiceCard
      title="Glam Me! Custom Design"
      description="Fully custom art, gems, 3D extras"
      price={125}
      duration={90}
      imageUrl="/assets/yours_truly.jpg"
    />
  );
};